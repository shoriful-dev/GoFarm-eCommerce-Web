/**
 * GET /api/auth/role
 *
 * Authoritative role lookup for the current session. The client uses this
 * (instead of the email-allowlist hack) to decide whether to show admin
 * UI. Returns `{ role: "user" | "admin" | "vendor" | "employee" }` or
 * `{ role: null }` when not signed in.
 */
import { NextResponse } from "next/server";
import { getCurrentUserRole } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getCurrentUserRole();
  return NextResponse.json({ role });
}
