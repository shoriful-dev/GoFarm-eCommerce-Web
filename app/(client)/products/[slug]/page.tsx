import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByVariant, getVariantBySlug } from "@/sanity/queries";
import ProductVariantClient from "@/components/productsVariant";
import Container from "@/components/Container";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const variant = await getVariantBySlug(slug);

  if (!variant) {
    return {
      title: "Variant Not Found",
    };
  }

  return {
    title: variant.seoTitle || `${variant.title} - GoFarm`,
    description:
      variant.seoDescription ||
      variant.description ||
      `Browse our ${variant.title} collection at GoFarm`,
    openGraph: {
      title: variant.seoTitle || `${variant.title} - GoFarm`,
      description:
        variant.seoDescription ||
        variant.description ||
        `Browse our ${variant.title} collection at GoFarm`,
      images: [],
    },
  };
}

const ProductsVariantPage = async ({ params }: Props) => {
  const { slug } = await params;
  const [variant, products] = await Promise.all([
    getVariantBySlug(slug),
    getProductsByVariant(slug),
  ]);

  if (!variant) {
    notFound();
  }

  return (
    <div className="bg-gofarm-light-gray/50 min-h-screen">
      <Container className="py-6">
        {/* Breadcrumb */}
        <DynamicBreadcrumb />

        {/* Variant Header Section */}
        <div className="bg-linear-to-r from-gofarm-green to-gofarm-light-green rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {variant.title}
            </h1>
            {variant.description && (
              <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed">
                {variant.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span className="font-semibold">
                  {variant.productCount || 0} Product
                  {variant.productCount !== 1 ? "s" : ""} Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid Component */}
        <ProductVariantClient
          products={products}
          variantTitle={variant.title ?? ""}
        />
      </Container>
    </div>
  );
};

export default ProductsVariantPage;
