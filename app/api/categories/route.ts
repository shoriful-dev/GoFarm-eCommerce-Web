import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const categories = await client.fetch(
      `*[_type == "category"] | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        image
      }`,
    );

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
