import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase-admin-auth";
import { backendClient } from "@/sanity/lib/backendClient";
import { writeClient } from "@/sanity/lib/client";
import { syncUserToSanity } from "@/lib/sync-user-to-sanity";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    // Check if user exists in Sanity
    const userEmail = user.email;
    const userId = user.uid;

    // Try to find user by firebaseUid first, fallback to email
    const sanityUser = await backendClient.fetch(
      `*[_type == "user" && (firebaseUid == $userId || email == $email)][0]{
        _id,
        firebaseUid,
        email,
        firstName,
        lastName,
        role,
        isAdmin,
        isActive,
        isBusiness,
        isVendor,
        vendorStatus,
        vendorAppliedAt,
        vendorApprovedAt,
        vendorRejectedAt,
        vendorRejectionReason,
        premiumStatus,
        businessStatus,
        membershipType,
        premiumAppliedAt,
        premiumApprovedBy,
        premiumApprovedAt,
        businessAppliedAt,
        businessApprovedBy,
        businessApprovedAt,
        rejectionReason,
        isEmployee,
        employeeRole,
        employeeStatus
      }`,
      { userId, email: userEmail },
    );

    return NextResponse.json({
      success: true,
      userExists: !!sanityUser,
      userProfile: sanityUser || null,
    });
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { error: "Failed to check user status" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

    // The Sanity user is guaranteed to exist (created by /api/auth/session
    // on login). If for any reason it isn't there, ensure it before
    // applying for premium — never create with an ad-hoc shape here.
    await syncUserToSanity({
      uid: user.uid,
      email: userEmail,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    // Look up the canonical user document.
    const existingSanityUser = await backendClient.fetch(
      `*[_type == "user" && firebaseUid == $uid][0]`,
      { uid: user.uid },
    );

    if (existingSanityUser) {
      // Check current premium status
      if (existingSanityUser.premiumStatus === "rejected") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Premium application was rejected. Please contact admin for assistance.",
          },
          { status: 400 },
        );
      }

      if (existingSanityUser.premiumStatus === "pending") {
        return NextResponse.json(
          {
            success: false,
            error: "Premium application is already pending approval.",
          },
          { status: 400 },
        );
      }

      if (
        existingSanityUser.isActive &&
        existingSanityUser.premiumStatus === "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "User already has premium account.",
          },
          { status: 400 },
        );
      }

      // Update existing user to pending status
      const updatedUser = await writeClient
        .patch(existingSanityUser._id)
        .set({
          premiumStatus: "pending",
          premiumAppliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .commit();

      // Analytics tracking removed — see /api/analytics/track for context.

      return NextResponse.json({
        success: true,
        message:
          "🎉 Premium application submitted successfully! Your application is now under review and you'll be notified within 24-48 hours once it's processed.",
        userProfile: updatedUser,
      });
    }

    // syncUserToSanity above guarantees the user exists, so this branch
    // should be unreachable. Return 500 if it is — something is very wrong.
    return NextResponse.json(
      { error: "User profile could not be created" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error creating user in Sanity:", error);
    return NextResponse.json(
      { error: "Failed to register for premium services" },
      { status: 500 },
    );
  }
}
