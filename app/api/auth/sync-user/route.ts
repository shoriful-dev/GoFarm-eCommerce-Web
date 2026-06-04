/**
 * REMOVED: POST /api/auth/sync-user
 *
 * The canonical sync now happens inside POST /api/auth/session, which mints
 * the session cookie AND ensures the Sanity user document atomically.
 *
 * This stub returns 410 Gone so any stale client that still calls this URL
 * fails loudly instead of silently doing the wrong thing. Delete the route
 * entirely once you're confident no clients reach it.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "POST /api/auth/sync-user has been removed. Call POST /api/auth/session with { idToken } instead — it syncs to Sanity atomically.",
    },
    { status: 410 },
  );
}
