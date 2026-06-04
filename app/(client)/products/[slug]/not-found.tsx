import Container from "@/components/Container";
import Link from "next/link";
import { PackageX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-gofarm-light-gray min-h-screen flex items-center justify-center py-12">
      <Container>
        <div className="bg-gofarm-white rounded-2xl shadow-xl p-8 lg:p-12 max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="bg-gofarm-light-orange/30 rounded-full p-8">
              <PackageX className="w-20 h-20 text-gofarm-orange" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gofarm-black mb-4">
            Product Variant Not Found
          </h1>

          {/* Description */}
          <p className="text-lg text-gofarm-gray mb-8 max-w-md mx-auto">
            We couldn't find the product variant you're looking for. It may have
            been removed or the link might be incorrect.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="bg-gofarm-green hover:bg-gofarm-light-green text-white font-semibold px-6 py-6 text-base"
            >
              <Link href="/shop" className="flex items-center gap-2">
                <ArrowLeft size={20} />
                Browse All Products
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-2 border-gofarm-green text-gofarm-green hover:bg-gofarm-light-orange font-semibold px-6 py-6 text-base"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home size={20} />
                Go to Homepage
              </Link>
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-gofarm-light-gray">
            <p className="text-sm text-gofarm-gray mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="text-sm text-gofarm-green hover:text-gofarm-light-green font-medium hover:underline"
              >
                Shop All
              </Link>
              <span className="text-gofarm-light-gray">•</span>
              <Link
                href="/category"
                className="text-sm text-gofarm-green hover:text-gofarm-light-green font-medium hover:underline"
              >
                Categories
              </Link>
              <span className="text-gofarm-light-gray">•</span>
              <Link
                href="/brands"
                className="text-sm text-gofarm-green hover:text-gofarm-light-green font-medium hover:underline"
              >
                Brands
              </Link>
              <span className="text-gofarm-light-gray">•</span>
              <Link
                href="/deal"
                className="text-sm text-gofarm-green hover:text-gofarm-light-green font-medium hover:underline"
              >
                Hot Deals
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
