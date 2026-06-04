import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";

export async function GET() {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll fetch all users with business account requests
    const query = `
      *[_type == "userType" && businessStatus in ["pending", "active", "rejected"]] {
        _id,
        email,
        firstName,
        lastName,
        isBusiness,
        isActive,
        businessStatus,
        premiumStatus,
        businessApprovedBy,
        businessApprovedAt,
        businessAppliedAt,
        rejectionReason,
        membershipType,
        createdAt
      } | order(businessAppliedAt desc)
    `;

    const accounts = await client.fetch(query);

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error fetching business accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch business accounts" },
      { status: 500 }
    );
  }
}
