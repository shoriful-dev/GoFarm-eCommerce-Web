// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

let analytics: Analytics | null = null;
let analyticsReadyPromise: Promise<Analytics | null> | null = null;

if (typeof window !== "undefined") {
  analyticsReadyPromise = isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        return analytics;
      }
      return null;
    })
    .catch(() => null);
}

/**
 * Resolves once Firebase Analytics has been initialized in the browser
 * (or immediately with `null` on the server / in unsupported environments).
 */
export function getAnalyticsAsync(): Promise<Analytics | null> {
  return analyticsReadyPromise ?? Promise.resolve(null);
}

export { app, auth, analytics };
