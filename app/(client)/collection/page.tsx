import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Collection — Premium feature",
  description:
    "The full Collection storefront is part of the GoFarm premium build. Get the production code to enable it on your deployment.",
  robots: { index: false, follow: false },
};

export default function CollectionPage() {
  return (
    <PremiumFeature
      featureName="Collection"
      Icon={LayoutGrid}
      description="The full Collection experience — multi-view product grids, advanced filtering, sorting, search, and curated category lanes — ships with the GoFarm premium build."
      bullets={[
        "Switchable 3 / 4 / 5-column and list views with smooth transitions",
        "Filter by featured, new, on-sale, and hot products",
        "Search, sort by name / price / rating, and paginated results",
        "Sanity-managed curation with cached, SEO-friendly fetches",
      ]}
    />
  );
}
