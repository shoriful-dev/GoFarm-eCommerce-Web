import Container from "@/components/Container";
import Title from "@/components/Title";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCategories } from "@/sanity/queries";
import { Category, Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Tag,
  Grid3X3,
  Filter,
  TrendingUp,
} from "lucide-react";
import React from "react";
import CategoryProducts from "@/components/product/CategoryProducts";
import { client } from "@/sanity/lib/client";
import { Metadata } from "next";
import {
  generateCategoryMetadata,
  generateBreadcrumbSchema,
  generateItemListSchema,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = (await getCategories()) as unknown as Category[];

  // Fetch products for the current category to get count
  const query = `
    *[_type == "product" && references(*[_type == "category" && slug.current == $slug]._id)] {
      _id
    }
  `;
  const products = await client.fetch(query, { slug });

  // Find the current category
  const currentCategory = categories.find(
    (cat: Category) => cat.slug?.current === slug,
  );

  if (!currentCategory) {
    return {
      title: "Category Not Found",
      description: "The category you're looking for could not be found.",
    };
  }

  return generateCategoryMetadata(currentCategory, products.length);
}

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const categories = (await getCategories()) as unknown as Category[];

  // Fetch products for the current category
  const query = `
    *[_type == "product" && references(*[_type == "category" && slug.current == $slug]._id)] {
      ...,
      brand->{
        _id,
        name
      }
    }
  `;
  const products: Product[] = await client.fetch(query, { slug });

  // Find the current category to get its proper title
  const currentCategory = categories.find(
    (cat: Category) => cat.slug?.current === slug,
  );
  const categoryTitle = currentCategory?.title || slug;

  // Get related categories (exclude current category)
  const relatedCategories = categories
    .filter((cat) => cat.slug?.current !== slug)
    .slice(0, 6);

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
    { name: categoryTitle, url: `/category/${slug}` },
  ]);

  const itemListSchema = generateItemListSchema(
    products,
    `${categoryTitle} Products`,
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gofarm-light-orange">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      <Container className="py-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/category">Categories</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{categoryTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Category Header Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 lg:p-8 shadow-md border border-gray-100/50 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side - Category Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                {/* Category Image */}
                {currentCategory?.image && (
                  <div className="shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-linear-to-br from-gofarm-light-orange to-gray-50 rounded-xl overflow-hidden">
                    <Image
                      src={urlFor(currentCategory.image).url()}
                      alt={categoryTitle}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <Title className="text-2xl lg:text-3xl font-bold text-gofarm-green mb-2">
                    {categoryTitle}
                  </Title>

                  {/* Category Stats */}
                  <div className="flex items-center gap-4 text-sm text-dark-text mb-3">
                    {/* Category stats can be added here if needed */}
                  </div>

                  {/* Category Description */}
                  {currentCategory?.description && (
                    <p className="text-dark-text text-sm lg:text-base line-clamp-2">
                      {currentCategory.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/category"
                  className="inline-flex items-center gap-2 text-gofarm-green hover:text-gofarm-light-green transition-colors duration-300 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Categories
                </Link>

                <div className="h-4 w-px bg-gray-300" />

                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-gofarm-light-green hover:bg-gofarm-green text-white px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Package className="w-4 h-4" />
                  View All Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Side - Quick Actions */}
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-dark-text bg-white/60 px-3 py-1.5 rounded-full">
                  <Grid3X3 className="w-3 h-3" />
                  <span>Category View</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-dark-text bg-white/60 px-3 py-1.5 rounded-full">
                  <Filter className="w-3 h-3" />
                  <span>Filtered Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <CategoryProducts
          categories={categories}
          slug={slug}
          initialProducts={products}
        />

        {/* Related Categories Section */}
        {relatedCategories.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl lg:text-2xl font-bold text-gofarm-green">
                Explore Other Categories
              </h3>
              <Link
                href="/category"
                className="text-gofarm-light-green hover:text-gofarm-green font-medium text-sm flex items-center gap-1 transition-colors duration-300"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug?.current}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gofarm-light-green p-4 text-center"
                >
                  {/* Category Image */}
                  <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gofarm-light-orange to-gray-50 rounded-lg flex items-center justify-center">
                    {category.image ? (
                      <Image
                        src={urlFor(category.image).url()}
                        alt={category.title || "Category"}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gofarm-light-green opacity-60" />
                    )}
                  </div>

                  {/* Category Title */}
                  <h4 className="text-sm font-medium text-gofarm-green group-hover:text-gofarm-light-green transition-colors duration-300 line-clamp-1">
                    {category.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-12 bg-linear-to-r from-gofarm-light-green/10 via-gofarm-orange/5 to-gofarm-light-green/10 rounded-xl p-6 lg:p-8 border border-gofarm-light-green/20 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl lg:text-2xl font-bold text-gofarm-green mb-3">
              Discover More Amazing Products
            </h3>
            <p className="text-dark-text mb-6 text-sm lg:text-base">
              Can&apos;t find what you&apos;re looking for in {categoryTitle}?
              Explore our complete collection of products across all categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 bg-gofarm-green hover:bg-gofarm-light-green text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Package className="w-5 h-5" />
                Browse All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/category"
                className="inline-flex items-center justify-center gap-2 border-2 border-gofarm-light-green text-gofarm-light-green hover:bg-gofarm-light-green hover:text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
              >
                <Grid3X3 className="w-5 h-5" />
                All Categories
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CategoryPage;
