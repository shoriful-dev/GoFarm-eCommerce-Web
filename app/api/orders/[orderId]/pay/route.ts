import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, getCurrentUser } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";
import Stripe from "stripe";
import { urlFor } from "@/sanity/lib/image";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Check authentication
    const userId = await getAuthUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order from Sanity
    const order = await client.fetch(
      `*[_type == "order" && _id == $orderId && firebaseUid == $userId][0]{
        _id,
        orderNumber,
        customerName,
        email,
        firebaseUid,
        status,
        paymentStatus,
        paymentMethod,
        totalPrice,
        subtotal,
        shipping,
        tax,
        productDiscount,
        amountDiscount,
        businessDiscount,
        coupon {
          code,
          discountType,
          discountValue,
          discountAmount
        },
        currency,
        products[]{
          _key,
          quantity,
          product->{
            _id,
            name,
            price,
            currency,
            images
          }
        },
        address
      }`,
      { orderId, userId },
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is already paid
    if (
      order.status === ORDER_STATUSES.PAID ||
      order.paymentStatus === PAYMENT_STATUSES.PAID
    ) {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 },
      );
    }

    // Check if order is eligible for payment (not cancelled)
    if (order.status === ORDER_STATUSES.CANCELLED) {
      return NextResponse.json(
        { error: "Cannot pay for cancelled order" },
        { status: 400 },
      );
    }

    // Calculate payable amount following OrderSummary pattern:
    // Total Amount = subtotal + shipping + tax
    // Total Discount = productDiscount + couponDiscount + businessDiscount
    // Payable Amount = Total Amount - Total Discount
    //
    // NOTE: In the database, subtotal already has productDiscount removed,
    // so we don't include productDiscount in totalDiscount calculation
    const totalAmount =
      (order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0);

    // Get coupon discount from either coupon.discountAmount or amountDiscount field
    const couponDiscount =
      order.coupon?.discountAmount || order.amountDiscount || 0;
    const businessDiscount = order.businessDiscount || 0;

    const totalDiscount =
      couponDiscount + businessDiscount + order.productDiscount;
    const payableAmount = totalAmount - totalDiscount;

    // Create a single line item with the final payable amount
    // instead of creating items from products (which doesn't account for discounts)
    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: order.currency?.toLowerCase() || "usd",
          unit_amount: Math.round(payableAmount * 100), // Convert to cents
          product_data: {
            name: `Order #${order.orderNumber}`,
            description: `Complete order with ${order.products.length} item(s) including all discounts`,
            metadata: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              itemCount: order.products.length.toString(),
              payableAmount: payableAmount.toString(),
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
      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL
      }/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL
      }/orders?payment=cancelled`,
      metadata: {
        orderId: order._id,
        email: order.email,
        orderDate: new Date().toISOString(),
        itemCount: order.products.length.toString(),
        shippingAddress: JSON.stringify(order.address),
        orderAmount: payableAmount.toString(),
        totalDiscount: totalDiscount.toString(),
      },
      customer_email: order.email,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: "Payment session created successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Payment session creation error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 },
    );
  }
}
