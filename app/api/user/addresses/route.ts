import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, getCurrentUser } from "@/lib/firebase-admin-auth";
import { backendClient } from "@/sanity/lib/backendClient";
import { syncUserToSanity } from "@/lib/sync-user-to-sanity";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
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

    // Fetch addresses for this user by email
    const addresses = await backendClient.fetch(
      `*[_type == "address" && email == $email] | order(default desc, createdAt desc) {
        _id,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        country,
        default,
        type,
        createdAt
      }`,
      { email: userEmail },
    );

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zip,
      country,
      countryCode,
      stateCode,
      subArea,
      default: isDefault,
      type,
      phone,
    } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // First, ensure the user exists in Sanity. The session route already
    // does this on login, but we re-affirm here so any out-of-band call
    // path still produces a canonical user document (with role, etc.).
    await syncUserToSanity({
      uid: userId,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    let sanityUser = await backendClient.fetch(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]`,
      { firebaseUid: userId },
    );

    if (!sanityUser) {
      // Should never happen — syncUserToSanity above guarantees presence.
      return NextResponse.json(
        { error: "User profile could not be created" },
        { status: 500 },
      );
    }

    // If this is set as default, unset all other default addresses for this user
    if (isDefault) {
      const userEmail = user.email;
      const existingAddresses = await backendClient.fetch(
        `*[_type == "address" && email == $email && default == true]`,
        { email: userEmail },
      );

      for (const existingAddress of existingAddresses) {
        await backendClient
          .patch(existingAddress._id)
          .set({ default: false })
          .commit();
      }
    }

    // Create new address
    const newAddress = await backendClient.create({
      _type: "address",
      name,
      email: user.email,
      address,
      city,
      state,
      zip,
      country: country || "",
      countryCode: countryCode || "",
      stateCode: stateCode || "",
      subArea: subArea || "",
      default: isDefault || false,
      type: type || "home",
      phone: phone || null,
      user: {
        _type: "reference",
        _ref: sanityUser._id,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      addressId: newAddress._id,
      message: "Address created successfully",
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const {
      _id,
      name,
      address,
      city,
      state,
      zip,
      country,
      countryCode,
      stateCode,
      subArea,
      default: isDefault,
      type,
      phone,
    } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Address ID is required for update" },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

    // If this is set as default, unset all other default addresses for this user
    if (isDefault) {
      const existingAddresses = await backendClient.fetch(
        `*[_type == "address" && email == $email && _id != $currentId]`,
        { email: userEmail, currentId: _id },
      );

      for (const existingAddress of existingAddresses) {
        await backendClient
          .patch(existingAddress._id)
          .set({ default: false })
          .commit();
      }
    }

    // Update the address
    const updatedAddress = await backendClient
      .patch(_id)
      .set({
        name,
        address,
        city,
        state,
        zip,
        country: country || "",
        countryCode: countryCode || "",
        stateCode: stateCode || "",
        subArea: subArea || "",
        default: isDefault || false,
        type: type || "home",
        phone: phone || null,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 },
      );
    }

    // Delete the address
    await backendClient.delete(addressId);

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
