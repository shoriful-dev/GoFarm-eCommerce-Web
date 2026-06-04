import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, getCurrentUser } from "@/lib/firebase-admin-auth";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";
import {
  initSSLCommerzPayment,
  generateTransactionId,
  SSLCommerzInitData,
} from "@/lib/sslcommerz";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
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
        currency,
        products[]{
          _key,
          quantity,
          product->{
            _id,
            name,
            price,
            currency
          }
        },
        address,
        phone
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

    // Generate unique transaction ID
    const tranId = generateTransactionId(order._id);

    // Prepare product names for SSLCommerz
    const productNames = order.products
      .map((item: { product?: { name?: string } }) => item.product?.name)
      .filter(Boolean)
      .join(", ")
      .substring(0, 255); // SSLCommerz has a character limit

    // Calculate payable amount: Total Amount - Total Discount
    const totalAmount =
      (order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0);
    const totalDiscount =
      (order.productDiscount || 0) +
      (order.amountDiscount || 0) +
      (order.businessDiscount || 0);
    const payableAmount = totalAmount - totalDiscount;

    // Convert USD to BDT if needed (SSLCommerz requires BDT)
    // Typical exchange rate: 1 USD = ~110 BDT (update as needed)
    const USD_TO_BDT_RATE = 110;
    const isUSD = order.currency?.toUpperCase() === "USD";
    const originalAmount = payableAmount;
    const bdtAmount = isUSD ? originalAmount * USD_TO_BDT_RATE : originalAmount;
    const currency = "BDT"; // SSLCommerz primarily works with BDT

    // Prepare SSLCommerz payment data
    const sslcommerzData: SSLCommerzInitData = {
      total_amount: bdtAmount,
      currency: currency,
      tran_id: tranId,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/success`,
      fail_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/fail`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/cancel`,
      ipn_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/ipn`,
      cus_name: order.customerName || user.displayName || "Customer",
      cus_email: order.email || user.email || "customer@example.com",
      cus_add1: order.address?.address || "N/A",
      cus_city: order.address?.city || "N/A",
      cus_state: order.address?.state || "",
      cus_postcode: order.address?.zip || "0000",
      cus_country: "Bangladesh",
      cus_phone: order.phone || user.phoneNumber || "01700000000",
      product_name: productNames || "Order Products",
      product_category: "General",
      product_profile: "general",
      num_of_item: order.products.length,
      shipping_method: "YES",
      // Shipping address (required by SSLCommerz)
      ship_name:
        order.address?.name ||
        order.customerName ||
        user.displayName ||
        "Customer",
      ship_add1: order.address?.address || "N/A",
      ship_city: order.address?.city || "N/A",
      ship_state: order.address?.state || "",
      ship_postcode: order.address?.zip || "0000",
      ship_country: "Bangladesh",
      ship_phone: order.phone || user.phoneNumber || "01700000000",
      value_a: order._id, // Store order ID
      value_b: order.orderNumber, // Store order number
      value_c: userId, // Store user ID
      value_d: originalAmount.toString(), // Store original USD amount
    };

    // Initialize SSLCommerz payment
    const sslcommerzResponse = await initSSLCommerzPayment(sslcommerzData);

    // Store transaction ID in order using writeClient (requires write permissions)
    await writeClient
      .patch(order._id)
      .set({
        sslcommerzTransactionId: tranId,
        sslcommerzSessionKey: sslcommerzResponse.sessionkey,
      })
      .commit();

    return NextResponse.json({
      success: true,
      gatewayUrl:
        sslcommerzResponse.GatewayPageURL ||
        sslcommerzResponse.redirectGatewayURL,
      sessionKey: sslcommerzResponse.sessionkey,
      message: "SSLCommerz payment session created successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ SSLCommerz payment session creation error:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { error: "Failed to create SSLCommerz payment session" },
      { status: 500 },
    );
  }
}
