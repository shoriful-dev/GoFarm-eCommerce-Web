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
import { Category } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, Tag } from "lucide-react";

const CategoryPage = async () => {
  const categories = (await getCategories()) as unknown as Category[];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gofarm-light-orange/30">
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
                <BreadcrumbPage>Categories</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Header */}
        <div className="relative bg-linear-to-r from-gofarm-green via-gofarm-light-green to-gofarm-green rounded-3xl p-8 lg:p-12 mb-10 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

          <div className="relative text-center text-white">
            <div className="inline-flex items-center gap-2 mb-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Package className="w-4 h-4" />
              <span className="text-sm font-semibold">Browse by Category</span>
            </div>
            <Title className="text-3xl lg:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">
              Shop by Categories
            </Title>
            <p className="text-base lg:text-lg text-white/90 max-w-2xl mx-auto mb-6">
              Discover our wide range of products organized by categories. Find
              exactly what you&apos;re looking for with ease.
            </p>

            {/* View All Products Button */}
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-white text-gofarm-green hover:bg-gofarm-light-orange px-8 py-3.5 rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Package className="w-5 h-5" />
              View All Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug?.current}`}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-gofarm-light-green transform hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* linear overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-gofarm-light-green/0 to-gofarm-orange/0 group-hover:from-gofarm-light-green/5 group-hover:to-gofarm-orange/5 transition-all duration-300 z-0"></div>

                  {/* Category Image */}
                  <div className="relative h-32 sm:h-36 lg:h-40 bg-linear-to-br from-gofarm-light-orange/30 to-gofarm-light-green/10 overflow-hidden">
                    {category.image ? (
                      <Image
                        src={urlFor(category.image).url()}
                        alt={category.title || "Category"}
                        fill
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 lg:w-12 lg:h-12 text-gofarm-light-green opacity-60" />
                      </div>
                    )}

                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-full"></div>
                  </div>

                  {/* Category Content */}
                  <div className="relative p-4 lg:p-5 z-10">
                    <h3 className="text-base lg:text-lg font-bold text-gofarm-green group-hover:text-gofarm-light-green transition-colors duration-300 line-clamp-1 mb-2">
                      {category.title}
                    </h3>

                    {category.description && (
                      <p className="text-dark-text text-xs mb-3 line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="ml-auto flex items-center gap-1 text-gofarm-green group-hover:text-gofarm-light-green transition-colors duration-300">
                        <span className="text-xs font-medium">Explore</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-gofarm-light-green to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </Link>
              ))}
            </div>

            {/* View All Products CTA after categories */}
            <div className="mt-10 text-center">
              <div className="bg-linear-to-r from-gofarm-light-green/10 via-gofarm-orange/5 to-gofarm-light-green/10 rounded-xl p-6 border border-gofarm-light-green/20">
                <h3 className="text-lg lg:text-xl font-semibold text-gofarm-green mb-2">
                  Explore Our Complete Product Range
                </h3>
                <p className="text-dark-text text-sm mb-4">
                  Don&apos;t see what you&apos;re looking for? Browse our entire
                  collection of products.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-gofarm-light-green hover:bg-gofarm-green text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Package className="w-4 h-4" />
                  View All Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-md border border-gray-100/50 max-w-md mx-auto">
              <Package className="w-16 h-16 text-gofarm-gray mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gofarm-green mb-3">
                No Categories Available
              </h3>
              <p className="text-dark-text text-sm mb-6">
                It looks like there are no categories set up yet. Check back
                soon for our product categories!
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-gofarm-light-green hover:bg-gofarm-green text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors duration-300"
              >
                <Package className="w-4 h-4" />
                Browse All Products
              </Link>
            </div>
          </div>
        )}

        {/* Additional Info Section */}
        {categories.length > 0 && (
          <div className="mt-12 bg-white/70 backdrop-blur-sm rounded-xl p-6 lg:p-8 shadow-md border border-gray-100/50">
            <div className="text-center">
              <h3 className="text-xl lg:text-2xl font-bold text-gofarm-green mb-3">
                Can&apos;t Find What You&apos;re Looking For?
              </h3>
              <p className="text-dark-text mb-6 text-sm lg:text-base">
                Browse all our products or use our search feature to find
                specific items.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-gofarm-light-green hover:bg-gofarm-green text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors duration-300"
                >
                  <Package className="w-4 h-4" />
                  All Products
                </Link>
                <Link
                  href="/brands"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gofarm-light-green text-gofarm-light-green hover:bg-gofarm-light-green hover:text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors duration-300"
                >
                  <Tag className="w-4 h-4" />
                  Shop by Brands
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default CategoryPage;
