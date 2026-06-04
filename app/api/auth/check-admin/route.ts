import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { isBootstrapAdminEmail, roleFromUserDoc } from "@/lib/auth/roles";

/**
 * Legacy admin probe used by the `useIsAdmin` client hook.
 * Now consults the Sanity `role` field (canonical) plus ADMIN_EMAILS bootstrap.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, firebaseUid } = await req.json();

    if (!email && !firebaseUid) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    if (email && isBootstrapAdminEmail(email)) {
      return NextResponse.json({ isAdmin: true }, { status: 200 });
    }

    if (firebaseUid) {
      const sanityUser = await client.fetch<{
        role?: string;
        isAdmin?: boolean;
        isEmployee?: boolean;
        isVendor?: boolean;
      } | null>(
        `*[_type == "user" && firebaseUid == $firebaseUid][0]{ role, isAdmin, isEmployee, isVendor }`,
        { firebaseUid },
      );
      if (roleFromUserDoc(sanityUser) === "admin") {
        return NextResponse.json({ isAdmin: true }, { status: 200 });
      }
    }

    if (email && !firebaseUid) {
      const sanityUser = await client.fetch<{
        role?: string;
        isAdmin?: boolean;
        isEmployee?: boolean;
        isVendor?: boolean;
      } | null>(
        `*[_type == "user" && email == $email][0]{ role, isAdmin, isEmployee, isVendor }`,
        { email },
      );
      if (roleFromUserDoc(sanityUser) === "admin") {
        return NextResponse.json({ isAdmin: true }, { status: 200 });
      }
    }

    return NextResponse.json({ isAdmin: false }, { status: 200 });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    if (isBootstrapAdminEmail(email)) {
      return NextResponse.json({ isAdmin: true }, { status: 200 });
    }

    const sanityUser = await client.fetch<{
      role?: string;
      isAdmin?: boolean;
      isEmployee?: boolean;
      isVendor?: boolean;
    } | null>(
      `*[_type == "user" && email == $email][0]{ role, isAdmin, isEmployee, isVendor }`,
      { email },
    );

    return NextResponse.json(
      { isAdmin: roleFromUserDoc(sanityUser) === "admin" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
