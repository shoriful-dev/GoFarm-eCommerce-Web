import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/firebase-admin-auth";
import { client } from "@/sanity/lib/client";

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "_createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // If requesting a specific product by ID, return full details
    if (productId) {
      const productQuery = `
        *[_type == "product" && _id == "${productId}"][0] {
          _id,
          _type,
          _createdAt,
          _updatedAt,
          _rev,
          name,
          slug,
          description,
          price,
          discount,
          stock,
          images[]{
            ...,
            asset->{
              _id,
              url
            }
          },
          categories[]->{
            _id,
            title,
            slug
          },
          brand->{
            _id,
            title,
            slug
          },
          status,
          variant,
          isFeatured
        }
      `;

      const product = await client.fetch(productQuery);

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Transform the data to match our interface
      const transformedProduct = {
        ...product,
        category: product.categories?.[0]
          ? {
              _id: product.categories[0]._id,
              name: product.categories[0].title,
              title: product.categories[0].title,
              slug: product.categories[0].slug,
            }
          : null,
        brand: product.brand
          ? {
              _id: product.brand._id,
              name: product.brand.title,
              title: product.brand.title,
              slug: product.brand.slug,
            }
          : null,
        featured: product.isFeatured,
      };

      return NextResponse.json({ product: transformedProduct });
    }

    // Build filter conditions
    const filterConditions = [];
    if (category) {
      // Use references to filter by category
      filterConditions.push(
        `references(*[_type == "category" && title == "${category}"]._id)`
      );
    }
    if (search) {
      filterConditions.push(
        `(name match "${search}*" || description match "${search}*")`
      );
    } // Build GROQ query
    const query = `
      *[_type == "product"${
        filterConditions.length > 0
          ? ` && (${filterConditions.join(" && ")})`
          : ""
      }] | order(${sortBy} ${sortOrder}) [${offset}...${offset + limit}] {
        _id,
        _createdAt,
        name,
        description,
        price,
        stock,
        images[]{
          asset->{
            _id,
            url
          },
          alt
        },
        "category": categories[0]->{
          _id,
          "name": title,
          "title": title
        },
        "categories": categories[]->{
          _id,
          "name": title,
          "title": title
        },
        brand-> {
          _id,
          "name": title
        },
        "featured": isFeatured,
        status
      }
    `;

    // Get count query
    const countQuery = `
      count(*[_type == "product"${
        filterConditions.length > 0
          ? ` && (${filterConditions.join(" && ")})`
          : ""
      }])
    `;

    // Execute queries
    const [products, totalCount] = await Promise.all([
      client.fetch(query),
      client.fetch(countQuery),
    ]);

    return NextResponse.json({
      products,
      totalCount,
      hasNextPage: offset + limit < totalCount,
      pagination: {
        limit,
        offset,
        total: totalCount,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
