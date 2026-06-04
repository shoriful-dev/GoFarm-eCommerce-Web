import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import { writeClient } from "@/sanity/lib/client";
import { ROLES, legacyFlagsForRole, type Role } from "@/lib/auth/roles";
import { assertSameOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/import
 *
 * Bulk-update users from a CSV produced by /api/admin/users/export.
 * The CSV is keyed on `firebaseUid` (or `email` as a fallback) and only
 * the following columns are written back:
 *   - firstName, lastName, phone
 *   - role          (one of: user | admin | vendor | employee)
 *   - loyaltyPoints, walletBalance
 *
 * Identity columns (email, providers, createdAt, …) are ignored — those
 * are owned by Firebase Auth and cannot be patched through CSV.
 */

interface ImportResult {
  total: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; uid?: string; email?: string; reason: string }>;
}

// Lightweight RFC-4180-ish CSV parser. Handles quoted fields, escaped
// quotes (`""`), embedded commas, and `\r\n` / `\n` row separators.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (c === "\r") {
      // Either \r\n or stray \r — treat both as row terminators.
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      if (text[i] === "\n") i++;
      continue;
    }
    if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    cell += c;
    i++;
  }
  // Flush any trailing cell/row that didn't end with a newline.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v && v.trim().length > 0));
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  try {
    await requireRole("admin");
  } catch (err) {
    const status = (err as Error).message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  let csvText = "";
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File) {
        csvText = await file.text();
      } else {
        return NextResponse.json(
          { error: "Missing 'file' field in form data" },
          { status: 400 },
        );
      }
    } else {
      // Allow raw text/csv body too.
      csvText = await req.text();
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read request body", details: (err as Error).message },
      { status: 400 },
    );
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "CSV must include a header row and at least one data row" },
      { status: 400 },
    );
  }

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const uidCol = idx("firebaseUid");
  const emailCol = idx("email");
  if (uidCol === -1 && emailCol === -1) {
    return NextResponse.json(
      { error: "CSV must contain a `firebaseUid` or `email` column" },
      { status: 400 },
    );
  }

  const cols = {
    firstName: idx("firstName"),
    lastName: idx("lastName"),
    phone: idx("phone"),
    role: idx("role"),
    loyaltyPoints: idx("loyaltyPoints"),
    walletBalance: idx("walletBalance"),
  };

  const result: ImportResult = {
    total: rows.length - 1,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Hard cap so a malicious or accidental upload can't lock up the server.
  const MAX_ROWS = 5000;
  if (result.total > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (${result.total}). Limit is ${MAX_ROWS}.` },
      { status: 413 },
    );
  }

  // Build an email→uid map only when at least one row is keyed by email.
  let emailToUid: Map<string, string> | null = null;
  const needEmailLookup =
    uidCol === -1 ||
    rows.slice(1).some((r) => !(r[uidCol] && r[uidCol].trim()));
  if (needEmailLookup) {
    emailToUid = new Map();
    let pageToken: string | undefined;
    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      for (const u of page.users) {
        if (u.email) emailToUid.set(u.email.toLowerCase(), u.uid);
      }
      pageToken = page.pageToken ?? undefined;
    } while (pageToken);
  }

  const CONCURRENCY = 5;
  const dataRows = rows.slice(1);

  for (let i = 0; i < dataRows.length; i += CONCURRENCY) {
    const batch = dataRows.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (row, j) => {
        const rowNum = i + j + 2; // 1-based, +1 for header.
        const rawUid = uidCol >= 0 ? (row[uidCol] || "").trim() : "";
        const rawEmail =
          emailCol >= 0 ? (row[emailCol] || "").trim().toLowerCase() : "";
        const uid = rawUid || (emailToUid?.get(rawEmail) ?? "");
        if (!uid) {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            email: rawEmail,
            reason: "No firebaseUid and email not found",
          });
          return;
        }

        // Verify the user actually exists on Firebase.
        let fbUser;
        try {
          fbUser = await adminAuth.getUser(uid);
        } catch {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            uid,
            reason: "Firebase user not found",
          });
          return;
        }

        const sanityUser = await writeClient.fetch<{ _id: string } | null>(
          `*[_type == "user" && firebaseUid == $uid][0]{ _id }`,
          { uid },
        );
        if (!sanityUser) {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            uid,
            reason: "Sanity profile missing",
          });
          return;
        }

        const patch: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
        if (cols.firstName >= 0 && row[cols.firstName] !== undefined) {
          patch.firstName = (row[cols.firstName] || "").trim();
        }
        if (cols.lastName >= 0 && row[cols.lastName] !== undefined) {
          patch.lastName = (row[cols.lastName] || "").trim();
        }
        if (cols.phone >= 0 && row[cols.phone] !== undefined) {
          patch.phone = (row[cols.phone] || "").trim();
        }
        if (cols.loyaltyPoints >= 0) {
          const n = parseNumber(row[cols.loyaltyPoints]);
          if (n !== undefined) patch.loyaltyPoints = Math.max(0, Math.floor(n));
        }
        if (cols.walletBalance >= 0) {
          const n = parseNumber(row[cols.walletBalance]);
          if (n !== undefined) patch.walletBalance = Math.max(0, n);
        }

        let nextRole: Role | undefined;
        if (cols.role >= 0) {
          const raw = (row[cols.role] || "").trim().toLowerCase();
          if (raw && (ROLES as readonly string[]).includes(raw)) {
            nextRole = raw as Role;
            patch.role = nextRole;
            const flags = legacyFlagsForRole(nextRole);
            patch.isAdmin = flags.isAdmin;
            patch.isEmployee = flags.isEmployee;
            if (flags.isVendor) patch.isVendor = true;
          } else if (raw) {
            result.errors.push({
              row: rowNum,
              uid,
              reason: `Invalid role "${raw}"`,
            });
          }
        }

        try {
          await writeClient.patch(sanityUser._id).set(patch).commit();
        } catch (err) {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            uid,
            reason: `Sanity patch failed: ${(err as Error).message}`,
          });
          return;
        }

        // Mirror displayName when first/last name changed.
        try {
          const nextDisplay = [
            patch.firstName !== undefined ? String(patch.firstName) : undefined,
            patch.lastName !== undefined ? String(patch.lastName) : undefined,
          ]
            .filter((s) => typeof s === "string")
            .join(" ")
            .trim();
          if (nextDisplay && nextDisplay !== fbUser.displayName) {
            await adminAuth.updateUser(uid, { displayName: nextDisplay });
          }
        } catch (err) {
          console.error("import: firebase displayName mirror failed:", err);
        }

        if (nextRole) {
          try {
            const flags = legacyFlagsForRole(nextRole);
            await adminAuth.setCustomUserClaims(uid, {
              ...(fbUser.customClaims ?? {}),
              role: nextRole,
              admin: flags.isAdmin,
              employee: flags.isEmployee,
              vendor: flags.isVendor || !!fbUser.customClaims?.vendor,
            });
            await adminAuth.revokeRefreshTokens(uid);
          } catch (err) {
            console.error("import: firebase claim mirror failed:", err);
          }
        }

        result.updated++;
      }),
    );
  }

  return NextResponse.json(result);
}
