import { Store } from "lucide-react";
import type { Metadata } from "next";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Local Stores — Premium feature",
  description:
    "The Local Stores locator is part of the GoFarm premium build. Get the production code to enable it on your deployment.",
  robots: { index: false, follow: false },
};

export default function StoreListPage() {
  return (
    <PremiumFeature
      featureName="Local Stores"
      Icon={Store}
      description="The full Local Stores locator — interactive map, store filters, hours, contact info, and amenities — ships with the GoFarm premium build."
      bullets={[
        "Interactive Google Maps with custom markers and clustering",
        "Search and filter stores by city, amenities, and services",
        "Live store hours, contact details, and directions",
        "Sanity-managed store data with admin tooling",
      ]}
    />
  );
}
