"use client";
import { useState } from "react";
import Link from "next/link";
import useCartStore from "@/store";
import { useAuthStore } from "@/stores/authStore";
import { ShoppingCart, Loader2 } from "lucide-react";
import QuickAuthSidebar from "@/components/sidebars/QuickAuthSidebar";

const CartIcon = () => {
  const { items, isLoadingCart } = useCartStore();
  const { user, loading } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  const itemCount = items?.length || 0;
  const displayCount = itemCount > 9 ? "9+" : itemCount;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user && !loading) {
      e.preventDefault();
      setAuthOpen(true);
    }
  };

  return (
    <>
      <Link
        href="/cart"
        onClick={handleClick}
        className="group relative cursor-pointer"
        aria-label="Open cart"
      >
        <ShoppingCart className="group-hover:text-gofarm-light-green hoverEffect" />
        {isLoadingCart ? (
          <span className="absolute -top-1 -right-1 bg-gofarm-green text-white rounded-full text-xs font-semibold flex items-center justify-center w-4.5 h-4.5">
            <Loader2 className="w-3 h-3 animate-spin" />
          </span>
        ) : itemCount > 0 ? (
          <span
            className={`absolute -top-1 -right-1 bg-gofarm-green text-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5 h-3.5 ${
              itemCount > 9 ? "px-1" : ""
            }`}
          >
            {displayCount}
          </span>
        ) : (
          <span className="absolute -top-1 -right-1 bg-gofarm-green text-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5">
            0
          </span>
        )}
      </Link>

      <QuickAuthSidebar
        open={authOpen}
        onOpenChange={setAuthOpen}
        reason="Sign in to view your cart and complete checkout."
      />
    </>
  );
};

export default CartIcon;
