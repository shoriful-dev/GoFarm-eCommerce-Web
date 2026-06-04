import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { adminAuth } from "@/lib/firebase/admin";
import { writeClient } from "@/sanity/lib/client";
import { ROLES, legacyFlagsForRole, type Role } from "@/lib/auth/roles";
import { assertSameOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[uid]
 *
 * Admin edit endpoint for a single user. Updates the Sanity profile
 * (the canonical place for first/last name, phone, role, points, etc.)
 * and mirrors role + display-name changes back into Firebase so the two
 * systems stay in sync.
 *
 * Body shape (all fields optional, only provided keys are updated):
 *   {
 *     firstName?, lastName?, phone?,
 *     role?, loyaltyPoints?, walletBalance?,
 *   }
 */
const PatchBody = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(ROLES).optional(),
  loyaltyPoints: z.number().int().min(0).max(10_000_000).optional(),
  walletBalance: z.number().min(0).max(10_000_000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  try {
    await requireRole("admin");
  } catch (err) {
    const status = (err as Error).message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  const { uid } = await params;
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: (err as Error).message },
      { status: 400 },
    );
  }

  // Confirm the Firebase user exists.
  let fbUser;
  try {
    fbUser = await adminAuth.getUser(uid);
  } catch {
    return NextResponse.json(
      { error: "Firebase user not found" },
      { status: 404 },
    );
  }

  // Locate the Sanity profile (createIfNotExists guard handled separately).
  const sanityUser = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "user" && firebaseUid == $uid][0]{ _id }`,
    { uid },
  );
  if (!sanityUser) {
    return NextResponse.json(
      { error: "Sanity profile not found — sign in once to create it" },
      { status: 404 },
    );
  }

  // Build Sanity patch.
  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (body.firstName !== undefined) patch.firstName = body.firstName;
  if (body.lastName !== undefined) patch.lastName = body.lastName;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.loyaltyPoints !== undefined)
    patch.loyaltyPoints = body.loyaltyPoints;
  if (body.walletBalance !== undefined)
    patch.walletBalance = body.walletBalance;
  if (body.role) {
    patch.role = body.role;
    const flags = legacyFlagsForRole(body.role as Role);
    patch.isAdmin = flags.isAdmin;
    patch.isEmployee = flags.isEmployee;
    // The role change IS the vendor approval. Setting role=vendor
    // immediately activates the vendor: no separate vendor-application
    // approval round-trip is required. Conversely, changing the role
    // away from "vendor" deactivates them so the vendor menu/area is
    // immediately revoked.
    if (flags.isVendor) {
      patch.isVendor = true;
      patch.vendorStatus = "active";
      patch.vendorApprovedAt = new Date().toISOString();
    } else {
      patch.isVendor = false;
      patch.vendorStatus = null;
    }
  }

  try {
    await writeClient.patch(sanityUser._id).set(patch).commit();
  } catch (err) {
    console.error("admin user patch failed:", err);
    return NextResponse.json(
      { error: "Failed to update Sanity user" },
      { status: 500 },
    );
  }

  // Mirror back to Firebase: displayName + role custom claim.
  try {
    const nextDisplay = [
      body.firstName ?? undefined,
      body.lastName ?? undefined,
    ]
      .filter((s) => typeof s === "string")
      .join(" ")
      .trim();
    if (nextDisplay && nextDisplay !== fbUser.displayName) {
      await adminAuth.updateUser(uid, { displayName: nextDisplay });
    }
  } catch (err) {
    console.error("firebase displayName mirror failed:", err);
  }

  if (body.role) {
    try {
      const flags = legacyFlagsForRole(body.role as Role);
      await adminAuth.setCustomUserClaims(uid, {
        ...(fbUser.customClaims ?? {}),
        role: body.role,
        admin: flags.isAdmin,
        employee: flags.isEmployee,
        // Mirror vendor exactly off the new role \u2014 the role change is the
        // single source of truth for vendor activation now.
        vendor: flags.isVendor,
      });
      // Force the user to re-issue tokens with fresh claims on next request.
      await adminAuth.revokeRefreshTokens(uid);
    } catch (err) {
      console.error("firebase claim mirror failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
