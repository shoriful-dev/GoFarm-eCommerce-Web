"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimation } from "motion/react";
import { CheckCircle2, ShoppingCart, Scale, X } from "lucide-react";
import { useCartAddedModalStore } from "@/stores/cartAddedModalStore";
import { useCompareStore } from "@/stores/compareStore";
import { image } from "@/sanity/image";

const AUTO_DISMISS_MS = 5000;

const CartAddedModal = () => {
  const { open, item, close } = useCartAddedModalStore();
  const compareCount = useCompareStore((s) => s.compareProducts.length);
  const progress = useAnimation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);

  // Auto-dismiss + progress bar lifecycle
  useEffect(() => {
    if (!open || !item) return;
    setPaused(false);
    progress.set({ scaleX: 1 });
    progress.start({
      scaleX: 0,
      transition: { duration: AUTO_DISMISS_MS / 1000, ease: "linear" },
    });
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      progress.stop();
    };
  }, [open, item, close, progress]);

  // Pause / resume on hover
  const pause = () => {
    if (paused) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progress.stop();
    setPaused(true);
  };
  const resume = () => {
    if (!paused || !open) return;
    setPaused(false);
    // Restart full timer for simplicity (small UX nit, acceptable).
    progress.set({ scaleX: 1 });
    progress.start({
      scaleX: 0,
      transition: { duration: AUTO_DISMISS_MS / 1000, ease: "linear" },
    });
    timerRef.current = setTimeout(close, AUTO_DISMISS_MS);
  };

  if (!item) {
    return <AnimatePresence>{open && null}</AnimatePresence>;
  }

  const { product, quantity, unitPrice, selectionLabel, mode } = item;
  const isCompare = mode === "compare";
  const imgSrc = product.images?.[0]
    ? image(product.images[0]).size(120, 120).url()
    : null;
  const showQty = !isCompare && typeof quantity === "number";
  const showPrice =
    !isCompare && typeof unitPrice === "number" && typeof quantity === "number";
  const subtotal = showPrice ? (unitPrice as number) * (quantity as number) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cart-added-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-3 sm:px-4 pb-4 sm:pb-0 pointer-events-none"
        >
          {/* Backdrop (click to close) */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] pointer-events-auto"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Item added to cart"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            className="relative pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header strip */}
            <div className="flex items-center gap-2 px-5 py-3 bg-gofarm-light-green/15 border-b border-gofarm-green/20">
              {isCompare ? (
                <Scale className="w-5 h-5 text-gofarm-green shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-gofarm-green shrink-0" />
              )}
              <p className="flex-1 text-sm font-bold text-gofarm-green">
                {isCompare ? "Added to compare" : "Added to your cart"}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {imgSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imgSrc}
                    alt={product.name ?? "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
                {selectionLabel && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {selectionLabel}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  {showQty ? (
                    <span className="inline-flex items-center text-xs font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                      Qty {quantity}
                    </span>
                  ) : isCompare ? (
                    <span className="inline-flex items-center text-xs font-semibold text-gofarm-green bg-gofarm-light-green/15 rounded-full px-2 py-0.5">
                      {compareCount} of 4 in compare
                    </span>
                  ) : (
                    <span />
                  )}
                  {showPrice && (
                    <span className="text-sm font-bold text-gofarm-green tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-2">
                {isCompare ? (
                  <>
                    <Link
                      href="/compare"
                      onClick={close}
                      className="relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gofarm-green text-white text-sm font-semibold hover:bg-gofarm-green/90 transition-colors"
                    >
                      <Scale className="w-4 h-4" />
                      View Compare
                      {compareCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gofarm-orange text-white text-[10px] font-bold flex items-center justify-center">
                          {compareCount}
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-gofarm-green text-gofarm-green text-sm font-semibold hover:bg-gofarm-light-green/10 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/cart"
                      onClick={close}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gofarm-green text-white text-sm font-semibold hover:bg-gofarm-green/90 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      View Cart
                    </Link>
                    <Link
                      href="/compare"
                      onClick={close}
                      className="relative inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-gofarm-green text-gofarm-green text-sm font-semibold hover:bg-gofarm-light-green/10 transition-colors"
                    >
                      <Scale className="w-4 h-4" />
                      Compare
                      {compareCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gofarm-orange text-white text-[10px] font-bold flex items-center justify-center">
                          {compareCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <motion.div
                animate={progress}
                initial={{ scaleX: 1 }}
                style={{ originX: 0 }}
                className="h-full bg-gofarm-green"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartAddedModal;
