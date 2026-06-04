/**
 * POST /api/analytics/track — placeholder.
 *
 * No analytics provider is wired up yet. The route accepts and discards
 * any payload so legacy client calls don't 404. Wire this up to GA4
 * Measurement Protocol, PostHog, or your provider of choice when ready.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
