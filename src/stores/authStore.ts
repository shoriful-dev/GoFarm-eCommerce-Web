import { create } from "zustand";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

// User -> Sanity sync is handled atomically inside `/api/auth/session`
// (see app/api/auth/session/route.ts). The session route mints the
// __session cookie, ensures the Sanity user document exists (joined by
// firebaseUid), writes the role custom claim, and returns. The client
// must NOT call /api/auth/sync-user separately — that route is removed.

// Module-level flag to suppress the next auth-state-change-driven session
// sync. Set this to true immediately before calling a Firebase auth method
// that briefly authenticates a user we do NOT want to log in (e.g. email
// + password sign-up: we create the account, then immediately sign out so
// the user must sign in explicitly from the sign-in page).
let skipNextAuthSync = false;

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithGithub: () => Promise<UserCredential>;
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLinkSignIn: (email: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Sync will happen in onAuthStateChanged
      toast.success("Successfully signed in!");
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    try {
      // Suppress the session-cookie sync that would normally be triggered
      // by the onAuthStateChanged listener — we do NOT want email/password
      // sign-ups to auto-log-in. The user must visit the sign-in page.
      skipNextAuthSync = true;

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      // Immediately sign the freshly created user out so the rest of the
      // app sees them as signed out. They will be authenticated only after
      // explicitly signing in from /sign-in.
      await signOut(auth);

      toast.success("Account created! Please sign in to continue.");
      return result;
    } catch (error: any) {
      skipNextAuthSync = false;
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Sync will happen in onAuthStateChanged
      // Don't show success toast here - let the calling component handle it after Sanity check
      return result;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error(error.message || "Failed to sign in with Google");
      throw error;
    }
  },

  signInWithGithub: async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Sync will happen in onAuthStateChanged
      // Don't show success toast here - let the calling component handle it after Sanity check
      return result;
    } catch (error: any) {
      console.error("Github sign-in error:", error);
      toast.error(error.message || "Failed to sign in with Github");
      throw error;
    }
  },

  sendEmailLink: async (email: string) => {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/sign-in/email-link`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save email to localStorage for email link sign-in
      window.localStorage.setItem("emailForSignIn", email);
      toast.success("Sign-in link sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send sign-in link");
      throw error;
    }
  },

  completeEmailLinkSignIn: async (email: string) => {
    try {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        throw new Error("Invalid sign-in link");
      }
      const result = await signInWithEmailLink(
        auth,
        email,
        window.location.href,
      );
      // Clear email from localStorage
      window.localStorage.removeItem("emailForSignIn");
      // Sync will happen in onAuthStateChanged
      toast.success("Successfully signed in!");
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to complete sign-in");
      throw error;
    }
  },

  logout: async () => {
    try {
      // Flush any pending cart sync before logging out
      const { default: useCartStore } = await import("@/store");
      await useCartStore.getState().flushPendingSync();

      await signOut(auth);
      toast.success("Successfully signed out!");

      // Clear all local storage and session data
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home page and force reload to clear all state
      window.location.href = "/";
    } catch (error: any) {
      console.error("❌ Logout error:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
      throw error;
    }
  },

  initializeAuth: () => {
    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If a flow (e.g. email/password sign-up) requested that we skip the
      // next sync, swallow this transition entirely. The flow is
      // responsible for calling signOut(auth) right after, which will
      // produce a follow-up event with user === null that we also skip
      // (and then clear the flag).
      if (skipNextAuthSync) {
        if (!user) {
          skipNextAuthSync = false;
          set({ user: null, loading: false });
        }
        return;
      }

      set({ user });

      // Clear existing token refresh interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }

      // Set or clear the session cookie
      if (user) {
        // Get fresh token and exchange for a __session cookie. The session
        // route also creates/updates the Sanity user doc atomically, so we
        // do NOT call /api/auth/sync-user here anymore.
        const postSession = async (idToken: string) => {
          return fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        };

        let token = await user.getIdToken(true);
        let sessionResponse = await postSession(token);

        // Retry once on transient failure (network blip, cold start, etc.).
        if (!sessionResponse.ok) {
          const detail = await sessionResponse.text().catch(() => "<no body>");
          console.warn(
            `Session cookie request failed (status ${sessionResponse.status}): ${detail}. Retrying once...`,
          );
          await new Promise((r) => setTimeout(r, 400));
          token = await user.getIdToken(true);
          sessionResponse = await postSession(token);
        }

        if (!sessionResponse.ok) {
          const detail = await sessionResponse.text().catch(() => "<no body>");
          console.error(
            `Failed to set session cookie (status ${sessionResponse.status}): ${detail}`,
          );
          set({ loading: false });
          return;
        }

        // Wait a bit to ensure cookie is set in browser
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Set up token refresh interval (refresh every 50 minutes).
        // Firebase tokens expire after 1 hour, so we refresh before that.
        // Each refresh re-runs syncUserToSanity inside the session route,
        // which keeps the Sanity profile up to date with any Firebase
        // displayName / photo updates without an extra round-trip.
        tokenRefreshInterval = setInterval(
          async () => {
            try {
              const currentUser = auth.currentUser;
              if (currentUser) {
                const freshToken = await currentUser.getIdToken(true);
                await fetch("/api/auth/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idToken: freshToken }),
                });
              }
            } catch (error) {
              console.error("❌ Failed to refresh token:", error);
            }
          },
          50 * 60 * 1000,
        ); // 50 minutes

        // Load and sync cart/wishlist from Sanity (the user doc is
        // guaranteed to exist at this point because /api/auth/session
        // awaited syncUserToSanity before responding).
        const { default: useCartStore } = await import("@/store");
        await useCartStore.getState().loadCartFromSanity();
        await useCartStore.getState().loadWishlistFromSanity();

        // Set loading to false AFTER session is established and data is loaded
        set({ loading: false });
      } else {
        await fetch("/api/auth/session", {
          method: "DELETE",
        });

        // Set loading to false for logged out state
        set({ loading: false });
      }
    });

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      unsubscribe();
    };
  },
}));
