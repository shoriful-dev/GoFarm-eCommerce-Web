"use client";

import { Product, PRODUCT_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Shield, Award } from "lucide-react";

interface ProductSpecsProps {
  product: Product | PRODUCT_BY_SLUG_QUERY_RESULT;
}

const ProductSpecs = ({ product }: ProductSpecsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {/* Product Features */}
      <Card className="border-2 border-gray-100 hover:border-gofarm-light-green/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gofarm-orange" />
            <CardTitle className="text-sm font-semibold">
              Product Info
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stock:</span>
            <Badge
              variant={product?.stock === 0 ? "destructive" : "default"}
              className={
                product?.stock === 0
                  ? ""
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }
            >
              {product?.stock === 0
                ? "Out of Stock"
                : `${product?.stock} Available`}
            </Badge>
          </div>
          {product?.brand && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium">Brand</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SKU:</span>
            <span className="font-medium text-xs text-gray-500">
              #{product?.slug?.current?.slice(-8).toUpperCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info */}
      <Card className="border-2 border-gray-100 hover:border-gofarm-light-green/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gofarm-orange" />
            <CardTitle className="text-sm font-semibold">Shipping</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✓ Free Shipping</span>
          </div>
          <div className="text-gray-600">Estimated: 2-5 business days</div>
          <div className="text-gray-600">Express: 1-2 business days</div>
        </CardContent>
      </Card>

      {/* Warranty */}
      <Card className="border-2 border-gray-100 hover:border-gofarm-light-green/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gofarm-orange" />
            <CardTitle className="text-sm font-semibold">Warranty</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="text-gray-600">
            <span className="font-medium text-gofarm-green">1 Year</span>{" "}
            Manufacturer Warranty
          </div>
          <div className="text-gray-600">
            <span className="font-medium text-gofarm-green">30 Days</span>{" "}
            Return Policy
          </div>
          <div className="text-gray-600">Free Tech Support</div>
        </CardContent>
      </Card>

      {/* Quality Assurance */}
      <Card className="border-2 border-gray-100 hover:border-gofarm-light-green/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gofarm-orange" />
            <CardTitle className="text-sm font-semibold">Quality</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✓ Quality Tested</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">
              ✓ Authentic Product
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">
              ✓ Secure Packaging
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSpecs;
