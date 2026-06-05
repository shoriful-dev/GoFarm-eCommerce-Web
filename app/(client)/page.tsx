import NewsletterSection from "../../components/NewsletterSection";
import HomeBanner from "../../components/HomeBanner";
import ProductGrid from "../../components/ProductGrid";
import ScrollToTop from "../../components/ScrollToTop";
import { getCategories, getAllProducts } from "../../sanity/queries";
import { generateOrganizationSchema, generateWebsiteSchema } from "../../lib/seo";
import nextDynamic from "next/dynamic";
import type { Metadata } from "next";
import type { Category } from "../../sanity.types";

// Below-the-fold sections are lazy-loaded so the initial JS bundle for the
// home route stays minimal. Each gets a lightweight placeholder so layout
// doesn't shift while the chunk streams in.
const SectionPlaceholder = ({ height = "h-72" }: { height?: string }) => (
  <div
    className={`mt-12 ${height} bg-gofarm-light-gray/20 rounded-2xl mx-4 lg:mx-8 animate-pulse`}
  />
);

const AvailableCoupons = nextDynamic(
  () => import("../../components/AvailableCoupons"),
  { loading: () => <SectionPlaceholder height="h-48" /> },
);
const HomeCategories = nextDynamic(
  () => import("../../components/HomeCategories"),
  { loading: () => <SectionPlaceholder height="h-96" /> },
);
const ShopFeatures = nextDynamic(() => import("../../components/ShopFeatures"), {
  loading: () => <SectionPlaceholder height="h-40" />,
});
const ShopByBrands = nextDynamic(() => import("../../components/ShopByBrands"), {
  loading: () => <SectionPlaceholder height="h-48" />,
});
const LatestBlog = nextDynamic(() => import("../../components/LatestBlog"), {
  loading: () => <SectionPlaceholder height="h-96" />,
});

export const dynamic = "force-dynamic";

/**
 * Per-page metadata. The root layout already supplies a sensible
 * default, but the home page benefits from a tailored title +
 * Open Graph card so social previews don't fall back to the generic
 * site name.
 */
export const metadata: Metadata = {
  title: "GoFarm — Fresh produce, dairy & pantry essentials delivered",
  description:
    "Shop farm-fresh fruits, vegetables, dairy, and pantry staples from trusted local vendors. Fast delivery, transparent pricing, and member rewards.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "GoFarm — Fresh produce delivered",
    description:
      "Farm-fresh groceries from local vendors. Same-day delivery on eligible orders.",
    siteName: "GoFarm",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoFarm — Fresh produce delivered",
    description:
      "Farm-fresh groceries from local vendors. Same-day delivery on eligible orders.",
  },
};

export default async function Home() {
  const [categoriesRaw, allProducts] = await Promise.all([
    getCategories(8),
    getAllProducts(),
  ]);
  // `getCategories()` is wrapped in `unstable_cache` + `sanityFetch`,
  // which loses the GROQ result type. The shape returned matches
  // `Category[]` (plus a synthetic `productCount` we don't read here).
  const categories = categoriesRaw as unknown as Category[];
  const totalProductCount = allProducts?.length || 0;

  // Generate structured data
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <div>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <HomeBanner />
      <div>
        <ProductGrid />
        <AvailableCoupons />
        {categories.length > 0 && (
          <HomeCategories
            categories={categories}
            totalProducts={totalProductCount}
          />
        )}
        <ShopFeatures />
        <ShopByBrands />
        <LatestBlog />
        <NewsletterSection />
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
