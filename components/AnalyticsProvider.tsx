"use client";

/**
 * Wires Firebase Analytics user identity to the auth state.
 *
 * - Calls `setUserId(uid)` and `setUserProperties({ role })` when the user signs in.
 * - Calls `setUserId(null)` when the user signs out.
 * - Fires GA4 reserved `login` / `sign_up` / `logout` events on transitions.
 *
 * Mount once near the root of the tree (in app/layout.tsx).
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  setAnalyticsUser,
  clearAnalyticsUser,
  trackEvent,
} from "@/lib/analytics";

export default function AnalyticsProvider() {
  const user = useAuthStore((s) => s.user);
  const previousUidRef = useRef<string | null>(null);

  useEffect(() => {
    const previousUid = previousUidRef.current;
    const currentUid = user?.uid ?? null;

    if (currentUid && currentUid !== previousUid) {
      // Sign-in transition.
      const provider =
        user?.providerData?.[0]?.providerId?.replace(".com", "") ?? "password";
      const isNew =
        user?.metadata?.creationTime === user?.metadata?.lastSignInTime;

      void setAnalyticsUser(currentUid, {
        provider,
        email_verified: !!user?.emailVerified,
      });

      trackEvent(isNew ? "sign_up" : "login", {
        method: provider,
        user_id: currentUid,
      });
    } else if (!currentUid && previousUid) {
      // Sign-out transition.
      trackEvent("logout", { user_id: previousUid });
      void clearAnalyticsUser();
    }

    previousUidRef.current = currentUid;
  }, [user]);

  return null;
}
