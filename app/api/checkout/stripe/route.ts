import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// Removed unused imports

export const POST = async (request: NextRequest) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const reqBody = await request.json();
    const { orderId, orderNumber, items, email, shippingAddress, orderAmount } =
      reqBody;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount" },
        { status: 400 }
      );
    }

    // Instead of creating line items from products (which doesn't account for discounts),
    // create a single line item with the final payable amount
    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(orderAmount * 100), // Convert to cents
          product_data: {
            name: `Order #${orderNumber || orderId}`,
            description: `Complete order with ${
              items?.length || 0
            } item(s) including all discounts`,
            metadata: {
              orderId: orderId.toString(),
              orderNumber: orderNumber?.toString() || "",
              itemCount: items?.length?.toString() || "0",
            },
          },
        },
      },
    ];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&orderNumber=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?cancelled=true`,
      metadata: {
        orderId: orderId.toString(),
        orderNumber: orderNumber.toString(),
        email,
        orderDate: new Date().toISOString(),
        itemCount: items?.length?.toString() || "0",
        shippingAddress: JSON.stringify(shippingAddress),
        orderAmount: orderAmount.toString(),
      },
      customer_email: email,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: "Stripe checkout session created successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: errorMessage || "Failed to create Stripe checkout session" },
      { status: 500 }
    );
  }
};
