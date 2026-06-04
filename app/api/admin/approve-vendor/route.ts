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

    // Get admin email (you can customize this based on your auth setup)
    const adminEmail = adminUserId; // Or fetch from your user system

    // Update vendor status to active
    await writeClient
      .patch(vendorId)
      .set({
        isVendor: true,
        vendorStatus: "active",
        vendorApprovedBy: adminEmail,
        vendorApprovedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Vendor account approved successfully! 🎉",
    });
  } catch (error) {
    console.error("Error approving vendor:", error);
    return NextResponse.json(
      { success: false, message: "Failed to approve vendor account" },
      { status: 500 }
    );
  }
}
