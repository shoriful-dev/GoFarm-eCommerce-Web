import type { Metadata } from "next";
import { Store } from "lucide-react";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Vendor Dashboard",
  robots: { index: false, follow: false },
};

export default function VendorPremiumPage() {
  return (
    <PremiumFeature
      featureName="Vendor Dashboard"
      Icon={Store}
      title="The vendor experience is a premium feature"
      description="The full vendor onboarding, dashboard, and storefront management — including product, order, analytics, and settings flows — is part of the premium GoFarm code package."
      bullets={[
        "Vendor application & approval workflow",
        "Product, order, and analytics dashboards",
        "Vendor-specific APIs and admin moderation tools",
      ]}
    />
  );
}
