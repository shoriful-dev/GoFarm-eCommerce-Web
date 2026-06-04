import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import { writeClient } from "@/sanity/lib/client";
import { syncUserToSanity } from "@/lib/sync-user-to-sanity";
import type { UserRecord } from "firebase-admin/auth";

// Auth + Firebase listing must run server-side; never cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

interface SanityUser {
  _id: string;
  firebaseUid: string;
  isActive?: boolean;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  loyaltyPoints?: number;
  walletBalance?: number;
  totalSpent?: number;
  notificationCount?: number;
  isEmployee?: boolean;
  employeeRole?: string;
  employeeStatus?: string;
  isAdmin?: boolean;
  isVendor?: boolean;
  vendorStatus?: string;
}

const FIREBASE_PAGE_SIZE = 1000; // listUsers max per call.

/**
 * Page through every Firebase Auth user. Firebase caps a single call at
 * 1000 users, so we follow `pageToken` until exhausted. For very large
 * datasets this should switch to true server-side cursor pagination, but
 * for the current scale it is correct and predictable.
 */
async function listAllFirebaseUsers(): Promise<UserRecord[]> {
  const all: UserRecord[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const page = await adminAuth.listUsers(FIREBASE_PAGE_SIZE, pageToken);
    all.push(...page.users);
    pageToken = page.pageToken ?? undefined;
  } while (pageToken);
  return all;
}

/**
 * Best-effort: ensure a Sanity user document exists for every Firebase
 * user. Failures are swallowed per-user so a single Sanity hiccup never
 * breaks the admin list.
 */
async function ensureAllSanityUsers(
  firebaseUsers: UserRecord[],
  existingUids: Set<string>,
): Promise<void> {
  const missing = firebaseUsers.filter(
    (u) => !!u.email && !existingUids.has(u.uid),
  );
  if (missing.length === 0) return;

  const CONCURRENCY = 5;
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((u) =>
        syncUserToSanity({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
        }).catch((err) => {
          console.error(`auto-sync sanity user ${u.uid} failed:`, err);
        }),
      ),
    );
  }
}

const SANITY_USER_PROJECTION = `{
  _id,
  firebaseUid,
  isActive,
  role,
  firstName,
  lastName,
  phone,
  loyaltyPoints,
  walletBalance,
  totalSpent,
  "notificationCount": count(notifications),
  isEmployee,
  employeeRole,
  employeeStatus,
  isAdmin,
  isVendor,
  vendorStatus
}`;

export async function GET(request: NextRequest) {
  // Admin-only.
  try {
    await requireRole("admin");
  } catch (err) {
    const status = (err as Error).message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(
    1,
    Math.min(200, parseInt(searchParams.get("limit") || "20")),
  );
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const query = (searchParams.get("query") || "").trim().toLowerCase();
  const roleFilter = (searchParams.get("role") || "all").trim().toLowerCase();

  let firebaseUsers: UserRecord[];
  try {
    firebaseUsers = await listAllFirebaseUsers();
  } catch (err) {
    console.error("listAllFirebaseUsers failed:", err);
    return NextResponse.json(
      { error: "Failed to list Firebase users" },
      { status: 500 },
    );
  }

  // First Sanity read — gives the existing-uid set.
  let sanityUsers: SanityUser[] = [];
  try {
    sanityUsers = await writeClient.fetch<SanityUser[]>(
      `*[_type == "user"]${SANITY_USER_PROJECTION}`,
    );
  } catch (err) {
    console.error("sanity user list failed:", err);
  }

  // Auto-sync any Firebase user that has no Sanity profile yet.
  const existingUids = new Set(sanityUsers.map((u) => u.firebaseUid));
  const missingCount = firebaseUsers.filter(
    (u) => !existingUids.has(u.uid),
  ).length;
  if (missingCount > 0) {
    await ensureAllSanityUsers(firebaseUsers, existingUids);
    // Re-read Sanity so the freshly-synced docs land in the join map.
    try {
      sanityUsers = await writeClient.fetch<SanityUser[]>(
        `*[_type == "user"]${SANITY_USER_PROJECTION}`,
      );
    } catch (err) {
      console.error("sanity re-fetch after auto-sync failed:", err);
    }
  }

  const sanityUserMap = new Map<string, SanityUser>(
    sanityUsers.map((u) => [u.firebaseUid, u]),
  );

  // Firebase is the source of truth for identity; Sanity adds domain data.
  const combined = firebaseUsers.map((fu) => {
    const su = sanityUserMap.get(fu.uid);
    const displayName = fu.displayName || "";
    const [firstName, ...rest] = displayName.split(" ");
    const lastName = rest.join(" ");

    return {
      id: fu.uid,
      firebaseUid: fu.uid,
      sanityId: su?._id,
      firstName: su?.firstName || firstName || "",
      lastName: su?.lastName || lastName || "",
      fullName:
        displayName ||
        `${su?.firstName ?? ""} ${su?.lastName ?? ""}`.trim() ||
        fu.email ||
        "",
      email: fu.email || "",
      phone: su?.phone || fu.phoneNumber || "",
      imageUrl: fu.photoURL || "",
      createdAt: new Date(fu.metadata.creationTime).getTime(),
      lastSignInAt: fu.metadata.lastSignInTime
        ? new Date(fu.metadata.lastSignInTime).getTime()
        : null,
      emailVerified: fu.emailVerified,
      banned: fu.disabled,
      providers: (fu.providerData || [])
        .map((p) => p.providerId)
        .filter(Boolean),
      role: (su?.role as string) || "user",
      loyaltyPoints: su?.loyaltyPoints || 0,
      walletBalance: su?.walletBalance || 0,
      totalSpent: su?.totalSpent || 0,
      notificationCount: su?.notificationCount || 0,
      isEmployee: !!su?.isEmployee,
      employeeRole: su?.employeeRole,
      employeeStatus: su?.employeeStatus,
      isAdmin: su?.role === "admin" || !!su?.isAdmin,
      isVendor: !!su?.isVendor,
      vendorStatus: su?.vendorStatus,
    };
  });

  const filtered = query
    ? combined.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.fullName.toLowerCase().includes(query),
      )
    : combined;

  // Role-based segmentation. "user" excludes admins, vendors and
  // employees so the segment shows only “plain” customers.
  const roleFiltered =
    roleFilter === "all"
      ? filtered
      : filtered.filter((u) => {
          if (roleFilter === "admin") return u.isAdmin;
          if (roleFilter === "vendor") return u.isVendor;
          if (roleFilter === "employee") return u.isEmployee;
          if (roleFilter === "user")
            return !u.isAdmin && !u.isVendor && !u.isEmployee;
          return true;
        });

  roleFiltered.sort((a, b) => b.createdAt - a.createdAt);

  const paginated = roleFiltered.slice(offset, offset + limit);

  return NextResponse.json({
    users: paginated,
    totalCount: roleFiltered.length,
    hasNextPage: offset + limit < roleFiltered.length,
  });
}
