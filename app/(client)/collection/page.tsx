import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "Browse our curated collection of farm-fresh produce, dairy, and pantry essentials.",
};

export default function CollectionPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gofarm-light-green/20 text-gofarm-green mx-auto">
          <LayoutGrid className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gofarm-black">
          Collection
        </h1>
        <p className="text-gofarm-gray text-lg">
          Coming soon! Browse our curated collections of quality products.
        </p>
      </div>
    </Container>
  );
}
