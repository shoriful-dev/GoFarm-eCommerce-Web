import { memo } from "react";
import { Product } from "@/sanity.types";
import PriceView from "./PriceView";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { Star, Package, Flame, Heart, Eye } from "lucide-react";
import { image } from "@/sanity/image";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import FavoriteButton from "./FavoriteButton";

const ProductListCard = memo(({ product }: { product: Product }) => {
  const finalPrice = product.discount
    ? product.price! - product.price! * (product.discount / 100)
    : product.price;

  // Type guard for variant
  const variantTitle =
    product?.variant &&
    typeof product.variant === "object" &&
    "title" in product.variant
      ? (product.variant as { title: string }).title
      : null;

  return (
    <div className="border border-gofarm-light-green/20 rounded-xl group bg-gofarm-white hover:shadow-xl hoverEffect overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Image Section */}
        <div className="relative shrink-0 w-full sm:w-48 h-48 bg-gofarm-light-orange/10 rounded-lg overflow-hidden">
          {product?.images && (
            <Link href={`/product/${product?.slug?.current}`}>
              <img
                src={image(product.images[0]).size(400, 400).url()}
                className={`w-full h-full object-contain transition-transform duration-500 ${
                  product?.stock !== 0
                    ? "group-hover:scale-110"
                    : "opacity-50 grayscale"
                }`}
                alt={product.name || "Product"}
                loading="lazy"
              />
            </Link>
          )}

          {/* Status Badge */}
          {product?.status && (
            <div className="absolute top-2 left-2 z-10">
              {product.status === "hot" && (
                <Badge className="bg-gofarm-orange text-gofarm-white border-0 flex items-center gap-1">
                  <Flame size={12} fill="currentColor" />
                  Hot
                </Badge>
              )}
              {product.status === "new" && (
                <Badge className="bg-gofarm-light-green text-gofarm-white border-0">
                  New
                </Badge>
              )}
              {product.status === "sale" && (
                <Badge className="bg-gofarm-green text-gofarm-white border-0">
                  Sale
                </Badge>
              )}
            </div>
          )}

          {/* Stock Badge */}
          {product?.stock !== undefined && (
            <div className="absolute bottom-2 right-2 z-10">
              <Badge
                variant="secondary"
                className={`flex items-center gap-1 ${
                  product.stock === 0
                    ? "bg-gofarm-orange/90 text-gofarm-white"
                    : product.stock < 10
                    ? "bg-gofarm-light-orange text-gofarm-orange"
                    : "bg-gofarm-light-green/20 text-gofarm-green"
                }`}
              >
                <Package size={12} />
                {product.stock === 0
                  ? "Out of Stock"
                  : product.stock < 10
                  ? `Only ${product.stock} left`
                  : "In Stock"}
              </Badge>
            </div>
          )}

          {/* Quick View */}
          <div className="absolute inset-0 bg-gofarm-black/0 group-hover:bg-gofarm-black/10 hoverEffect flex items-center justify-center">
            <Link
              href={`/product/${product?.slug?.current}`}
              className="opacity-0 group-hover:opacity-100 hoverEffect"
            >
              <Button
                size="sm"
                className="bg-gofarm-white text-gofarm-green hover:bg-gofarm-green hover:text-gofarm-white border border-gofarm-green"
              >
                <Eye size={16} className="mr-2" />
                Quick View
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Top Section */}
          <div>
            {/* Brand/Category - Display variant */}
            {variantTitle && (
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="text-xs border-gofarm-light-green/30 text-gofarm-gray"
                >
                  {variantTitle}
                </Badge>
              </div>
            )}

            {/* Title */}
            <Link href={`/product/${product?.slug?.current}`}>
              <h3 className="text-lg font-bold text-gofarm-black group-hover:text-gofarm-light-green hoverEffect line-clamp-2 mb-2">
                {product?.name}
              </h3>
            </Link>

            {/* Description */}
            {product?.description && (
              <p className="text-sm text-gofarm-gray line-clamp-2 mb-3">
                {product.description}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.floor(product?.averageRating || 0)
                        ? "fill-gofarm-orange text-gofarm-orange"
                        : "text-gofarm-light-gray"
                    }
                  />
                ))}
              </div>
              {product?.totalReviews !== undefined &&
                product.totalReviews > 0 && (
                  <span className="text-xs text-gofarm-gray">
                    ({product.totalReviews} reviews)
                  </span>
                )}
            </div>

            {/* Price Section */}
            <div className="mb-4">
              <PriceView
                price={product?.price}
                discount={product?.discount}
                className="text-xl font-bold"
              />
            </div>
          </div>

          {/* Bottom Section - Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gofarm-light-gray">
            <div className="flex-1">
              <AddToCartButton product={product} />
            </div>
            <div className="shrink-0">
              <FavoriteButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductListCard.displayName = "ProductListCard";

export default ProductListCard;
