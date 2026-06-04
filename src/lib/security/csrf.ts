/**
 * CSRF / cross-origin guard for state-changing API routes.
 *
 * Why this exists
 * ---------------
 * Our session cookie is `SameSite=Lax`, which already blocks
 * cross-site form submissions in modern browsers. But:
 *   1. `Lax` does NOT block top-level GETs — fine for us, since we
 *      never mutate on GET, but worth noting.
 *   2. Older browsers + a handful of edge CDN configurations have
 *      shipped buggy SameSite handling. Defense in depth is cheap.
 *   3. An explicit Origin check makes the security contract obvious
 *      to reviewers and catches regressions where a route accidentally
 *      starts accepting `application/x-www-form-urlencoded` from
 *      anywhere.
 *
 * What this checks
 * ----------------
 * For non-GET / non-HEAD requests:
 *   - The `Origin` header (or, as a fallback, the `Referer` host) MUST
 *     match either the request's own host or one of the explicitly
 *     allowed origins (configured via APP_ALLOWED_ORIGINS, comma-sep).
 *   - Missing Origin AND missing Referer → reject. Browsers always
 *     send one of them on cross-origin POSTs; native clients can set
 *     `Origin: null` if needed and we'll allow same-host requests.
 *
 * What this does NOT cover
 * ------------------------
 *   - Webhooks (Stripe, SSLCommerz IPN, etc.) — those callers use
 *     signature verification, not cookies, so don't wrap them.
 *   - GET endpoints — none of ours mutate, so we skip the check.
 *   - Token-based clients (Bearer Authorization) — they don't ride on
 *     the session cookie so CSRF doesn't apply; this guard is opt-in
 *     per route, not a global middleware, so those routes simply skip
 *     it.
 *
 * Usage
 * -----
 *   import { assertSameOrigin } from "@/lib/security/csrf";
 *
 *   export async function POST(req: NextRequest) {
 *     const csrf = assertSameOrigin(req);
 *     if (csrf) return csrf;        // 403 response
 *     // ... handle request ...
 *   }
 */
import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function parseAllowed(): Set<string> {
  const raw = process.env.APP_ALLOWED_ORIGINS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns `null` when the request is allowed. Returns a 403
 * `NextResponse` when the request looks cross-origin and should be
 * rejected. The handler should early-return that response.
 */
export function assertSameOrigin(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const requestHost = request.headers.get("host")?.toLowerCase() ?? null;
  const originHost = hostOf(request.headers.get("origin"));
  const refererHost = hostOf(request.headers.get("referer"));
  const allowed = parseAllowed();

  // We need at least one of Origin/Referer. Browsers always send one.
  if (!originHost && !refererHost) {
    return NextResponse.json({ error: "Origin required" }, { status: 403 });
  }

  const candidate = originHost ?? refererHost;
  if (!candidate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (candidate === requestHost) return null;
  if (allowed.has(candidate)) return null;

  return NextResponse.json(
    { error: "Cross-origin request rejected" },
    { status: 403 },
  );
}
