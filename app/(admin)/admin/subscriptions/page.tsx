import type { Metadata } from "next";
import { Mail } from "lucide-react";
import PremiumFeature from "@/components/PremiumFeature";

export const metadata: Metadata = {
  title: "Subscriptions",
  robots: { index: false, follow: false },
};

export default function AdminSubscriptionsPremiumPage() {
  return (
    <PremiumFeature
      featureName="Newsletter Subscriptions"
      Icon={Mail}
      title="Subscription management is a premium feature"
      description="The admin newsletter subscription management — including subscriber lists, duplicate cleanup, and unsubscribe handling — is part of the premium GoFarm code package."
      bullets={[
        "Browse and search all newsletter subscribers",
        "Bulk cleanup of duplicate entries",
        "Manual subscribe / unsubscribe controls",
      ]}
      homeHref="/admin"
    />
  );
}
