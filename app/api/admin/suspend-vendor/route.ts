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

    // Get admin email
    const adminEmail = adminUserId;

    // Update vendor status to suspended
    await writeClient
      .patch(vendorId)
      .set({
        isVendor: false, // Disable vendor privileges
        vendorStatus: "suspended",
        vendorSuspendedAt: new Date().toISOString(),
        vendorSuspendedBy: adminEmail,
        vendorSuspensionReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Vendor account suspended successfully",
    });
  } catch (error) {
    console.error("Error suspending vendor:", error);
    return NextResponse.json(
      { success: false, message: "Failed to suspend vendor account" },
      { status: 500 }
    );
  }
}
