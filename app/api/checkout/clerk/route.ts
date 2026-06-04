import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const POST = async (request: NextRequest) => {
  try {
    const reqBody = await request.json();
    const {
      orderId,
      orderNumber,
      items,
      email,
      shippingAddress,
      orderAmount,
      firebaseUid,
    } = reqBody;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "Firebase User ID is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Verify user exists in Firebase
    const user = await adminAuth.getUser(firebaseUid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a payment session ID for tracking
    const clerkPaymentId = `clerk_payment_${Date.now()}_${orderId}`;

    // For now, we'll simulate a payment session
    // In a real implementation, you would integrate with a payment gateway

    const paymentSession = {
      id: clerkPaymentId,
      orderId,
      orderNumber,
      userId: firebaseUid,
      email: user.email || email,
      amount: orderAmount,
      currency: "usd",
      status: "pending",
      items,
      shippingAddress,
      createdAt: new Date().toISOString(),
    };

    // Return the payment session details
    return NextResponse.json({
      success: true,
      sessionId: clerkPaymentId,
      paymentUrl: `/clerk-payment?session_id=${clerkPaymentId}&order_id=${orderId}&orderNumber=${orderNumber}&amount=${orderAmount}`,
      paymentSession,
    });
  } catch (error) {
    console.error("Error creating Clerk payment session:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
};
