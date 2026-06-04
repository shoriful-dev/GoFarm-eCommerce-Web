import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { writeClient } from "@/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, orderId, orderNumber, firebaseUid } = body;

    if (!sessionId || !orderId || !firebaseUid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await adminAuth.getUser(firebaseUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update order status to completed
    await writeClient
      .patch(orderId)
      .set({
        paymentStatus: "paid",
        status: "processing",
        paidAt: new Date().toISOString(),
        clerkPaymentSession: sessionId,
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully",
      orderId,
      orderNumber,
    });
  } catch (error) {
    console.error("Error completing Clerk payment:", error);
    return NextResponse.json(
      { error: "Failed to complete payment" },
      { status: 500 }
    );
  }
}
