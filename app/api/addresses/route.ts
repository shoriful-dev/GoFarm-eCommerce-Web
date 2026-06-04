import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId, getCurrentUser } from "@/lib/firebase-admin-auth";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const user = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, address, city, state, zip, isDefault } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset all other default addresses for this email
    if (isDefault) {
      const existingAddresses = await backendClient.fetch(
        `*[_type == "address" && email == $email]`,
        { email: userEmail }
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
      email: userEmail,
      address,
      city,
      state: state.toUpperCase(),
      zip,
      default: isDefault || false,
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
      { status: 500 }
    );
  }
}
