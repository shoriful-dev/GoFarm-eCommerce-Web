/**
 * Client-side role/admin helpers.
 *
 * The canonical role lives on the Sanity user document (`role` field) and
 * is mirrored into Firebase custom claims by `/api/auth/session`. This file
 * provides convenience hooks for client components.
 *
 * Server code should import from `@/lib/auth/server` instead.
 */

import React from "react";
import {
  getBootstrapAdminEmails,
  isBootstrapAdminEmail,
  type Role,
} from "../lib/auth/roles";

export const getAdminEmails = (): string[] => getBootstrapAdminEmails();

export const isUserAdmin = (userEmail: string | null | undefined): boolean =>
  isBootstrapAdminEmail(userEmail);

/**
 * Synchronous admin check given a (Sanity) user object.
 * Considers both the `role` field and legacy `isAdmin` flag.
 */
export const isAdmin = (
  user:
    | { email?: string | null; role?: string | null; isAdmin?: boolean }
    | null
    | undefined,
): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.isAdmin === true) return true;
  if (user.email) return isBootstrapAdminEmail(user.email);
  return false;
};

interface UseRoleResult {
  role: Role | null;
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Resolve the current user's role from the server (`/api/auth/role`).
 * Returns `{ role: null, isLoading: true }` until the lookup completes,
 * which lets callers wait instead of treating "still checking" as
 * "not allowed" (the bug that caused legitimate admins to be redirected
 * to /admin/access-denied).
 */
export const useUserRole = (
  userEmail: string | null | undefined,
  firebaseUid?: string | null | undefined,
): UseRoleResult => {
  const [role, setRole] = React.useState<Role | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;

    if (!userEmail && !firebaseUid) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Optimistic bootstrap: if the email is in ADMIN_EMAILS, surface admin
    // immediately so admin UI doesn't flash "access denied" while the
    // server round-trip is in flight.
    if (userEmail && isBootstrapAdminEmail(userEmail)) {
      setRole("admin");
    }

    fetch("/api/auth/role", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { role: Role | null }) => {
        if (cancelled) return;
        setRole(
          data.role ??
            (userEmail && isBootstrapAdminEmail(userEmail) ? "admin" : "user"),
        );
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("useUserRole: failed to load role", err);
        setRole(
          userEmail && isBootstrapAdminEmail(userEmail) ? "admin" : "user",
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userEmail, firebaseUid]);

  return { role, isAdmin: role === "admin", isLoading };
};

/**
 * Backwards-compatible boolean hook. Prefer `useUserRole` so callers can
 * distinguish "still loading" from "not admin" — that's what fixed the
 * /admin/access-denied flash bug.
 */
export const useIsAdmin = (
  userEmail: string | null | undefined,
  firebaseUid?: string | null | undefined,
): boolean => {
  const { isAdmin } = useUserRole(userEmail, firebaseUid);
  return isAdmin;
};
