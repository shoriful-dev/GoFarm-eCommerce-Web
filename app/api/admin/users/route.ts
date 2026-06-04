import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminAccess, requireAdmin } from "@/lib/firebase-admin-auth";
import { adminAuth } from "@/lib/firebase-admin";
import { writeClient } from "@/sanity/lib/client";
import { assertSameOrigin } from "@/lib/security/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bulk-delete contract — caps batch size and rejects non-string entries
// before they ever reach Firebase or Sanity.
const DeleteBody = z.object({
  userIds: z
    .array(z.string().trim().min(1).max(128))
    .min(1, "At least one userId is required")
    .max(100, "Cannot delete more than 100 users in one request"),
});

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user and check admin
    const currentUser = await requireAdmin();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 },
      );
    }

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const query = searchParams.get("query") || "";

    // Fetch users from Firebase
    const usersResult = await adminAuth.listUsers(limit);

    // Format user data
    const formattedUsers = usersResult.users.map((user) => {
      const displayName = user.displayName || "";
      const nameParts = displayName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      return {
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        fullName: displayName,
        email: user.email || "",
        imageUrl: user.photoURL || "",
        createdAt: new Date(user.metadata.creationTime).getTime(),
        lastSignInAt: user.metadata.lastSignInTime
          ? new Date(user.metadata.lastSignInTime).getTime()
          : null,
        emailVerified: user.emailVerified,
        banned: user.disabled,
        locked: false,
        twoFactorEnabled: (user.multiFactor?.enrolledFactors?.length ?? 0) > 0,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      totalCount: usersResult.users.length,
      hasNextPage: !!usersResult.pageToken,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Delete users (single or bulk)
export async function DELETE(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  try {
    // Check if user is admin (checks both env var and Sanity isAdmin field)
    const { isAdmin, user } = await checkAdminAccess();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 },
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    let userIds: string[];
    try {
      ({ userIds } = DeleteBody.parse(body));
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof z.ZodError
              ? (err.issues[0]?.message ?? "Invalid request body")
              : "Invalid request body",
        },
        { status: 400 },
      );
    }

    // Dedupe + drop empty values + reject self-references in any form
    // (raw uid OR the Sanity draft prefix).
    const sanitized = Array.from(
      new Set(userIds.map((u) => u.trim()).filter(Boolean)),
    );
    if (
      sanitized.includes(user.uid) ||
      sanitized.includes(`drafts.user-${user.uid}`)
    ) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 },
      );
    }

    // Delete users from both Firebase and Sanity
    const deleteResults = [];
    for (const userIdToDelete of sanitized) {
      try {
        let deletedFromFirebase = false;
        let deletedFromSanity = false;
        let errors = [];

        // Delete from Firebase
        try {
          await adminAuth.deleteUser(userIdToDelete);
          deletedFromFirebase = true;
        } catch (firebaseError) {
          console.error(
            `Failed to delete user ${userIdToDelete} from Firebase:`,
            firebaseError,
          );
          errors.push(
            `Firebase: ${
              firebaseError instanceof Error
                ? firebaseError.message
                : "Unknown error"
            }`,
          );
        }

        // Delete from Sanity (cascade delete all related data)
        try {
          const sanityUser = await writeClient.fetch(
            `*[_type == "user" && firebaseUid == $firebaseUid][0]._id`,
            { firebaseUid: userIdToDelete },
          );

          if (sanityUser) {
            // Get all related document IDs before deletion
            const relatedData = await writeClient.fetch(
              `{
                "userId": *[_type == "user" && firebaseUid == $firebaseUid][0]._id,
                "addresses": *[_type == "address" && user._ref == *[_type == "user" && firebaseUid == $firebaseUid][0]._id]._id,
                "orders": *[_type == "order" && firebaseUid == $firebaseUid]._id,
                "reviews": *[_type == "review" && user._ref == *[_type == "user" && firebaseUid == $firebaseUid][0]._id]._id,
                "notifications": *[_type == "sentNotification" && user._ref == *[_type == "user" && firebaseUid == $firebaseUid][0]._id]._id
              }`,
              { firebaseUid: userIdToDelete },
            );

            // Build transaction to delete all related documents
            let transaction = writeClient.transaction();

            // Delete user addresses
            if (relatedData.addresses?.length > 0) {
              relatedData.addresses.forEach((addressId: string) => {
                transaction = transaction.delete(addressId);
              });
            }

            // Delete user orders
            if (relatedData.orders?.length > 0) {
              relatedData.orders.forEach((orderId: string) => {
                transaction = transaction.delete(orderId);
              });
            }

            // Delete user reviews
            if (relatedData.reviews?.length > 0) {
              relatedData.reviews.forEach((reviewId: string) => {
                transaction = transaction.delete(reviewId);
              });
            }

            // Delete user notifications
            if (relatedData.notifications?.length > 0) {
              relatedData.notifications.forEach((notificationId: string) => {
                transaction = transaction.delete(notificationId);
              });
            }

            // Delete the user document itself (cart, wishlist, wallet data will be deleted with it)
            transaction = transaction.delete(sanityUser);

            // Commit the transaction
            await transaction.commit();
            deletedFromSanity = true;

            console.log(`Deleted user ${userIdToDelete} and related data:`, {
              addresses: relatedData.addresses?.length || 0,
              orders: relatedData.orders?.length || 0,
              reviews: relatedData.reviews?.length || 0,
              notifications: relatedData.notifications?.length || 0,
            });
          } else {
            deletedFromSanity = true; // User doesn't exist in Sanity, consider it "deleted"
          }
        } catch (sanityError) {
          console.error(
            `Failed to delete user ${userIdToDelete} from Sanity:`,
            sanityError,
          );
          errors.push(
            `Sanity: ${
              sanityError instanceof Error
                ? sanityError.message
                : "Unknown error"
            }`,
          );
        }

        deleteResults.push({
          userId: userIdToDelete,
          success: deletedFromFirebase || deletedFromSanity,
          deletedFromFirebase,
          deletedFromSanity,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error) {
        console.error(`Failed to delete user ${userIdToDelete}:`, error);
        deleteResults.push({
          userId: userIdToDelete,
          success: false,
          deletedFromFirebase: false,
          deletedFromSanity: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = deleteResults.filter((r) => r.success).length;
    const failureCount = deleteResults.filter((r) => !r.success).length;
    const firebaseDeleteCount = deleteResults.filter(
      (r) => r.deletedFromFirebase,
    ).length;
    const sanityDeleteCount = deleteResults.filter(
      (r) => r.deletedFromSanity,
    ).length;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${successCount} user(s) from the system${
        failureCount > 0 ? `, failed to delete ${failureCount}` : ""
      }. Removed from authentication (${firebaseDeleteCount}) and database (${sanityDeleteCount}).`,
      results: deleteResults,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
