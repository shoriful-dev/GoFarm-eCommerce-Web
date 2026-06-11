import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl text-center space-y-6 py-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gofarm-light-green/20 text-gofarm-green mx-auto">
          <TrendingUp className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gofarm-black">
          Analytics Dashboard
        </h1>
        <p className="text-gofarm-gray text-lg">
          Coming soon! View revenue trends, top products, and customer insights.
        </p>
      </div>
    </div>
  );
}
