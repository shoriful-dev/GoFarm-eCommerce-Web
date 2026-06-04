import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import type { UserRecord } from "firebase-admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/users/export/preview
 *
 * Lightweight companion to /api/admin/users/export that returns row
 * counts for every available export scope, plus a small breakdown of
 * which OAuth providers are in play. Used by the admin UI to show a
 * confirmation modal *before* the actual CSV is generated.
 *
 * Query params:
 *  - query   optional case-insensitive name/email search
 *  - limit   only used when computing the "page" count
 *  - offset  only used when computing the "page" count
 *
 * No Sanity round-trip: identity (incl. provider data) lives entirely
 * in Firebase, so we can answer this from a single Auth listing.
 */

const FEDERATED_PROVIDERS = new Set([
  "google.com",
  "facebook.com",
  "apple.com",
  "github.com",
  "twitter.com",
  "microsoft.com",
  "yahoo.com",
  "oidc",
  "saml",
]);

const isFederated = (id: string) =>
  FEDERATED_PROVIDERS.has(id) ||
  id.startsWith("oidc.") ||
  id.startsWith("saml.");

async function listAllFirebaseUsers(): Promise<UserRecord[]> {
  const all: UserRecord[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    all.push(...page.users);
    pageToken = page.pageToken ?? undefined;
  } while (pageToken);
  return all;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
  } catch (err) {
    const status = (err as Error).message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim().toLowerCase();
  const limit = Math.max(0, parseInt(searchParams.get("limit") || "0"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

  let firebaseUsers: UserRecord[];
  try {
    firebaseUsers = await listAllFirebaseUsers();
  } catch (err) {
    console.error("export preview: listAllFirebaseUsers failed:", err);
    return NextResponse.json(
      { error: "Failed to list Firebase users" },
      { status: 500 },
    );
  }

  // Filter to match the export endpoint's `query` semantics.
  const filtered = query
    ? firebaseUsers.filter((u) => {
        const hay = `${u.displayName || ""} ${u.email || ""}`.toLowerCase();
        return hay.includes(query);
      })
    : firebaseUsers;

  // Per-provider tallies, plus the OAuth / password split.
  const providerCounts = new Map<string, number>();
  let oauthCount = 0;
  let passwordCount = 0;
  let multiProviderCount = 0;

  for (const u of filtered) {
    const ids = (u.providerData || []).map((p) => p.providerId).filter(Boolean);
    for (const id of ids) {
      providerCounts.set(id, (providerCounts.get(id) || 0) + 1);
    }
    const hasFederated = ids.some(isFederated);
    if (hasFederated) {
      oauthCount++;
      if (ids.length > 1) multiProviderCount++;
    } else {
      passwordCount++;
    }
  }

  const providers = Array.from(providerCounts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  const pageCount =
    limit > 0 ? Math.max(0, Math.min(limit, filtered.length - offset)) : 0;

  return NextResponse.json({
    total: firebaseUsers.length,
    filtered: filtered.length,
    query,
    counts: {
      page: pageCount,
      all: filtered.length,
      oauth: oauthCount,
      password: passwordCount,
    },
    providers,
    multiProviderCount,
  });
}
