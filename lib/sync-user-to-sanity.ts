import { client, writeClient } from "@/sanity/lib/client";
import {
  DEFAULT_ROLE,
  isBootstrapAdminEmail,
  legacyFlagsForRole,
  roleFromUserDoc,
  type Role,
} from "@/lib/auth/roles";

/**
 * Minimal shape needed to sync a Firebase identity into Sanity.
 * Compatible with both the client-side `firebase/auth` `User` and the
 * server-side `firebase-admin/auth` `UserRecord`.
 */
export interface SyncableFirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

/**
 * Syncs a Firebase user to Sanity CMS.
 *
 * This is the ONLY function in the app that creates or updates the
 * canonical Sanity user document. Every login flows through here via
 * POST /api/auth/session. Any other route that previously did
 * "create user if missing" inline must call this instead, otherwise
 * documents drift (missing role, wrong _type, etc).
 *
 * - Looks up by `firebaseUid` first, falling back to `email`.
 * - On miss, creates with `_id: user-${uid}` (deterministic, race-safe).
 * - On hit, patches only drifted fields.
 * - Auto-promotes to admin if the email is in ADMIN_EMAILS.
 *
 * @returns The Sanity user document _id.
 */
export async function syncUserToSanity(
  firebaseUser: SyncableFirebaseUser,
): Promise<string> {
  try {
    const { uid, email, displayName, photoURL } = firebaseUser;

    if (!email) {
      throw new Error("User email is required for Sanity sync");
    }

    // Check if user already exists in Sanity (use read client for queries)
    // Check by firebaseUid first, then by email as fallback
    const existingUser = await client.fetch(
      `*[_type == "user" && (firebaseUid == $firebaseUid || email == $email)][0]`,
      { firebaseUid: uid, email },
    );

    if (existingUser) {
      // Determine effective role.
      // - Existing role on the doc wins (admins manage roles in Sanity).
      // - First-time admin bootstrap: ADMIN_EMAILS promotes to admin.
      // - Legacy boolean flags are migrated into `role` once.
      let nextRole: Role = roleFromUserDoc(existingUser);
      if (nextRole === "user" && isBootstrapAdminEmail(email)) {
        nextRole = "admin";
      }
      const flags = legacyFlagsForRole(nextRole);

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      // Update firebaseUid if it was missing (for users found by email only)
      if (!existingUser.firebaseUid || existingUser.firebaseUid !== uid) {
        updates.firebaseUid = uid;
      }

      if (existingUser.role !== nextRole) {
        updates.role = nextRole;
      }
      // Keep legacy booleans in sync with role.
      if (existingUser.isAdmin !== flags.isAdmin)
        updates.isAdmin = flags.isAdmin;
      if (existingUser.isEmployee !== flags.isEmployee)
        updates.isEmployee = flags.isEmployee;
      // isVendor is not auto-flipped off here — vendor approval flow owns it.
      if (flags.isVendor && !existingUser.isVendor) {
        updates.isVendor = true;
      }

      // Only patch if there are updates beyond the timestamp.
      if (Object.keys(updates).length > 1) {
        await writeClient.patch(existingUser._id).set(updates).commit();
      }

      return existingUser._id;
    }

    // Use a unique document ID based on firebaseUid to prevent race conditions
    const documentId = `user-${uid}`;

    // Split displayName into firstName and lastName
    let firstName = "";
    let lastName = "";

    if (displayName) {
      const nameParts = displayName.trim().split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    } else {
      // Fallback to email username if no displayName
      firstName = email.split("@")[0];
    }

    // New user: default role is `user`. Bootstrap admins promoted from env.
    const initialRole: Role = isBootstrapAdminEmail(email)
      ? "admin"
      : DEFAULT_ROLE;
    const flags = legacyFlagsForRole(initialRole);

    // Create new user document in Sanity (use write client for mutations)
    // Use createIfNotExists to prevent duplicates during race conditions
    const newUser = await writeClient.createIfNotExists({
      _id: documentId,
      _type: "user",
      firebaseUid: uid,
      email: email,
      firstName: firstName,
      lastName: lastName || undefined,
      profileImageUrl: photoURL || undefined,
      role: initialRole,
      rewardPoints: 0,
      loyaltyPoints: 0,
      totalSpent: 0,
      walletBalance: 0,
      walletTransactions: [],
      withdrawalRequests: [],
      wishlist: [],
      cart: [],
      orders: [],
      addresses: [],
      notifications: [],
      isActive: true,
      vendorStatus: "none",
      isVendor: flags.isVendor,
      isEmployee: flags.isEmployee,
      isAdmin: flags.isAdmin,
      preferences: {
        newsletter: false,
        emailNotifications: true,
        smsNotifications: false,
        preferredCurrency: "USD",
        preferredLanguage: "en",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return newUser._id;
  } catch (error: any) {
    console.error("Error syncing user to Sanity:", error);

    // Provide more helpful error messages
    if (error?.message?.includes("Insufficient permissions")) {
      console.error(
        "\n❌ SANITY TOKEN PERMISSION ERROR:",
        "\n📝 Your SANITY_API_TOKEN doesn't have write permissions.",
        "\n✅ Solution:",
        "\n   1. Go to: https://www.sanity.io/manage",
        "\n   2. Select your project:",
        process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        "\n   3. Navigate to: API → Tokens",
        "\n   4. Create new token with 'Editor' or 'Administrator' permissions",
        "\n   5. Update SANITY_API_TOKEN in your .env file",
        "\n   6. Restart your development server",
      );
    }

    throw error;
  }
}

/**
 * Gets a Sanity user by Firebase UID
 *
 * @param firebaseUid - The Firebase user ID
 * @returns The Sanity user document or null if not found
 */
export async function getSanityUserByFirebaseUid(
  firebaseUid: string,
): Promise<any | null> {
  try {
    const user = await client.fetch(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]{
        _id,
        _type,
        firebaseUid,
        email,
        name,
        image,
        role,
        accountStatus,
        wallet,
        addresses,
        orders,
        wishlist,
        notifications,
        premiumAccount,
        businessAccount,
        employee,
        createdAt,
        updatedAt
      }`,
      { firebaseUid },
    );

    return user || null;
  } catch (error) {
    console.error("Error fetching Sanity user:", error);
    return null;
  }
}

/**
 * Updates a Sanity user's profile information
 *
 * @param firebaseUid - The Firebase user ID
 * @param updates - The fields to update
 * @returns The updated user document
 */
export async function updateSanityUser(
  firebaseUid: string,
  updates: {
    name?: string;
    image?: string;
    email?: string;
  },
): Promise<any> {
  try {
    const user = await getSanityUserByFirebaseUid(firebaseUid);

    if (!user) {
      throw new Error("User not found in Sanity");
    }

    // Use write client for patch operations
    const updatedUser = await writeClient
      .patch(user._id)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return updatedUser;
  } catch (error) {
    console.error("Error updating Sanity user:", error);
    throw error;
  }
}
