import type { Metadata } from "next";
import { Flame } from "lucide-react";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Hot Deals",
  description:
    "Browse our hottest deals on farm-fresh produce, dairy, and pantry essentials.",
};

export default function DealPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gofarm-light-orange text-gofarm-orange mx-auto">
          <Flame className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gofarm-black">
          Hot Deals
        </h1>
        <p className="text-gofarm-gray text-lg">
          Coming soon! Stay tuned for our hottest deals and discounts.
        </p>
      </div>
    </Container>
  );
}
