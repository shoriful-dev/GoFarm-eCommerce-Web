import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Vendor Management",
  robots: { index: false, follow: false },
};

export default function VendorManagementPremiumPage() {
  return (
    <PremiumFeature
      featureName="Vendor Management"
      Icon={Briefcase}
      title="Vendor management is a premium feature"
      description="The full admin vendor management suite — vendor directory, vendor product moderation, application review, and vendor settings — is part of the premium GoFarm code package."
      bullets={[
        "Vendor directory with status & performance metrics",
        "Vendor product approval / moderation queue",
        "Vendor application review and platform-wide settings",
      ]}
      homeHref="/admin"
    />
  );
}
