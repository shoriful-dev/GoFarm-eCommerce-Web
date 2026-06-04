/**
 * One-time backfill: copy `isAdmin` / `isEmployee` / `isVendor` flags from
 * Sanity user docs into Firebase Auth custom claims.
 *
 * After running this, `requireRole()` in `lib/auth/server.ts` can decide roles
 * synchronously from the JWT — no Sanity round-trip on every request.
 *
 * Usage:
 *   pnpm tsx scripts/sync-claims.ts            # dry-run
 *   pnpm tsx scripts/sync-claims.ts --apply    # actually write claims
 *
 * Requires (server-only) env: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_SANITY_PROJECT_ID,
 *   NEXT_PUBLIC_SANITY_DATASET, SANITY_API_READ_TOKEN.
 */
import { createClient } from "@sanity/client";
import { adminAuth } from "../lib/firebase/admin";

interface SanityUserFlags {
  _id: string;
  firebaseUid?: string;
  email?: string;
  isAdmin?: boolean;
  isEmployee?: boolean;
  isVendor?: boolean;
}

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(
    `\n[sync-claims] mode=${apply ? "APPLY" : "DRY-RUN"} (pass --apply to write)\n`,
  );

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-11-09",
    token: process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_TOKEN,
    useCdn: false,
  });

  const users = await sanity.fetch<SanityUserFlags[]>(
    `*[_type == "user" && defined(firebaseUid) && (isAdmin == true || isEmployee == true || isVendor == true)]{
      _id, firebaseUid, email, isAdmin, isEmployee, isVendor
    }`,
  );

  console.log(`[sync-claims] ${users.length} candidate user(s)\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    if (!u.firebaseUid) {
      skipped++;
      continue;
    }

    const desired = {
      ...(u.isAdmin ? { admin: true } : {}),
      ...(u.isEmployee ? { employee: true } : {}),
      ...(u.isVendor ? { vendor: true } : {}),
    };

    try {
      const record = await adminAuth.getUser(u.firebaseUid);
      const existing = record.customClaims ?? {};

      const merged = { ...existing, ...desired };
      const sameAsExisting = Object.entries(desired).every(
        ([k, v]) => (existing as Record<string, unknown>)[k] === v,
      );

      if (sameAsExisting) {
        skipped++;
        continue;
      }

      console.log(
        `  ${apply ? "WRITE" : "WOULD"}  ${u.email ?? "<no-email>"}  ` +
          `(uid=${u.firebaseUid.slice(0, 10)}…)  →  ${JSON.stringify(desired)}`,
      );

      if (apply) {
        await adminAuth.setCustomUserClaims(u.firebaseUid, merged);
        // Force token refresh on next request so the new claim takes effect.
        await adminAuth.revokeRefreshTokens(u.firebaseUid);
      }
      updated++;
    } catch (err) {
      failed++;
      console.error(
        `  FAIL   ${u.email ?? "<no-email>"} (uid=${u.firebaseUid}): ${
          (err as Error).message
        }`,
      );
    }
  }

  console.log(
    `\n[sync-claims] done. updated=${updated}, skipped=${skipped}, failed=${failed}\n`,
  );

  if (!apply && updated > 0) {
    console.log("[sync-claims] Re-run with --apply to commit changes.\n");
  }
}

main().catch((err) => {
  console.error("[sync-claims] fatal:", err);
  process.exit(1);
});
