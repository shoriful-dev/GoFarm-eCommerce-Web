import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get addresses from Sanity for this user
    const query = `*[_type == "address" && email == $email] | order(default desc, createdAt desc) {
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
    }`;

    const addresses = await client.fetch(query, { email: userEmail });

    return NextResponse.json({
      addresses,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      address,
      city,
      state,
      zip,
      country,
      default: isDefault,
      type,
    } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Name, address, city, state, and zip are required" },
        { status: 400 }
      );
    }

    // If this is being set as default, unset all other default addresses
    if (isDefault) {
      await client
        .patch({
          query: `*[_type == "address" && email == "${userEmail}" && default == true]`,
        })
        .set({ default: false })
        .commit();
    }

    // Create new address
    const newAddress = await client.create({
      _type: "address",
      name,
      email: userEmail,
      phone: phone || "",
      address,
      city,
      state: state.toUpperCase(),
      zip,
      country: country || "United States",
      default: isDefault || false,
      type: type || "home",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      address: newAddress,
      success: true,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      _id,
      name,
      phone,
      address,
      city,
      state,
      zip,
      country,
      default: isDefault,
      type,
    } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Name, address, city, state, and zip are required" },
        { status: 400 }
      );
    }

    // Verify the address belongs to the current user
    const existingAddress = await client.fetch(
      `*[_type == "address" && _id == $id && email == $email][0]`,
      { id: _id, email: userEmail }
    );

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found or access denied" },
        { status: 404 }
      );
    }

    // If this is being set as default, unset all other default addresses
    if (isDefault) {
      await client
        .patch({
          query: `*[_type == "address" && email == "${userEmail}" && default == true && _id != "${_id}"]`,
        })
        .set({ default: false })
        .commit();
    }

    // Update the address
    const updatedAddress = await client
      .patch(_id)
      .set({
        name,
        phone: phone || "",
        address,
        city,
        state: state.toUpperCase(),
        zip,
        country: country || "United States",
        default: isDefault || false,
        type: type || "home",
      })
      .commit();

    return NextResponse.json({
      address: updatedAddress,
      success: true,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Verify the address belongs to the current user
    const existingAddress = await client.fetch(
      `*[_type == "address" && _id == $id && email == $email][0]`,
      { id: addressId, email: userEmail }
    );

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the address
    await client.delete(addressId);

    // If this was the default address, set another address as default
    if (existingAddress.default) {
      const remainingAddresses = await client.fetch(
        `*[_type == "address" && email == $email] | order(createdAt desc)[0]`,
        { email: userEmail }
      );

      if (remainingAddresses) {
        await client
          .patch(remainingAddresses._id)
          .set({ default: true })
          .commit();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
