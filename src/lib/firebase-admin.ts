/**
 * @deprecated Import from `@/lib/firebase/admin` directly.
 * This module is a thin re-export to keep existing call sites compiling
 * while the codebase migrates to the new auth layer.
 */
export {
  adminAuth,
  adminApp,
  verifyIdToken,
  verifySessionCookie,
} from "@/lib/firebase/admin";
