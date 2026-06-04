/**
 * Single Firebase Admin SDK initialization.
 * All server code must import `adminAuth`, `adminApp`, etc. from this module
 * (or via the legacy re-export at @/lib/firebase-admin) — never call
 * `initializeApp` from another file.
 */
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function buildApp(): App {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin: missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminApp: App = getApps()[0] ?? buildApp();
export const adminAuth: Auth = getAuth(adminApp);

/**
 * Verify a raw Firebase ID token (1-hour lifetime).
 * Prefer `verifySessionCookie` for long-lived sessions.
 */
export async function verifyIdToken(token: string) {
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // Expected, non-actionable codes — swallow silently so logout / token
    // expiry don’t pollute the server log.
    const SILENT = new Set([
      "auth/id-token-expired",
      "auth/id-token-revoked",
      "auth/argument-error",
      "auth/invalid-id-token",
    ]);
    if (!code || !SILENT.has(code)) {
      console.error("verifyIdToken failed:", err);
    }
    return null;
  }
}

/**
 * Verify a Firebase session cookie (created via createSessionCookie, up to 14 days).
 */
export async function verifySessionCookie(cookie: string) {
  try {
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // Expected, non-actionable codes — swallow silently. “revoked” in
    // particular fires on every request that arrives in flight while the
    // user is logging out (we explicitly revoke refresh tokens in the
    // DELETE /api/auth/session handler).
    const SILENT = new Set([
      "auth/session-cookie-expired",
      "auth/session-cookie-revoked",
      "auth/argument-error",
      "auth/invalid-session-cookie",
    ]);
    if (!code || !SILENT.has(code)) {
      console.error("verifySessionCookie failed:", err);
    }
    return null;
  }
}
