/**
 * Canonical server-side authentication helpers.
 *
 * Identity is owned by Firebase. Sanity stores domain data joined by `firebaseUid`.
 *
 * Cookie strategy (during migration):
 *   1. `__session`     — Firebase session cookie (preferred, 14-day)
 *   2. `session`       — legacy raw ID token
 *   3. `firebaseToken` — legacy raw ID token (older clients)
 *
 * Once all clients have rotated through `/api/auth/session`, the legacy
 * fallbacks can be removed.
 */
import { cookies } from "next/headers";
import {
  adminAuth,
  verifyIdToken,
  verifySessionCookie,
} from "@/lib/firebase/admin";
import { client } from "@/sanity/lib/client";
import {
  DEFAULT_ROLE,
  isBootstrapAdminEmail,
  isRole,
  roleFromUserDoc,
  roleSatisfies,
  type Role,
} from "@/lib/auth/roles";

export type { Role } from "@/lib/auth/roles";

export const SESSION_COOKIE = "__session";
const LEGACY_COOKIES = ["session", "firebaseToken"] as const;

export interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string;
  phoneNumber: string;
  disabled: boolean;
  customClaims: Record<string, unknown>;
  providerData: ReturnType<typeof adminAuth.getUser> extends Promise<infer R>
    ? R extends { providerData: infer P }
      ? P
      : never
    : never;
  metadata: ReturnType<typeof adminAuth.getUser> extends Promise<infer R>
    ? R extends { metadata: infer M }
      ? M
      : never
    : never;
}

interface DecodedSession {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  role?: string;
  admin?: boolean;
  employee?: boolean;
  vendor?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
//  Cookie -> decoded claims
// ---------------------------------------------------------------------------

async function readSessionCookie(): Promise<DecodedSession | null> {
  const store = await cookies();

  const sessionVal = store.get(SESSION_COOKIE)?.value;
  if (sessionVal) {
    const decoded = await verifySessionCookie(sessionVal);
    if (decoded) return decoded as DecodedSession;
  }

  for (const name of LEGACY_COOKIES) {
    const val = store.get(name)?.value;
    if (!val) continue;
    const decoded = await verifyIdToken(val);
    if (decoded) return decoded as DecodedSession;
  }

  return null;
}

// ---------------------------------------------------------------------------
//  Public helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Firebase UID of the currently authenticated user, or null.
 * Cheap: single cookie verification, no extra Firebase Admin call.
 */
export async function getAuthUserId(): Promise<string | null> {
  const decoded = await readSessionCookie();
  return decoded?.uid ?? null;
}

/**
 * Returns the full Firebase user record for the current session, or null.
 * Use when you need email/displayName/etc.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const decoded = await readSessionCookie();
  if (!decoded) return null;

  try {
    const u = await adminAuth.getUser(decoded.uid);
    return {
      uid: u.uid,
      email: u.email ?? "",
      emailVerified: u.emailVerified,
      displayName: u.displayName ?? "",
      photoURL: u.photoURL ?? "",
      phoneNumber: u.phoneNumber ?? "",
      disabled: u.disabled,
      customClaims: u.customClaims ?? {},
      providerData: u.providerData,
      metadata: u.metadata,
    } as SessionUser;
  } catch (err) {
    console.error("getSessionUser: failed to load user record", err);
    return null;
  }
}

/**
 * Throws "Unauthorized" if no session. Returns the UID.
 */
export async function requireUser(): Promise<string> {
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Unauthorized");
  return uid;
}

/**
 * Throws "Forbidden" if the user lacks the role.
 * Resolution order: custom-claim role -> Sanity `role` field -> ADMIN_EMAILS bootstrap.
 */
export async function requireRole(role: Role): Promise<string> {
  const decoded = await readSessionCookie();
  if (!decoded) throw new Error("Unauthorized");

  const effective = await resolveRole(decoded);
  if (roleSatisfies(effective, role)) return decoded.uid;

  throw new Error("Forbidden");
}

/**
 * Returns the effective role for the current session, or null if no session.
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const decoded = await readSessionCookie();
  if (!decoded) return null;
  return await resolveRole(decoded);
}

// ---------------------------------------------------------------------------
//  Role utilities
// ---------------------------------------------------------------------------

/**
 * Resolve the effective role for a decoded session token.
 *
 * Sanity is the canonical source of truth for `role` — admins manage roles
 * in the Studio (or via admin actions). The Firebase custom claim is a
 * fast-path mirror that only refreshes when the user logs in again, so
 * it can lag behind a Sanity edit by up to 14 days (the session-cookie
 * TTL). To make role changes propagate immediately we read Sanity FIRST,
 * and treat the claim as a fallback only when no Sanity profile exists.
 *
 * Order:
 *  1. Sanity `user.role` (or legacy `isAdmin / isEmployee / isVendor`).
 *  2. Custom-claim role on the decoded session cookie.
 *  3. ADMIN_EMAILS bootstrap.
 *  4. DEFAULT_ROLE ("user").
 */
async function resolveRole(decoded: DecodedSession): Promise<Role> {
  // 1. Sanity — authoritative.
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
    if (profile) {
      const fromDoc = roleFromUserDoc(profile);
      if (fromDoc !== DEFAULT_ROLE) return fromDoc;
      // Profile exists but resolves to "user" — still fall through to
      // claim/email fallbacks below in case bootstrap rules apply.
    }
  } catch (err) {
    console.error("resolveRole: Sanity lookup failed", err);
  }

  // 2. Custom-claim fallback (legacy + fast-path).
  if (isRole(decoded.role)) return decoded.role;
  if (decoded.admin === true) return "admin";
  if (decoded.employee === true) return "employee";
  if (decoded.vendor === true) return "vendor";

  if (decoded.email && isBootstrapAdminEmail(decoded.email)) return "admin";
  return DEFAULT_ROLE;
}

/** Server-only ADMIN_EMAILS check. Re-exported for the bootstrap path. */
export function isAdminEmail(email: string): boolean {
  return isBootstrapAdminEmail(email);
}

async function fetchSanityRoleFlag(
  firebaseUid: string,
  role: Role,
): Promise<boolean> {
  if (role === "user") return true;
  try {
    const profile = await client.fetch<{
      role?: string;
      isAdmin?: boolean;
      isEmployee?: boolean;
      isVendor?: boolean;
    } | null>(
      `*[_type == "user" && firebaseUid == $uid][0]{ role, isAdmin, isEmployee, isVendor }`,
      { uid: firebaseUid },
    );
    return roleSatisfies(roleFromUserDoc(profile), role);
  } catch (err) {
    console.error(`fetchSanityRoleFlag(${role}) failed:`, err);
    return false;
  }
}

/**
 * Boolean check: is the current session user an admin?
 */
export async function currentUserIsAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}

/**
 * Vendor status for the current session user (or any uid).
 */
export async function getVendorStatus(
  firebaseUid?: string,
): Promise<{ isVendor: boolean; isActive: boolean }> {
  const uid = firebaseUid ?? (await getAuthUserId());
  if (!uid) return { isVendor: false, isActive: false };

  try {
    const profile = await client.fetch<{
      role?: string;
      isVendor?: boolean;
      vendorStatus?: string;
    } | null>(
      `*[_type == "user" && firebaseUid == $uid][0]{ role, isVendor, vendorStatus }`,
      { uid },
    );
    const roleIsVendor = profile?.role === "vendor";
    return {
      // role=vendor is the new source of truth (admin role change activates
      // a vendor instantly). Legacy `isVendor` + active status still works.
      isVendor: roleIsVendor || !!profile?.isVendor,
      isActive: roleIsVendor || profile?.vendorStatus === "active",
    };
  } catch (err) {
    console.error("getVendorStatus failed:", err);
    return { isVendor: false, isActive: false };
  }
}

/**
 * Loads the joined Sanity profile (without re-fetching email/name from Sanity —
 * those should be read from Firebase via getSessionUser when needed).
 */
export async function getSanityUserByFirebaseId(firebaseUid: string) {
  try {
    return await client.fetch(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]{
        _id,
        firebaseUid,
        email,
        firstName,
        lastName,
        profileImageUrl,
        role,
        isAdmin,
        isEmployee,
        isVendor,
        vendorStatus,
        rewardPoints,
        loyaltyPoints,
        walletBalance,
        addresses,
        wishlist,
        cart,
        orders,
        notifications,
        preferences,
        createdAt,
        updatedAt
      }`,
      { firebaseUid },
    );
  } catch (err) {
    console.error("getSanityUserByFirebaseId failed:", err);
    return null;
  }
}
