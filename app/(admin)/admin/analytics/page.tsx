import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPremiumPage() {
  return (
    <PremiumFeature
      featureName="Analytics Dashboard"
      Icon={TrendingUp}
      title="The analytics dashboard is a premium feature"
      description="The full analytics suite — revenue trends, conversion funnels, top products, and customer cohorts — is part of the premium GoFarm code package."
      bullets={[
        "Revenue, orders, and customer trend charts",
        "Top products and category performance",
        "Date-range filters and CSV export",
      ]}
      homeHref="/admin"
    />
  );
}
