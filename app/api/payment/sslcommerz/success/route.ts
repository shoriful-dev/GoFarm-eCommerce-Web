import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract SSLCommerz response data
    const valId = formData.get("val_id") as string;
    const tranId = formData.get("tran_id") as string;
    const amount = formData.get("amount") as string;
    const cardType = formData.get("card_type") as string;
    const storeAmount = formData.get("store_amount") as string;
    const bankTranId = formData.get("bank_tran_id") as string;
    const status = formData.get("status") as string;
    const tranDate = formData.get("tran_date") as string;
    const currency = formData.get("currency") as string;
    const cardIssuer = formData.get("card_issuer") as string;
    const cardBrand = formData.get("card_brand") as string;
    const cardNo = formData.get("card_no") as string;

    // Custom values
    const orderId = formData.get("value_a") as string;
    const orderNumber = formData.get("value_b") as string;
    const originalAmount = formData.get("value_d") as string; // Original USD amount

    if (!valId || !tranId || !orderId) {
      console.log("❌ Missing required fields:", { valId, tranId, orderId });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=failed`
      );
    }

    // In sandbox mode, SSLCommerz validation API might not work properly
    // So we check the status from the callback data
    const isSandbox = process.env.SSLCOMMERZ_IS_LIVE !== "true";

    if (isSandbox && status === "VALID") {
      // Update order in Sanity using writeClient (requires write permissions)
      await writeClient
        .patch(orderId)
        .set({
          status: ORDER_STATUSES.PENDING,
          paymentStatus: PAYMENT_STATUSES.PAID,
          paymentMethod: "sslcommerz",
          sslcommerzTransactionId: tranId,
          sslcommerzValidationId: valId,
          sslcommerzBankTransactionId: bankTranId,
          sslcommerzCardType: cardType,
          sslcommerzCardIssuer: cardIssuer,
          sslcommerzCardBrand: cardBrand,
          sslcommerzCardNo: cardNo,
          sslcommerzTransactionDate: tranDate,
          paidAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/payment-success?order_id=${orderId}&orderNumber=${orderNumber}&payment_method=sslcommerz&amount=${
          originalAmount || amount
        }`
      );
    }

    // For production, validate with SSLCommerz API
    const validationResponse = await validateSSLCommerzPayment(valId);

    if (
      validationResponse.status !== "VALID" &&
      validationResponse.status !== "VALIDATED"
    ) {
      console.error("Payment validation failed:", validationResponse);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=failed`
      );
    }

    // Verify transaction details match
    if (
      validationResponse.tran_id !== tranId ||
      parseFloat(validationResponse.amount) !== parseFloat(amount)
    ) {
      console.error("Transaction details mismatch");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=failed`
      );
    }

    // Update order in Sanity using writeClient (requires write permissions)
    await writeClient
      .patch(orderId)
      .set({
        status: ORDER_STATUSES.PENDING,
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentMethod: "sslcommerz",
        sslcommerzValidationId: valId,
        sslcommerzBankTransactionId: bankTranId,
        sslcommerzCardType: cardType,
        sslcommerzCardIssuer: cardIssuer,
        sslcommerzCardBrand: cardBrand,
        sslcommerzCardNo: cardNo,
        sslcommerzTransactionDate: tranDate,
        paidAt: new Date().toISOString(),
      })
      .commit();

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${orderId}&orderNumber=${orderNumber}&payment_method=sslcommerz&amount=${amount}`
    );
  } catch (error) {
    console.error("SSLCommerz success handler error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=error`
    );
  }
}

// Handle GET request (some gateways might send GET instead of POST)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const valId = searchParams.get("val_id");
  const tranId = searchParams.get("tran_id");
  const amount = searchParams.get("amount");
  const status = searchParams.get("status");
  const orderId = searchParams.get("value_a");
  const orderNumber = searchParams.get("value_b");
  const bankTranId = searchParams.get("bank_tran_id");
  const originalAmount = searchParams.get("value_d"); // Original USD amount

  if (!valId || !tranId || !orderId) {
    console.log("❌ Missing required fields:", { valId, tranId, orderId });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=failed`
    );
  }

  try {
    // In sandbox mode, skip API validation
    const isSandbox = process.env.SSLCOMMERZ_IS_LIVE !== "true";

    if (isSandbox && status === "VALID") {
      // Update order using writeClient (requires write permissions)
      await writeClient
        .patch(orderId)
        .set({
          status: ORDER_STATUSES.PENDING,
          paymentStatus: PAYMENT_STATUSES.PAID,
          paymentMethod: "sslcommerz",
          sslcommerzTransactionId: tranId,
          sslcommerzValidationId: valId,
          sslcommerzBankTransactionId: bankTranId,
          paidAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/payment-success?order_id=${orderId}&orderNumber=${orderNumber}&payment_method=sslcommerz&amount=${
          originalAmount || amount
        }`
      );
    }

    // For production, validate with SSLCommerz API
    const validationResponse = await validateSSLCommerzPayment(valId);

    if (
      validationResponse.status !== "VALID" &&
      validationResponse.status !== "VALIDATED"
    ) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=failed`
      );
    }

    // Verify amount
    if (
      amount &&
      parseFloat(validationResponse.amount) !== parseFloat(amount)
    ) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=failed`
      );
    }

    // Update order using writeClient (requires write permissions)
    await writeClient
      .patch(orderId)
      .set({
        status: ORDER_STATUSES.PENDING,
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentMethod: "sslcommerz",
        sslcommerzValidationId: valId,
        paidAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_BASE_URL
      }/payment-success?order_id=${orderId}&orderNumber=${orderNumber}&payment_method=sslcommerz&amount=${
        originalAmount || amount
      }`
    );
  } catch (error) {
    console.error("SSLCommerz GET success handler error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=error`
    );
  }
}
