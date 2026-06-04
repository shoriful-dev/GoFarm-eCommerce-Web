"use client";

import { ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";

const PurchaseFloatingButton = () => {
  const purchaseUrl =
    process.env.NEXT_PUBLIC_PURCHASE_CODE_URL ||
    "https://buymeacoffee.com/reactbd/e/484104";

  return (
    <Link
      href={purchaseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-20 z-50 group"
    >
      <div className="relative">
        {/* Animated pulse ring */}
        <div className="absolute inset-0 bg-linear-to-r from-green-500 to-emerald-500 rounded-full animate-pulse opacity-75 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Main button */}
        <div className="relative flex items-center gap-2.5 bg-linear-to-r from-green-600 to-emerald-600 text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
          {/* Hover background animation (top to bottom) */}
          <span className="absolute inset-0 bg-gofarm-orange -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>

          {/* Icon with animation */}
          <div className="relative z-10">
            <ShoppingCart className="w-5 h-5" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 animate-pulse text-yellow-300" />
          </div>

          {/* Text */}
          <span className="relative z-10 font-semibold text-sm whitespace-nowrap">
            Buy Production Code
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PurchaseFloatingButton;
