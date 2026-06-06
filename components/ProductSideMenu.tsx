"use client";
import { cn } from "../lib/utils";
import { Product } from "../sanity.types";
import useCartStore from "../store";
import { useCompareStore } from "../stores/compareStore";
import { useShareStore } from "../stores/shareStore";
import { useCartAddedModalStore } from "../stores/cartAddedModalStore";
import { Heart, ArrowLeftRight, Share2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";

const ProductSideMenu = ({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) => {
  const { favoriteProduct, addToFavorite } = useCartStore();
  const { addToCompare, isInCompare } = useCompareStore();
  const { openShare } = useShareStore();
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [isInCompareList, setIsInCompareList] = useState(false);

  useEffect(() => {
    const availableItem = _.find(
      favoriteProduct,
      (item) => item?._id === product?._id,
    );
    setExistingProduct(availableItem || null);
    setIsInCompareList(isInCompare(product?._id as string));
  }, [product, favoriteProduct, isInCompare]);

  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (product?._id) {
      addToFavorite(product).then(() => {
        toast.success(
          existingProduct ? "Removed from wishlist" : "Added to wishlist",
          {
            description: existingProduct
              ? "Product removed successfully!"
              : "Product added successfully!",
            duration: 3000,
          },
        );
      });
    }
  };

  const handleCompare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!product?._id) return;
    if (isInCompare(product._id)) {
      // Already in compare — just open the modal to show the action options
      useCartAddedModalStore.getState().show({
        id: `${product._id}-compare-${Date.now()}`,
        product,
        mode: "compare",
      });
      return;
    }
    addToCompare(product);
    useCartAddedModalStore.getState().show({
      id: `${product._id}-compare-${Date.now()}`,
      product,
      mode: "compare",
    });
  };

  const handleShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    openShare(product);
  };

  return (
    <div
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-full group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out z-10",
        className,
      )}
    >
      {/* Favorite Button */}
      <button
        onClick={handleFavorite}
        className={`p-2 rounded-full shadow-lg border border-gofarm-green/20 backdrop-blur-sm hover:scale-110 transition-all duration-300 ${
          existingProduct
            ? "bg-gofarm-green text-white"
            : "bg-white/90 text-gofarm-gray hover:bg-gofarm-green hover:text-white"
        }`}
        title={existingProduct ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={16} className={existingProduct ? "fill-current" : ""} />
      </button>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        className={`p-2 rounded-full shadow-lg border border-gofarm-green/20 backdrop-blur-sm hover:scale-110 transition-all duration-300 ${
          isInCompareList
            ? "bg-gofarm-green text-white"
            : "bg-white/90 text-gofarm-gray hover:bg-gofarm-green hover:text-white"
        }`}
        title="Compare product"
      >
        <ArrowLeftRight size={16} />
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="p-2 rounded-full shadow-lg border border-gofarm-green/20 backdrop-blur-sm bg-white/90 text-gofarm-gray hover:bg-gofarm-green hover:text-white hover:scale-110 transition-all duration-300"
        title="Share product"
      >
        <Share2 size={16} />
      </button>
    </div>
  );
};

export default ProductSideMenu;
