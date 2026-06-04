import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export const revalidate = 600;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const products = await client.fetch(
      `*[_type == "product" && status != "out-of-stock"
          && count((categories[]->slug.current)[@ == $slug]) > 0]
        | order(_createdAt desc)[0...8]{
          _id,
          name,
          "slug": slug.current,
          price,
          "image": images[0]
        }`,
      { slug },
    );

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
