/**
 * Firebase session-cookie lifecycle.
 *
 *   POST   — body: { idToken } (or legacy { token })
 *            Creates a 14-day __session cookie, ensures a Sanity user doc,
 *            and seeds the admin custom claim from ADMIN_EMAILS.
 *   DELETE — Revokes refresh tokens and clears all auth cookies.
 *
 * Client flow:
 *   1. Sign in with `firebase/auth` → `user.getIdToken()`
 *   2. POST { idToken } here BEFORE navigating
 *   3. All subsequent server requests are authenticated via the cookie.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, verifyIdToken } from "@/lib/firebase/admin";
import { SESSION_COOKIE, getAuthUserId } from "@/lib/auth/server";
import { syncUserToSanity } from "@/lib/sync-user-to-sanity";
import { client } from "@/sanity/lib/client";
import {
  isBootstrapAdminEmail,
  legacyFlagsForRole,
  roleFromUserDoc,
  type Role,
} from "@/lib/auth/roles";
import { assertSameOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const PostBody = z
  .object({
    idToken: z.string().min(20).optional(),
    token: z.string().min(20).optional(), // legacy
  })
  .refine((v) => !!(v.idToken ?? v.token), {
    message: "idToken is required",
  });

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  let body: { idToken?: string; token?: string };
  try {
    body = PostBody.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const idToken = (body.idToken ?? body.token)!;

  const decoded = await verifyIdToken(idToken);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Issued-at must be within 5 minutes to mint a NEW session cookie.
  // This protects against stale tokens being exchanged for long-lived cookies.
  let cookieValue: string | null = null;
  const isTokenOld =
    decoded.auth_time &&
    Date.now() - decoded.auth_time * 1000 > 5 * 60 * 1000;

  if (isTokenOld) {
    // Token is too old to mint a new cookie. Check if they have a valid existing cookie.
    const existingCookie = req.cookies.get(SESSION_COOKIE)?.value;
    if (!existingCookie) {
      return NextResponse.json(
        { error: "Token too old, sign in again" },
        { status: 401 },
      );
    }
    cookieValue = existingCookie;
  } else {
    try {
      cookieValue = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_TTL_MS,
      });
    } catch (err) {
      console.error("createSessionCookie failed:", err);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }
  }

  const userRecord = await adminAuth.getUser(decoded.uid).catch(() => null);

  // Ensure the Sanity user document exists *before* responding so downstream
  // server actions never race a missing user. This also writes the initial
  // `role` (defaulting to "user" or "admin" if the email is in ADMIN_EMAILS).
  if (userRecord) {
    try {
      await syncUserToSanity({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      });
    } catch (err) {
      console.error("syncUserToSanity failed (non-fatal):", err);
    }
  }

  // Resolve effective role from Sanity (post-sync), with ADMIN_EMAILS bootstrap
  // as a last-resort fallback if the Sanity write failed.
  let role: Role = "user";
  try {
    const profile = await client.fetch<{
      role?: string;
      isAdmin?: boolean;
      isEmployee?: boolean;
      isVendor?: boolean;
    } | null>(
      `*[_type == "user" && firebaseUid == $uid][0]{ role, isAdmin, isEmployee, isVendor }`,
      { uid: decoded.uid },
    );
    role = roleFromUserDoc(profile);
  } catch (err) {
    console.error("role lookup failed:", err);
  }
  if (
    role === "user" &&
    userRecord?.email &&
    isBootstrapAdminEmail(userRecord.email)
  ) {
    role = "admin";
  }

  // Mirror the role into Firebase custom claims so server checks can short-
  // circuit without a Sanity round-trip on every request. Only update when
  // the claim has drifted to keep token churn minimal.
  if (userRecord) {
    const existing = userRecord.customClaims ?? {};
    const flags = legacyFlagsForRole(role);
    const desired = {
      ...existing,
      role,
      admin: flags.isAdmin,
      employee: flags.isEmployee,
      vendor: flags.isVendor,
    };
    const drift =
      existing.role !== desired.role ||
      existing.admin !== desired.admin ||
      existing.employee !== desired.employee ||
      existing.vendor !== desired.vendor;
    if (drift) {
      await adminAuth
        .setCustomUserClaims(decoded.uid, desired)
        .catch((err) => console.error("setCustomUserClaims failed:", err));
    }
  }

  const res = NextResponse.json({
    ok: true,
    success: true, // legacy
    uid: decoded.uid,
    role,
  });

  // Canonical session cookie (Firebase-issued, signature-verified server-side).
  res.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return res;
}

export async function DELETE() {
  // Best-effort: revoke refresh tokens for the current user.
  try {
    const uid = await getAuthUserId();
    if (uid) await adminAuth.revokeRefreshTokens(uid);
  } catch (err) {
    console.error("revokeRefreshTokens failed (non-fatal):", err);
  }

  const res = NextResponse.json({ ok: true, success: true });
  for (const name of [SESSION_COOKIE, "session", "firebaseToken"]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}
