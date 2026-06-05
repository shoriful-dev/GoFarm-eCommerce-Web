/**
 * Server-side GA4 events via the Measurement Protocol.
 *
 * Used for events that *must* be recorded even if the user closes the tab
 * (most importantly `purchase`, fired from the Stripe / SSLCommerz webhook).
 *
 * Required env:
 *   GA4_MEASUREMENT_ID  (e.g. G-XXXXXXX — same as NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
 *   GA4_API_SECRET      (GA4 → Admin → Data Streams → Web → Measurement Protocol API secrets)
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

import type { GA4Item } from "../../lib/analytics";

const ENDPOINT = "https://www.google-analytics.com/mp/collect";
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

interface GA4Event {
  name: string;
  params: Record<string, unknown>;
}

interface SendOptions {
  /** Stable per-user identifier. Required (uses Firebase UID for logged-in users). */
  clientId: string;
  /** Authenticated user id; enables cohort + cross-device reports. */
  userId?: string;
  events: GA4Event[];
  /** Hits the validation endpoint instead of collecting. */
  debug?: boolean;
}

async function sendGA4(opts: SendOptions): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[GA4] GA4_MEASUREMENT_ID / GA4_API_SECRET not set — skipping",
        opts.events.map((e) => e.name).join(", "),
      );
    }
    return;
  }

  const url = `${opts.debug ? DEBUG_ENDPOINT : ENDPOINT}?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body = {
    client_id: opts.clientId,
    user_id: opts.userId,
    events: opts.events,
    timestamp_micros: Date.now() * 1000,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      // Don't let analytics block the webhook response.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      console.error(
        `[GA4] Measurement Protocol responded ${res.status}`,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[GA4] Measurement Protocol request failed:", err);
  }
}

// ---------------------------------------------------------------------------
//  High-level helpers
// ---------------------------------------------------------------------------

export async function ga4Purchase(args: {
  firebaseUid: string;
  transactionId: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GA4Item[];
}): Promise<void> {
  await sendGA4({
    clientId: args.firebaseUid,
    userId: args.firebaseUid,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: args.transactionId,
          value: args.value,
          currency: args.currency ?? "USD",
          tax: args.tax,
          shipping: args.shipping,
          coupon: args.coupon,
          items: args.items,
        },
      },
    ],
  });
}

export async function ga4Refund(args: {
  firebaseUid: string;
  transactionId: string;
  value: number;
  currency?: string;
  items?: GA4Item[];
}): Promise<void> {
  await sendGA4({
    clientId: args.firebaseUid,
    userId: args.firebaseUid,
    events: [
      {
        name: "refund",
        params: {
          transaction_id: args.transactionId,
          value: args.value,
          currency: args.currency ?? "USD",
          items: args.items,
        },
      },
    ],
  });
}
