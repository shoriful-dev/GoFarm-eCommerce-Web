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
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Reset vendor status to none (cancelled)
    await writeClient
      .patch(vendorId)
      .set({
        isVendor: false,
        vendorStatus: "none",
        vendorApprovedBy: undefined,
        vendorApprovedAt: undefined,
        vendorRejectedAt: undefined,
        vendorRejectionReason: undefined,
        vendorSuspendedAt: undefined,
        vendorSuspendedBy: undefined,
        vendorSuspensionReason: undefined,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Vendor status cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling vendor status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel vendor status" },
      { status: 500 }
    );
  }
}
