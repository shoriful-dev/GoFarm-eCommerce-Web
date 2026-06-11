import { memo } from "react";
import { Product } from "../sanity.types";
import PriceView from "./PriceView";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import Title from "./Title";
import { StarIcon } from "@sanity/icons";
import ProductSideMenu from "./ProductSideMenu";
import { Badge } from "./ui/badge";
import { image } from "../sanity/image";
import Image from "next/image";

const ProductCard = memo(({ product }: { product: Product }) => {
  const isOutOfStock = product?.stock === 0;
  const hasDiscount = product?.discount && product.discount > 0;
  const averageRating = Math.round(product?.averageRating || 0);

  return (
    <div className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
      {/* Image Container - Fixed height h-60 to maintain dimensions */}
      <div className="relative h-60 overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
        {product?.images && (
          <Link
            href={`/product/${product?.slug?.current}`}
            className="block h-full"
          >
            <Image
              src={image(product.images[0]).size(500, 500).url()}
              width={500}
              height={500}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isOutOfStock ? "opacity-40 grayscale" : "group-hover:scale-110"
              }`}
              alt={product?.name || "Product"}
              loading="lazy"
            />
          </Link>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 shadow-md">
              Out of Stock
            </Badge>
          ) : (
            <>
              {product?.status === "sale" && (
                <Badge className="bg-gofarm-orange text-white text-[10px] px-2 py-0.5 shadow-md">
                  Sale
                </Badge>
              )}
              {product?.status === "new" && (
                <Badge className="bg-gofarm-green text-white text-[10px] px-2 py-0.5 shadow-md">
                  New
                </Badge>
              )}
              {product?.status === "hot" && (
                <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 shadow-md">
                  Hot
                </Badge>
              )}
              {hasDiscount && (
                <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 shadow-md font-bold">
                  -{product.discount}%
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Product Side Menu - Slide from left, stays at right-6 */}
        <ProductSideMenu product={product} />
      </div>

      {/* Content Container - Compact padding */}
      <div className="p-3 space-y-2">
        {/* Product Name - Single line with hover effect */}
        <Link href={`/product/${product?.slug?.current}`}>
          <Title className="text-sm font-semibold line-clamp-1 mb-1 group-hover:text-gofarm-green transition-colors leading-tight">
            {product?.name}
          </Title>
        </Link>

        {/* Rating - Compact */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
              const isFilled = index < averageRating;
              return (
                <StarIcon
                  key={index}
                  className={`w-3 h-3 ${
                    isFilled ? "text-amber-400" : "text-gray-300"
                  }`}
                  fill={isFilled ? "#fbbf24" : "#d1d5db"}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-gofarm-gray">
            ({product?.totalReviews || 0})
          </span>
        </div>

        {/* Stock Status - Only show urgency */}
        {!isOutOfStock && (product?.stock as number) <= 10 && (
          <p className="text-[10px] text-gofarm-orange font-medium">
            Only {product?.stock} left
          </p>
        )}

        {/* Price */}
        <PriceView
          price={product?.price}
          discount={product?.discount}
          className="text-base font-bold"
        />

        {/* Add to Cart Button */}
        <AddToCartButton product={product} />
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
