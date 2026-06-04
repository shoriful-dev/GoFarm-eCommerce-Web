import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/firebase-admin-auth";
import { writeClient } from "@/sanity/lib/client";

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin (checks both env var and Sanity isAdmin field)
    const { isAdmin, user } = await checkAdminAccess();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const adminEmail = user.email || "";

    const { firebaseUids } = await req.json(); // Array of Clerk user IDs

    if (
      !firebaseUids ||
      !Array.isArray(firebaseUids) ||
      firebaseUids.length === 0
    ) {
      return NextResponse.json(
        { error: "firebaseUids array is required" },
        { status: 400 }
      );
    }

    const results = [];

    for (const firebaseUid of firebaseUids) {
      try {
        // Get user from Firebase Admin Auth
        const { adminAuth } = await import("@/lib/firebase-admin");
        let firebaseUser;
        try {
          firebaseUser = await adminAuth.getUser(firebaseUid);
        } catch (err) {
          results.push({
            firebaseUid,
            success: false,
            error: "User not found in Firebase",
          });
          continue;
        }

        const userEmail = firebaseUser.email;
        if (!userEmail) {
          results.push({
            firebaseUid,
            success: false,
            error: "User email not found",
          });
          continue;
        }

        // Check if user already exists in Sanity
        const existingUser = await writeClient.fetch(
          `*[_type == "user" && firebaseUid == $firebaseUid][0]`,
          { firebaseUid }
        );

        if (existingUser) {
          // Update existing user to active if not already
          if (!existingUser.isActive) {
            await writeClient
              .patch(existingUser._id)
              .set({
                isActive: true,
                activatedAt: new Date().toISOString(),
                activatedBy: adminEmail,
                updatedAt: new Date().toISOString(),
              })
              .commit();
          }

          results.push({
            firebaseUid,
            success: true,
            action: existingUser.isActive ? "already_active" : "activated",
            sanityId: existingUser._id,
          });
        } else {
          // Create new user in Sanity
          const newUser = await writeClient.create({
            _type: "user",
            firebaseUid,
            email: userEmail,
            firstName: firebaseUser.displayName?.split(" ")[0] || "",
            lastName:
              firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
            profileImageUrl: firebaseUser.photoURL || "",
            isActive: true,
            activatedAt: new Date().toISOString(),
            activatedBy: adminEmail,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            preferences: {
              emailNotifications: true,
              smsNotifications: false,
              newsletter: false,
              preferredCurrency: "USD",
              preferredLanguage: "en",
            },
            loyaltyPoints: 0,
            totalSpent: 0,
            notifications: [],
            wishlist: [],
            cart: [],
            orders: [],
          });

          results.push({
            firebaseUid,
            success: true,
            action: "created",
            sanityId: newUser._id,
          });
        }
      } catch (error) {
        console.error(`Error syncing user ${firebaseUid}:`, error);
        results.push({
          firebaseUid,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${firebaseUids.length} users: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: firebaseUids.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("Error syncing users to Sanity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
