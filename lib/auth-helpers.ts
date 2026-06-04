/**
 * @deprecated Import from `@/lib/auth/server` directly.
 * Compatibility shim that preserves the previous API.
 */
import {
  getSessionUser,
  requireUser,
  isAdminEmail,
  currentUserIsAdmin,
  getVendorStatus,
} from "@/lib/auth/server";
import { client } from "@/sanity/lib/client";

export async function getCurrentUser() {
  return await getSessionUser();
}

export async function requireAuth() {
  await requireUser();
  return await getSessionUser();
}

/**
 * Legacy `isUserAdmin(email, uid?)`:
 *  1. Check ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAIL env
 *  2. Optionally check Sanity isAdmin field
 */
export async function isUserAdmin(
  email: string | undefined,
  uid?: string,
): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email)) return true;

  if (uid) {
    try {
      const sanityUser = await client.fetch<{ isAdmin?: boolean } | null>(
        `*[_type == "user" && firebaseUid == $uid][0]{ isAdmin }`,
        { uid },
      );
      if (sanityUser?.isAdmin === true) return true;
    } catch (err) {
      console.error("isUserAdmin: Sanity check failed", err);
    }
  }
  return false;
}

export async function checkVendorStatus(uid: string) {
  return await getVendorStatus(uid);
}

export { currentUserIsAdmin };
