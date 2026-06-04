import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Vendor Requests",
  robots: { index: false, follow: false },
};

export default function VendorRequestsPremiumPage() {
  return (
    <PremiumFeature
      featureName="Vendor Requests"
      Icon={UserCheck}
      title="Vendor request moderation is a premium feature"
      description="The full vendor application moderation flow — including request review, approval, rejection, and audit history — is part of the premium GoFarm code package."
      bullets={[
        "Premium & business account request queues",
        "Approve / reject with notes and email notifications",
        "Status filters, search, and bulk actions",
      ]}
      homeHref="/admin"
    />
  );
}
