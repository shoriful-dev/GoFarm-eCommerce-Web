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
import { getAllBrands } from "@/sanity/queries";
import { Brand, Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Award,
  Grid3X3,
  Filter,
} from "lucide-react";
import React from "react";
import BrandProducts from "@/components/product/BrandProducts";
import { client } from "@/sanity/lib/client";

type Props = {
  params: Promise<{ slug: string }>;
};

const BrandPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const brands: Brand[] = await getAllBrands();

  // Fetch products for the current brand
  const query = `
    *[_type == "product" && brand->slug.current == $slug] {
      ...,
      brand->{
        _id,
        title
      },
      categories[]->{
        _id,
        title,
        slug
      }
    }
  `;
  const products: Product[] = await client.fetch(query, { slug });

  // Find the current brand to get its proper title
  const currentBrand = brands.find(
    (brand: Brand) => brand.slug?.current === slug
  );
  const brandTitle = currentBrand?.title || slug;

  // Get related brands (exclude current brand)
  const relatedBrands = brands
    .filter((brand) => brand.slug?.current !== slug)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gofarm-light-orange">
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
                  <Link href="/brands">Brands</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{brandTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Brand Header Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 lg:p-8 shadow-md border border-gray-100/50 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side - Brand Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                {/* Brand Image */}
                {currentBrand?.image && (
                  <div className="shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-linear-to-br from-gofarm-light-orange to-gray-50 rounded-xl overflow-hidden">
                    <Image
                      src={urlFor(currentBrand.image).url()}
                      alt={brandTitle}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <Title className="text-2xl lg:text-3xl font-bold text-gofarm-green mb-2">
                    {brandTitle}
                  </Title>

                  {/* Brand Description */}
                  {currentBrand?.description && (
                    <p className="text-dark-text text-sm lg:text-base line-clamp-2">
                      {currentBrand.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/brands"
                  className="inline-flex items-center gap-2 text-gofarm-green hover:text-gofarm-light-green transition-colors duration-300 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Brands
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
                  <span>Brand View</span>
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
        <BrandProducts brands={brands} slug={slug} initialProducts={products} />

        {/* Related Brands Section */}
        {relatedBrands.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl lg:text-2xl font-bold text-gofarm-green">
                Explore Other Brands
              </h3>
              <Link
                href="/brands"
                className="text-gofarm-light-green hover:text-gofarm-green font-medium text-sm flex items-center gap-1 transition-colors duration-300"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedBrands.map((brand) => (
                <Link
                  key={brand._id}
                  href={`/brands/${brand.slug?.current}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gofarm-light-green p-4 text-center"
                >
                  {/* Brand Image */}
                  <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gofarm-light-orange to-gray-50 rounded-lg flex items-center justify-center">
                    {brand.image ? (
                      <Image
                        src={urlFor(brand.image).url()}
                        alt={brand.title || "Brand"}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Award className="w-6 h-6 text-gofarm-light-green opacity-60" />
                    )}
                  </div>

                  {/* Brand Title */}
                  <h4 className="text-sm font-medium text-gofarm-green group-hover:text-gofarm-light-green transition-colors duration-300 line-clamp-1">
                    {brand.title}
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
              Can&apos;t find what you&apos;re looking for from {brandTitle}?
              Explore our complete collection of products across all brands.
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
                href="/brands"
                className="inline-flex items-center justify-center gap-2 border-2 border-gofarm-light-green text-gofarm-light-green hover:bg-gofarm-light-green hover:text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
              >
                <Grid3X3 className="w-5 h-5" />
                All Brands
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default BrandPage;
