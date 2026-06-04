"use client";
import AddToCartButton from "@/components/AddToCartButton";
import Container from "@/components/Container";
import FavoriteButton from "@/components/FavoriteButton";
import ImageView from "@/components/common/ImageView";
import PriceView from "@/components/PriceView";
import ProductCharacteristics from "@/components/ProductCharacteristics";
import ProductsDetails from "@/components/ProductsDetails";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import ProductSpecs from "@/components/ProductSpecs";
import ProductReviews from "@/components/ProductReviews";
import ProductOptions from "@/components/ProductOptions";
import { trackProductView } from "@/lib/analytics";

import { Product } from "@/sanity.types";
import {
  CornerDownLeft,
  StarIcon,
  Truck,
  Shield,
  RefreshCw,
} from "lucide-react";
import React, { useEffect } from "react";
import { FaRegQuestionCircle } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { RxBorderSplit } from "react-icons/rx";
import { TbTruckDelivery } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ProductAnimationWrapper,
  ProductImageWrapper,
  ProductDetailsWrapper,
  ProductActionWrapper,
  ProductSectionWrapper,
} from "@/components/ProductClientWrapper";
import RelatedProducts from "./RelatedProducts";
import {
  BRAND_QUERY_RESULT,
  PRODUCT_BY_SLUG_QUERY_RESULT,
} from "@/sanity.types";
import { useCompareStore } from "@/stores/compareStore";
import { useCartAddedModalStore } from "@/stores/cartAddedModalStore";
import { useShareStore } from "@/stores/shareStore";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductContentProps {
  product: PRODUCT_BY_SLUG_QUERY_RESULT;
  relatedProducts: Product[];
  brand: BRAND_QUERY_RESULT | null;
}

const ProductContent = ({
  product,
  relatedProducts,
  brand,
}: ProductContentProps) => {
  // Get actual review data from product
  const averageRating = product?.averageRating || 0;
  const totalReviews = product?.totalReviews || 0;

  // Compare and Share stores
  const { addToCompare, isInCompare } = useCompareStore();
  const { openShare } = useShareStore();
  const isInCompareList = product?._id ? isInCompare(product._id) : false;

  // State for dynamic pricing based on weight selection
  const [displayPrice, setDisplayPrice] = React.useState(product?.price || 0);
  const [selectedWeightInfo, setSelectedWeightInfo] =
    React.useState<string>("");
  const [initialWeightId, setInitialWeightId] = React.useState<string>("");
  const [selectedOptions, setSelectedOptions] = React.useState<{
    weight?: any;
    size?: any;
    color?: any;
    calculatedPrice?: number;
  }>({});

  // Track product view on component mount
  useEffect(() => {
    if (product) {
      trackProductView({
        productId: product._id,
        name: product.name || "Unknown",
      });
    }
  }, [product]);

  // Set default weight selection and calculate initial price
  useEffect(() => {
    if (
      product?.hasWeights &&
      product?.weights &&
      Array.isArray(product.weights)
    ) {
      const activeWeights = product.weights.filter(
        (w: any) => w?.isActive !== false,
      );
      if (activeWeights.length > 0) {
        const firstWeight = activeWeights[0] as any;
        setInitialWeightId(firstWeight._id);

        // Calculate initial price for first weight
        const basePrice = product?.price || 0;
        const baseWeight = (product as any)?.baseWeight;
        const discount = product?.discount || 0;

        if (baseWeight && firstWeight.numericValue) {
          const priceRatio = firstWeight.numericValue / baseWeight;
          const calculatedPrice = basePrice * priceRatio;

          // Don't apply discount here - PriceView handles it
          setDisplayPrice(calculatedPrice);

          // Set weight info display
          let displayWeight = firstWeight.name || firstWeight.value || "";
          if (!firstWeight.name && firstWeight.numericValue) {
            if (firstWeight.numericValue >= 1000) {
              displayWeight = `${(firstWeight.numericValue / 1000).toFixed(
                firstWeight.numericValue % 1000 === 0 ? 0 : 1,
              )}kg`;
            } else {
              displayWeight = `${firstWeight.numericValue}g`;
            }
          }
          setSelectedWeightInfo(displayWeight);
        }
      }
    }
  }, [product]);

  return (
    <ProductAnimationWrapper>
      <Container>
        {/* Breadcrumb Navigation */}
        <DynamicBreadcrumb
          productData={{
            name: product?.name || "",
            slug: product?.slug?.current || "",
          }}
        />

        <div className="flex flex-col md:flex-row gap-10 pb-6">
          {/* Product Images */}
          {product?.images && (
            <ProductImageWrapper>
              <ImageView images={product?.images} isStock={product?.stock} />
            </ProductImageWrapper>
          )}

          {/* Product Details */}
          <ProductDetailsWrapper>
            {/* Title and Category */}
            <div className="space-y-3">
              {product?.brand && (
                <Badge className="bg-gofarm-light-green/10 text-gofarm-green hover:bg-gofarm-light-green/20 w-fit">
                  {brand && brand.length > 0 && (
                    <span className="font-semibold tracking-wide">
                      {brand[0]?.brandName}
                    </span>
                  )}
                </Badge>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-gofarm-green leading-tight">
                {product?.name}
              </h1>
              <p className="text-lg text-dark-text leading-relaxed">
                {product?.description}
              </p>

              {/* Enhanced Rating Display */}
              {totalReviews > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, index) => (
                      <StarIcon
                        key={index}
                        size={16}
                        className={`${
                          index < Math.floor(averageRating)
                            ? "text-gofarm-light-green fill-gofarm-light-green"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gofarm-green">
                    {averageRating.toFixed(1)} ({totalReviews}{" "}
                    {totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, index) => (
                      <StarIcon
                        key={index}
                        size={16}
                        className="text-gray-300"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">No reviews yet</span>
                </div>
              )}
            </div>

            {/* Pricing & Options Section */}
            <div className="space-y-4 border-t border-b border-gray-200 py-6 bg-white/70 rounded-lg px-4">
              {/* Price Display */}
              <div className="space-y-2">
                <PriceView
                  price={displayPrice}
                  discount={product?.discount}
                  className="text-2xl font-bold"
                />
                {selectedWeightInfo && (
                  <p className="text-sm text-gofarm-gray">
                    Price for{" "}
                    <span className="font-semibold text-gofarm-green">
                      {selectedWeightInfo}
                    </span>
                  </p>
                )}
                {product?.hasWeights && (product as any)?.baseWeight && (
                  <p className="text-xs text-gofarm-gray">
                    Base price: ${product.price?.toFixed(2)} for{" "}
                    {(product as any).baseWeight}g
                  </p>
                )}
              </div>

              {/* Product Options (Weights, Sizes, Colors) */}
              <ProductOptions
                hasWeights={product?.hasWeights}
                weights={(product?.weights as any) || null}
                hasVariants={product?.hasVariants}
                sizes={(product?.sizes as any) || null}
                colors={(product?.colors as any) || null}
                basePrice={product?.price}
                baseWeight={(product as any)?.baseWeight}
                discount={product?.discount}
                stock={product?.stock}
                initialWeightId={initialWeightId}
                onSelectionChange={(selection) => {
                  setSelectedOptions(selection);
                  if (selection.calculatedPrice !== undefined) {
                    setDisplayPrice(selection.calculatedPrice);
                  }
                  if (selection.weight) {
                    let displayWeight =
                      selection.weight.name || selection.weight.value || "";
                    if (
                      !selection.weight.name &&
                      selection.weight.numericValue
                    ) {
                      if (selection.weight.numericValue >= 1000) {
                        displayWeight = `${(
                          selection.weight.numericValue / 1000
                        ).toFixed(
                          selection.weight.numericValue % 1000 === 0 ? 0 : 1,
                        )}kg`;
                      } else {
                        displayWeight = `${selection.weight.numericValue}g`;
                      }
                    }
                    setSelectedWeightInfo(displayWeight);
                  }
                }}
              />

              {/* Enhanced Stock Status */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-sm font-semibold ${
                    product?.stock === 0
                      ? "bg-red-100 text-red-700 hover:bg-red-100"
                      : product?.stock && product.stock < 10
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        : "bg-green-100 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {product?.stock === 0
                    ? "Out of Stock"
                    : product?.stock && product.stock < 10
                      ? `Only ${product.stock} left!`
                      : "In Stock"}
                </Badge>
              </div>

              {/* Discount Information */}
              {product?.discount && product.discount > 0 && (
                <div className="bg-gofarm-orange/10 text-gofarm-orange px-3 py-2 rounded-lg text-sm font-medium">
                  💰 Save {product.discount}% on this item!
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <ProductActionWrapper delay={0.3}>
              <div className="flex items-center gap-2.5 lg:gap-5">
                <AddToCartButton
                  product={product}
                  selectedOptions={selectedOptions}
                  displayPrice={displayPrice}
                />
                <FavoriteButton showProduct={true} product={product} />
              </div>
            </ProductActionWrapper>

            {/* Product Characteristics */}
            <ProductActionWrapper delay={0.4}>
              <ProductCharacteristics product={product} brand={brand} />
            </ProductActionWrapper>

            {/* Action Links */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-b-gray-200 py-5 -mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!product?._id) return;
                  if (!isInCompare(product._id)) {
                    addToCompare(product as any);
                  }
                  useCartAddedModalStore.getState().show({
                    id: `${product._id}-compare-${Date.now()}`,
                    product: product as any,
                    mode: "compare",
                  });
                }}
                className={`flex items-center gap-2 text-sm hover:text-gofarm-light-green transition-colors ${
                  isInCompareList
                    ? "text-gofarm-green font-semibold"
                    : "text-black"
                }`}
              >
                <ArrowLeftRight className="text-lg" />
                <span>
                  {isInCompareList ? "In Compare List" : "Compare Product"}
                </span>
              </Button>
              <button className="flex items-center gap-2 text-sm text-black hover:text-gofarm-light-green hoverEffect transition-colors">
                <FaRegQuestionCircle className="text-lg" />
                <span>Ask a question</span>
              </button>
              <button className="flex items-center gap-2 text-sm text-black hover:text-gofarm-light-green hoverEffect transition-colors">
                <TbTruckDelivery className="text-lg" />
                <span>Delivery & Return</span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (product) {
                    openShare(product as any);
                  }
                }}
                className="flex items-center gap-2 text-sm text-black hover:text-gofarm-light-green transition-colors"
              >
                <FiShare2 className="text-lg" />
                <span>Share</span>
              </Button>
            </div>

            {/* Delivery Information */}
            <ProductActionWrapper delay={0.5}>
              <div className="flex flex-col">
                <div className="border border-light-color/25 border-b-0 p-4 flex items-center gap-3 bg-white/70 rounded-t-lg">
                  <Truck size={32} className="text-gofarm-orange" />
                  <div>
                    <p className="text-lg font-semibold text-black">
                      Free Delivery
                    </p>
                    <p className="text-sm text-gray-500">
                      Enter your Postal code for Delivery Availability.{" "}
                      <button className="underline underline-offset-2 hover:text-gofarm-light-green transition-colors">
                        Check now
                      </button>
                    </p>
                  </div>
                </div>
                <div className="border border-light-color/25 p-4 flex items-center gap-3 bg-white/70 rounded-b-lg">
                  <CornerDownLeft size={32} className="text-gofarm-orange" />
                  <div>
                    <p className="text-lg font-semibold text-black">
                      Return Delivery
                    </p>
                    <p className="text-sm text-gray-500">
                      Free 30 days Delivery Returns.{" "}
                      <button className="underline underline-offset-2 hover:text-gofarm-light-green transition-colors">
                        Details
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </ProductActionWrapper>
          </ProductDetailsWrapper>
        </div>

        {/* Product Details Section */}
        <ProductSectionWrapper delay={0.6}>
          <ProductsDetails />
        </ProductSectionWrapper>

        {/* Trust Indicators & Guarantees */}
        <ProductSectionWrapper delay={0.7}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
            <Card className="border-2 border-gray-100 text-center p-4">
              <Shield className="h-8 w-8 text-gofarm-orange mx-auto mb-2" />
              <h3 className="font-semibold text-gofarm-green mb-1">
                Secure Payment
              </h3>
              <p className="text-sm text-gray-600">
                100% secure payment with SSL encryption
              </p>
            </Card>

            <Card className="border-2 border-gray-100 text-center p-4">
              <Truck className="h-8 w-8 text-gofarm-orange mx-auto mb-2" />
              <h3 className="font-semibold text-gofarm-green mb-1">
                Fast Delivery
              </h3>
              <p className="text-sm text-gray-600">
                Free shipping on orders over $50
              </p>
            </Card>

            <Card className="border-2 border-gray-100 text-center p-4">
              <RefreshCw className="h-8 w-8 text-gofarm-orange mx-auto mb-2" />
              <h3 className="font-semibold text-gofarm-green mb-1">
                Easy Returns
              </h3>
              <p className="text-sm text-gray-600">
                30-day hassle-free returns
              </p>
            </Card>
          </div>
        </ProductSectionWrapper>

        {/* Product Specifications */}
        <ProductSectionWrapper delay={0.8}>
          <ProductSpecs product={product} />
        </ProductSectionWrapper>

        {/* Customer Reviews */}
        <ProductSectionWrapper delay={0.9}>
          <ProductReviews
            productId={product?._id || ""}
            productName={product?.name || "this product"}
          />
        </ProductSectionWrapper>

        {/* Related Products */}
        <ProductSectionWrapper delay={1.0}>
          <RelatedProducts
            currentProduct={product as any}
            relatedProducts={relatedProducts}
          />
        </ProductSectionWrapper>
      </Container>
    </ProductAnimationWrapper>
  );
};

export default ProductContent;
