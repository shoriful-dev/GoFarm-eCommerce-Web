"use client";
import { Product, PRODUCT_BY_SLUG_QUERY_RESULT } from "../sanity.types";
import useCartStore from "../store";
import { useAuthStore } from "../stores/authStore";
import { Heart } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { trackWishlistAdd, trackWishlistRemove } from "../lib/analytics";
import QuickAuthSidebar from "./sidebars/QuickAuthSidebar";

const FavoriteButton = ({
  showProduct = false,
  product,
}: {
  showProduct?: boolean;
  product?: Product | PRODUCT_BY_SLUG_QUERY_RESULT;
}) => {
  const { favoriteProduct, addToFavorite } = useCartStore();
  const { user, loading } = useAuthStore();
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const availableItem = _.find(
      favoriteProduct,
      (item) => item?._id === product?._id,
    );
    setExistingProduct(availableItem || null);
  }, [product, favoriteProduct]);

  const handleFavorite = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    if (product?._id) {
      const isRemoving = !!existingProduct;

      addToFavorite(product as Product).then(() => {
        toast.success(
          isRemoving ? "Removed from wishlist" : "Added to wishlist",
          {
            description: isRemoving
              ? "Product removed successfully!"
              : "Product added successfully!",
            duration: 3000,
          },
        );

        if (isRemoving) {
          trackWishlistRemove({
            productId: product._id,
            name: product.name || "Unknown Product",
          });
        } else {
          trackWishlistAdd({
            productId: product._id,
            name: product.name || "Unknown Product",
          });
        }
      });
    }
  };

  const handleHeaderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user && !loading) {
      e.preventDefault();
      setAuthOpen(true);
    }
  };

  return (
    <>
      {!showProduct ? (
        <>
          <Link
            href="/wishlist"
            onClick={handleHeaderClick}
            className="group relative hover:text-gofarm-light-green hoverEffect cursor-pointer"
            aria-label="Open wishlist"
          >
            <Heart className="group-hover:text-gofarm-light-green hoverEffect mt-.5" />
            <span
              className={`absolute -top-1 -right-1 bg-gofarm-green text-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5 h-3.5 ${
                favoriteProduct.length > 9 ? "px-1" : ""
              }`}
            >
              {Array.isArray(favoriteProduct) && favoriteProduct.length > 0
                ? favoriteProduct.length > 9
                  ? "9+"
                  : favoriteProduct.length
                : 0}
            </span>
          </Link>
          <QuickAuthSidebar
            open={authOpen}
            onOpenChange={setAuthOpen}
            reason="Sign in to view and save your wishlist."
          />
        </>
      ) : (
        <button
          onClick={handleFavorite}
          className="group relative hover:text-gofarm-light-green hoverEffect border border-gofarm-light-green/80 p-1.5 rounded-sm "
        >
          <Heart
            fill={existingProduct ? "#063c28" : "#fff"}
            className="text-gofarm-light-green/80 group-hover:text-gofarm-light-green hoverEffect mt-.5"
          />
        </button>
      )}
    </>
  );
};

export default FavoriteButton;
