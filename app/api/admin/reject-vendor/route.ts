import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { writeClient } from "@/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    // Add admin authentication check
    const adminUserId = await getAuthUserId();
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, message: "Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vendorId, reason } = body;

    if (!vendorId || !reason) {
      return NextResponse.json(
        { success: false, message: "Vendor ID and reason are required" },
        { status: 400 }
      );
    }

    // Update vendor status to rejected
    await writeClient
      .patch(vendorId)
      .set({
        isVendor: false,
        vendorStatus: "rejected",
        vendorRejectedAt: new Date().toISOString(),
        vendorRejectionReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Vendor application rejected",
    });
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reject vendor application" },
      { status: 500 }
    );
  }
}
