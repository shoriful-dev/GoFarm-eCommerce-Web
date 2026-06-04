import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { writeClient } from "@/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, approve, adminEmail, reason } = await request.json();

    if (!accountId || typeof approve !== "boolean" || !adminEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is admin (implement your own admin check logic)
    // For now, we'll assume the request is valid

    if (approve) {
      // Approve the business account
      const result = await writeClient
        .patch(accountId)
        .set({
          isBusiness: true,
          businessStatus: "active",
          membershipType: "business",
          businessApprovedBy: adminEmail,
          businessApprovedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.json({
        success: true,
        message: "Business account approved successfully",
        account: result,
      });
    } else {
      // Reject the business account
      const result = await writeClient
        .patch(accountId)
        .set({
          isBusiness: false,
          businessStatus: "rejected",
          businessApprovedBy: adminEmail,
          businessApprovedAt: new Date().toISOString(),
          rejectionReason: reason || "No reason provided",
          updatedAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.json({
        success: true,
        message: "Business account rejected",
        account: result,
      });
    }
  } catch (error) {
    console.error("Error updating business account:", error);
    return NextResponse.json(
      { error: "Failed to update business account" },
      { status: 500 }
    );
  }
}
