import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Strict input contract — prevents oversized payloads, garbage types,
// and accidental mass-assignment of fields the client must not control
// (role, walletBalance, isAdmin… are all rejected at the schema layer).
const ProfileBody = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  dateOfBirth: z.string().trim().max(40).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof ProfileBody>;
    try {
      body = ProfileBody.parse(await request.json());
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { firstName, lastName, phone, dateOfBirth } = body;

    // Identity is taken from the verified session — NEVER from the body.
    // The previous version trusted `body.firebaseUid`, which let any
    // authenticated user overwrite another user's profile by spoofing it.
    const sanityUserId = await backendClient.fetch<string | null>(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]._id`,
      { firebaseUid: userId },
    );

    let result;
    const patch: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (firstName !== undefined) patch.firstName = firstName;
    if (lastName !== undefined) patch.lastName = lastName;
    if (phone !== undefined) patch.phone = phone;
    if (dateOfBirth !== undefined) patch.dateOfBirth = dateOfBirth;

    if (sanityUserId) {
      result = await backendClient.patch(sanityUserId).set(patch).commit();
    } else {
      // Defensive: the session route normally creates the doc on login.
      const { syncUserToSanity } = await import("@/lib/sync-user-to-sanity");
      const newId = await syncUserToSanity({ uid: userId, email: "" });
      result = await backendClient.patch(newId).set(patch).commit();
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
