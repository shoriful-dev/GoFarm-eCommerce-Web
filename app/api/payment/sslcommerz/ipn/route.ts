import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";
import { verifyIPNHash } from "@/lib/sslcommerz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * IPN (Instant Payment Notification) handler for SSLCommerz.
 *
 * SSLCommerz aggressively retries on any non-2xx response, so this
 * handler must be:
 *   - Hash-verified (we trust nothing in the form body until then).
 *   - Idempotent: repeat deliveries of the same `tran_id` / `val_id`
 *     must not double-credit, double-mark, or double-fire side effects.
 *   - Always 200-on-known-events so the gateway stops retrying.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    if (!verifyIPNHash(data)) {
      console.error("SSLCommerz IPN: hash verification failed");
      return NextResponse.json(
        { error: "Invalid IPN signature" },
        { status: 400 },
      );
    }

    const {
      val_id: valId,
      tran_id: tranId,
      status,
      value_a: orderId,
      bank_tran_id: bankTranId,
      card_type: cardType,
      tran_date: tranDate,
    } = data;

    if (!orderId || !tranId || !valId) {
      console.error("SSLCommerz IPN: missing required parameters", {
        hasOrderId: !!orderId,
        hasTranId: !!tranId,
        hasValId: !!valId,
      });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    if (status !== "VALID" && status !== "VALIDATED") {
      // Acknowledge non-success deliveries so the gateway stops retrying.
      console.log("SSLCommerz IPN: non-success status", { tranId, status });
      return NextResponse.json({ success: true, status: "OK" });
    }

    // Idempotency guard: if this order has already been marked paid (or
    // already carries a validation id), short-circuit with success so a
    // retry can never trigger downstream effects twice.
    const existing = await client.fetch<{
      _id: string;
      paymentStatus?: string;
      sslcommerzValidationId?: string;
    } | null>(
      `*[_type == "order" && _id == $orderId][0]{
        _id, paymentStatus, sslcommerzValidationId
      }`,
      { orderId },
    );

    if (!existing) {
      console.error("SSLCommerz IPN: order not found", { orderId, tranId });
      // Still return 200 so the gateway stops retrying; investigate via
      // logs rather than letting an infinite-retry storm hit our API.
      return NextResponse.json({ success: true, status: "OK" });
    }

    if (
      existing.paymentStatus === PAYMENT_STATUSES.PAID ||
      existing.sslcommerzValidationId === valId
    ) {
      console.log("SSLCommerz IPN: duplicate delivery ignored", {
        orderId,
        tranId,
        valId,
      });
      return NextResponse.json({
        success: true,
        status: "OK",
        duplicate: true,
      });
    }

    await client
      .patch(orderId)
      .set({
        status: ORDER_STATUSES.PAID,
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentMethod: "sslcommerz",
        sslcommerzValidationId: valId,
        sslcommerzTransactionId: tranId,
        sslcommerzBankTransactionId: bankTranId,
        sslcommerzCardType: cardType,
        sslcommerzTransactionDate: tranDate,
        paidAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({ success: true, status: "OK" });
  } catch (error) {
    console.error("SSLCommerz IPN handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
