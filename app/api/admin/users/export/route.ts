import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import { writeClient } from "@/sanity/lib/client";
import type { UserRecord } from "firebase-admin/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

interface SanityUser {
  firebaseUid: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  loyaltyPoints?: number;
  walletBalance?: number;
  totalSpent?: number;
  isEmployee?: boolean;
  employeeRole?: string;
  employeeStatus?: string;
  isAdmin?: boolean;
  isVendor?: boolean;
  vendorStatus?: string;
}

const FIREBASE_PAGE_SIZE = 1000;

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

// CSV cell escaping per RFC 4180. Always wrap in quotes when the cell
// contains a comma, quote, newline, or leading/trailing whitespace, then
// double-up embedded quotes.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const COLUMNS: Array<{ key: string; header: string }> = [
  { key: "firebaseUid", header: "firebaseUid" },
  { key: "email", header: "email" },
  { key: "emailVerified", header: "emailVerified" },
  { key: "firstName", header: "firstName" },
  { key: "lastName", header: "lastName" },
  { key: "phone", header: "phone" },
  { key: "role", header: "role" },
  { key: "providers", header: "providers" },
  { key: "isAdmin", header: "isAdmin" },
  { key: "isEmployee", header: "isEmployee" },
  { key: "employeeRole", header: "employeeRole" },
  { key: "employeeStatus", header: "employeeStatus" },
  { key: "isVendor", header: "isVendor" },
  { key: "vendorStatus", header: "vendorStatus" },
  { key: "loyaltyPoints", header: "loyaltyPoints" },
  { key: "walletBalance", header: "walletBalance" },
  { key: "totalSpent", header: "totalSpent" },
  { key: "banned", header: "banned" },
  { key: "createdAt", header: "createdAt" },
  { key: "lastSignInAt", header: "lastSignInAt" },
];

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");
  } catch (err) {
    const status = (err as Error).message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get("scope") || "all").toLowerCase();
  const query = (searchParams.get("query") || "").trim().toLowerCase();
  const limit = Math.max(0, parseInt(searchParams.get("limit") || "0"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

  let firebaseUsers: UserRecord[];
  try {
    firebaseUsers = await listAllFirebaseUsers();
  } catch (err) {
    console.error("export listAllFirebaseUsers failed:", err);
    return NextResponse.json(
      { error: "Failed to list Firebase users" },
      { status: 500 },
    );
  }

  let sanityUsers: SanityUser[] = [];
  try {
    sanityUsers = await writeClient.fetch<SanityUser[]>(
      `*[_type == "user"]{
        firebaseUid, role, firstName, lastName, phone,
        loyaltyPoints, walletBalance, totalSpent,
        isEmployee, employeeRole, employeeStatus,
        isAdmin, isVendor, vendorStatus
      }`,
    );
  } catch (err) {
    console.error("export sanity user list failed:", err);
  }

  const sanityMap = new Map<string, SanityUser>(
    sanityUsers.map((u) => [u.firebaseUid, u]),
  );

  const combined = firebaseUsers.map((fu) => {
    const su = sanityMap.get(fu.uid);
    const displayName = fu.displayName || "";
    const [firstNameFromAuth, ...rest] = displayName.split(" ");
    const lastNameFromAuth = rest.join(" ");
    return {
      firebaseUid: fu.uid,
      email: fu.email || "",
      emailVerified: fu.emailVerified,
      firstName: su?.firstName || firstNameFromAuth || "",
      lastName: su?.lastName || lastNameFromAuth || "",
      phone: su?.phone || fu.phoneNumber || "",
      role: su?.role || "user",
      providers: (fu.providerData || [])
        .map((p) => p.providerId)
        .filter(Boolean)
        .join("|"),
      isAdmin: su?.role === "admin" || !!su?.isAdmin,
      isEmployee: !!su?.isEmployee,
      employeeRole: su?.employeeRole || "",
      employeeStatus: su?.employeeStatus || "",
      isVendor: !!su?.isVendor,
      vendorStatus: su?.vendorStatus || "",
      loyaltyPoints: su?.loyaltyPoints ?? 0,
      walletBalance: su?.walletBalance ?? 0,
      totalSpent: su?.totalSpent ?? 0,
      banned: fu.disabled,
      createdAt: fu.metadata.creationTime
        ? new Date(fu.metadata.creationTime).toISOString()
        : "",
      lastSignInAt: fu.metadata.lastSignInTime
        ? new Date(fu.metadata.lastSignInTime).toISOString()
        : "",
      _searchHay: `${displayName} ${fu.email || ""} ${su?.firstName || ""} ${
        su?.lastName || ""
      }`.toLowerCase(),
      _createdMs: fu.metadata.creationTime
        ? new Date(fu.metadata.creationTime).getTime()
        : 0,
    };
  });

  const filtered = query
    ? combined.filter((u) => u._searchHay.includes(query))
    : combined;

  filtered.sort((a, b) => b._createdMs - a._createdMs);

  // scope governs both the row set AND the row count:
  //  - "page"      → current table view (search + pagination window).
  //  - "all"       → every user in the dataset.
  //  - "oauth"     → only users who signed in with a federated/OAuth
  //                  provider (anything other than email/password or
  //                  phone). Useful for triaging Google-auth issues.
  //  - "password"  → only email/password (non-OAuth) users.
  const FEDERATED_PROVIDERS = new Set([
    "google.com",
    "facebook.com",
    "apple.com",
    "github.com",
    "twitter.com",
    "microsoft.com",
    "yahoo.com",
    "oidc",
    "saml",
  ]);
  const isOauthUser = (providers: string) =>
    providers
      .split("|")
      .some(
        (p) =>
          FEDERATED_PROVIDERS.has(p) ||
          p.startsWith("oidc.") ||
          p.startsWith("saml."),
      );

  let scoped = filtered;
  if (scope === "oauth") {
    scoped = filtered.filter((u) => isOauthUser(u.providers));
  } else if (scope === "password") {
    scoped = filtered.filter((u) => !isOauthUser(u.providers));
  }

  const rows =
    scope === "page" && limit > 0
      ? scoped.slice(offset, offset + limit)
      : scoped;

  const headerLine = COLUMNS.map((c) => csvCell(c.header)).join(",");
  const dataLines = rows.map((row) =>
    COLUMNS.map((c) => csvCell((row as Record<string, unknown>)[c.key])).join(
      ",",
    ),
  );
  // \uFEFF BOM keeps Excel happy with UTF-8 (otherwise non-ASCII garbles).
  const csv = "\uFEFF" + [headerLine, ...dataLines].join("\r\n") + "\r\n";

  const date = new Date().toISOString().slice(0, 10);
  const filename = `gofarm-users-${scope}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
