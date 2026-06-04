import { Flame } from "lucide-react";
import type { Metadata } from "next";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Hot Deals — Premium feature",
  description:
    "The Hot Deals storefront is part of the GoFarm premium build. Get the production code to enable it on your deployment.",
  robots: { index: false, follow: false },
};

export default function DealPage() {
  return (
    <PremiumFeature
      featureName="Hot Deals"
      Icon={Flame}
      description="The full Hot Deals experience — countdown banners, curated discount feeds, and the deal-aware product grid — ships with the GoFarm premium build."
      bullets={[
        "Live deal countdown with timezone-aware expiry",
        "Curated deal feed with category & discount filters",
        "Discount-tier badges on product cards across the site",
        "Sanity-managed deal scheduling and analytics hooks",
      ]}
    />
  );
}
