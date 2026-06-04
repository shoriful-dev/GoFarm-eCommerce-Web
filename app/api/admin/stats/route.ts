import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/firebase-admin-auth";
import { adminAuth } from "@/lib/firebase/admin";
import { client } from "@/sanity/lib/client";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    // Check if user is admin (checks both env var and Sanity isAdmin field)
    const { isAdmin, user } = await checkAdminAccess();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Calculate date ranges for comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Optimized: Fetch all data in a single GROQ query
    const [allStats, totalUsers] = await Promise.all([
      client.fetch(
        `{
          "totalOrders": count(*[_type == "order"]),
          "totalRevenue": *[_type == "order" && defined(totalPrice)].totalPrice,
          "totalProducts": count(*[_type == "product"]),
          "recentOrders": count(*[_type == "order" && dateTime(orderDate) >= dateTime($currentMonthStart)]),
          "recentRevenue": *[_type == "order" && dateTime(orderDate) >= dateTime($currentMonthStart) && defined(totalPrice)].totalPrice,
          "lastMonthOrders": count(*[_type == "order" && dateTime(orderDate) >= dateTime($lastMonthStart) && dateTime(orderDate) <= dateTime($lastMonthEnd)]),
          "lastMonthRevenue": *[_type == "order" && dateTime(orderDate) >= dateTime($lastMonthStart) && dateTime(orderDate) <= dateTime($lastMonthEnd) && defined(totalPrice)].totalPrice,
          "cardPayments": *[_type == "order" && paymentMethod == "card" && paymentStatus == "paid"].totalPrice,
          "codPaid": *[_type == "order" && paymentMethod == "cash_on_delivery" && paymentStatus == "paid"].totalPrice,
          "codPending": *[_type == "order" && paymentMethod == "cash_on_delivery" && paymentStatus == "pending"].totalPrice,
          "totalCardOrders": count(*[_type == "order" && paymentMethod == "card"]),
          "totalCodOrders": count(*[_type == "order" && paymentMethod == "cash_on_delivery"]),
          "codPendingOrders": count(*[_type == "order" && paymentMethod == "cash_on_delivery" && paymentStatus == "pending"])
        }`,
        {
          currentMonthStart: currentMonthStart.toISOString(),
          lastMonthStart: lastMonthStart.toISOString(),
          lastMonthEnd: lastMonthEnd.toISOString(),
        },
      ),

      // Get total users by paginating through Firebase Auth (source of truth).
      // Falls back to Sanity user count if Firebase is unreachable.
      (async () => {
        try {
          let total = 0;
          let pageToken: string | undefined = undefined;
          do {
            const page = await adminAuth.listUsers(1000, pageToken);
            total += page.users.length;
            pageToken = page.pageToken ?? undefined;
          } while (pageToken);
          return total;
        } catch (error) {
          console.error("Error counting Firebase users:", error);
          try {
            const sanityCount = await client.fetch(`count(*[_type == "user"])`);
            return sanityCount || 0;
          } catch {
            return 0;
          }
        }
      })(),
    ]);

    // Helper function to sum array values
    const sumArray = (arr: number[] | null | undefined): number => {
      return Array.isArray(arr) && arr.length > 0
        ? arr.reduce((sum, price) => sum + (price || 0), 0)
        : 0;
    };

    // Calculate sums
    const totalRevenue = sumArray(allStats.totalRevenue);
    const recentRevenue = sumArray(allStats.recentRevenue);
    const lastMonthRevenue = sumArray(allStats.lastMonthRevenue);
    const cardRevenue = sumArray(allStats.cardPayments);
    const codPaidRevenue = sumArray(allStats.codPaid);
    const codPendingRevenue = sumArray(allStats.codPending);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalRevenue,
      totalOrders: allStats.totalOrders || 0,
      totalUsers,
      totalProducts: allStats.totalProducts || 0,
      revenueChange: Number(
        calculateChange(recentRevenue, lastMonthRevenue).toFixed(1),
      ),
      ordersChange: Number(
        calculateChange(
          allStats.recentOrders || 0,
          allStats.lastMonthOrders || 0,
        ).toFixed(1),
      ),
      usersChange: totalUsers > 0 ? 5.2 : 0,
      productsChange: allStats.totalProducts > 0 ? 2.1 : 0,
      paymentBreakdown: {
        cardRevenue: Number(cardRevenue.toFixed(2)),
        codPaidRevenue: Number(codPaidRevenue.toFixed(2)),
        codPendingRevenue: Number(codPendingRevenue.toFixed(2)),
        totalCardOrders: allStats.totalCardOrders || 0,
        totalCodOrders: allStats.totalCodOrders || 0,
        codPendingOrders: allStats.codPendingOrders || 0,
      },
    };

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
