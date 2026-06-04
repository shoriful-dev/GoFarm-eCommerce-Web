import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total count of orders for this user
    const query = `count(*[_type == 'order' && firebaseUid == $userId])`;
    const totalOrders = await client.fetch(query, { userId: user.uid });

    return NextResponse.json({
      success: true,
      totalOrders: totalOrders || 0,
    });
  } catch (error: unknown) {
    console.error("Error fetching orders count:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch orders count";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
