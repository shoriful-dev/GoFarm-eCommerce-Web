/**
 * @deprecated Import from `@/lib/auth/server` directly.
 * Compatibility shim that preserves the previous API while delegating to the
 * canonical auth layer.
 */
import {
  getAuthUserId as _getAuthUserId,
  getSessionUser as _getSessionUser,
  requireUser as _requireUser,
  currentUserIsAdmin as _currentUserIsAdmin,
  getSanityUserByFirebaseId as _getSanityUserByFirebaseId,
} from "@/lib/auth/server";

export const getAuthUserId = _getAuthUserId;
export const getSanityUserByFirebaseId = _getSanityUserByFirebaseId;

/**
 * Legacy shape: returns the Firebase user record (or null).
 * Prefer `getSessionUser()` from `@/lib/auth/server`.
 */
export async function getCurrentUser() {
  return await _getSessionUser();
}

/**
 * Legacy: returned the Firebase UID; throws "Unauthorized" when absent.
 */
export async function requireAuth() {
  return await _requireUser();
}

/** Legacy boolean admin check. */
export async function isAdmin() {
  return await _currentUserIsAdmin();
}

/** Legacy: throws when caller is not admin, otherwise returns the user. */
export async function requireAdmin() {
  if (!(await _currentUserIsAdmin())) {
    throw new Error("Forbidden: Admin access required");
  }
  return await _getSessionUser();
}

/** Legacy combined helper used by some API routes. */
export async function checkAdminAccess() {
  const user = await _getSessionUser();
  if (!user) return { isAdmin: false, user: null };
  return { isAdmin: await _currentUserIsAdmin(), user };
}
