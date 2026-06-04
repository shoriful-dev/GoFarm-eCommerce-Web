import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Combined API endpoint to fetch all user data in a single request
 * Optimized for Next.js 16 and React 19
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all data in parallel
    const [user, orders, notifications] = await Promise.all([
      // Get user data including role, vendor status, employee flag
      client.fetch(
        `*[_type == "user" && firebaseUid == $userId][0]{
          _id,
          email,
          role,
          isAdmin,
          isEmployee,
          isVendor,
          vendorStatus,
          walletBalance
        }`,
        { userId },
      ),
      // Get orders count
      client.fetch(`count(*[_type == "order" && userId == $userId])`, {
        userId,
      }),
      // Get unread notifications count
      client.fetch(
        `*[_type == "notification" && userId == $userId && !read] | order(_createdAt desc)[0...20]{
          _id,
          read
        }`,
        { userId },
      ),
    ]);

    return NextResponse.json(
      {
        user: user || null,
        ordersCount: orders || 0,
        role: user?.role || null,
        isAdmin: user?.role === "admin" || user?.isAdmin === true,
        isEmployee: user?.isEmployee || false,
        // Vendor access: role is the source of truth. Either role=vendor
        // OR the legacy `isVendor` flag with an active vendorStatus grants
        // vendor access. This matches the admin user-edit endpoint, which
        // now treats role=vendor as instant vendor activation.
        isVendor:
          user?.role === "vendor" ||
          (Boolean(user?.isVendor) && user?.vendorStatus === "active"),
        vendorStatus: user?.vendorStatus || null,
        unreadNotifications: notifications?.length || 0,
        walletBalance: user?.walletBalance || 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "CDN-Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching combined user data:", error);
    return NextResponse.json(
      {
        user: null,
        ordersCount: 0,
        role: null,
        isAdmin: false,
        isEmployee: false,
        isVendor: false,
        vendorStatus: null,
        unreadNotifications: 0,
        walletBalance: 0,
      },
      { status: 200 },
    );
  }
}
