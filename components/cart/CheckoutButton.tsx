"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Package } from "lucide-react";
import useCartStore, { CartItem } from "@/store";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useOrderPlacement } from "@/hooks/useOrderPlacement";
import { PAYMENT_METHODS } from "@/lib/orderStatus";
import { trackCheckoutStarted } from "@/lib/analytics";

import { OrderPlacementOverlay } from "./OrderPlacementSkeleton";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { computeShipping, computeTax } from "@/lib/store-settings";

interface Address {
  _id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  default: boolean;
  createdAt: string;
}

interface CheckoutButtonProps {
  cart: CartItem[];
  selectedAddress: Address | null;
  isAuthenticated: boolean;
  /** External disable signal (e.g. terms not accepted). */
  disabled?: boolean;
}

export function CheckoutButton({
  cart,
  selectedAddress,
  isAuthenticated,
  disabled = false,
}: CheckoutButtonProps) {
  const { user } = useAuthStore();
  const {
    resetCart,
    setOrderPlacementState,
    appliedCoupon,
    getCouponDiscount,
  } = useCartStore();
  const { placeOrder, isPlacingOrder, orderStep } = useOrderPlacement({
    user: user
      ? {
          uid: user.uid,
          email: user.email || "",
        }
      : null,
  });
  const [actionType, setActionType] = useState<"checkout" | "order" | null>(
    null,
  );
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const settings = useStoreSettings();

  const handleCheckout = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please sign in to continue");
      window.location.href = "/sign-in?redirectTo=/cart";
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    // Check stock status
    const outOfStockItems = cart.filter((item) => item.product.stock === 0);
    if (outOfStockItems.length > 0) {
      toast.error(
        "Some items are out of stock. Please remove them to continue.",
      );
      return;
    }

    // Set loading state for checkout button
    setActionType("checkout");

    // Track checkout started
    const cartValue = cart.reduce(
      (sum, item) => sum + (item.product.price || 0) * item.quantity,
      0,
    );
    trackCheckoutStarted({
      userId: user?.uid,
      cartValue,
      itemCount: cart.length,
    });

    // Calculate pricing using new structure
    const grossSubtotal = cart.reduce((sum, item) => {
      const currentPrice = item.product.price || 0;
      const discount = item.product.discount || 0;
      const discountAmount = (discount * currentPrice) / 100;
      const grossPrice = currentPrice + discountAmount;
      return sum + grossPrice * item.quantity;
    }, 0);

    const totalDiscount = cart.reduce((sum, item) => {
      const currentPrice = item.product.price || 0;
      const discount = item.product.discount || 0;
      const discountAmount = (discount * currentPrice) / 100;
      return sum + discountAmount * item.quantity;
    }, 0);

    const currentSubtotal = grossSubtotal - totalDiscount;

    // Get coupon discount from store
    const couponDiscount = getCouponDiscount();
    const subtotalAfterCoupon = currentSubtotal - couponDiscount;

    const shipping = computeShipping(subtotalAfterCoupon, settings);
    const tax = computeTax(subtotalAfterCoupon, settings);

    // Calculate orderTotal as Total Amount (before coupon/business discounts are subtracted)
    // This follows OrderSummary pattern: Total Amount = subtotal + shipping + tax
    // Payable Amount will be calculated as: Total Amount - (coupon + business discounts)
    const orderTotal = currentSubtotal + shipping + tax;

    // Place order first, then redirect to checkout page
    const result = await placeOrder(
      selectedAddress,
      PAYMENT_METHODS.STRIPE, // Default payment method, user can change on checkout page
      currentSubtotal,
      shipping,
      tax,
      orderTotal,
      totalDiscount,
      couponDiscount,
      0, // No business discount yet (will be calculated on checkout)
      true, // redirectToCheckout = true
    );

    if (result?.success && result.redirectTo) {
      // Store redirect URL for manual button
      setRedirectUrl(result.redirectTo);

      // Clear cart and redirect immediately (no delay to prevent empty cart flash)
      await resetCart();
      setOrderPlacementState(false, "validating");
      window.location.href = result.redirectTo;
    } else {
      // Reset state if failed
      setActionType(null);
      setRedirectUrl(null);
      setOrderPlacementState(false, "validating");
    }
  };

  const handlePlaceOrder = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please sign in to continue");
      window.location.href = "/sign-in?redirectTo=/cart";
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    // Check stock status
    const outOfStockItems = cart.filter((item) => item.product.stock === 0);
    if (outOfStockItems.length > 0) {
      toast.error(
        "Some items are out of stock. Please remove them to continue.",
      );
      return;
    }

    setActionType("order");

    // Calculate pricing using new structure
    // Get gross subtotal and discount from store functions
    const grossSubtotal = cart.reduce((sum, item) => {
      const currentPrice = item.product.price || 0;
      const discount = item.product.discount || 0;
      const discountAmount = (discount * currentPrice) / 100;
      const grossPrice = currentPrice + discountAmount;
      return sum + grossPrice * item.quantity;
    }, 0);

    const totalDiscount = cart.reduce((sum, item) => {
      const currentPrice = item.product.price || 0;
      const discount = item.product.discount || 0;
      const discountAmount = (discount * currentPrice) / 100;
      return sum + discountAmount * item.quantity;
    }, 0);

    const currentSubtotal = grossSubtotal - totalDiscount;

    // Get coupon discount from store
    const couponDiscount = getCouponDiscount();
    const subtotalAfterCoupon = currentSubtotal - couponDiscount;

    const shipping = computeShipping(subtotalAfterCoupon, settings);
    const tax = computeTax(subtotalAfterCoupon, settings);

    // Calculate orderTotal as Total Amount (before coupon/business discounts are subtracted)
    // This follows OrderSummary pattern: Total Amount = subtotal + shipping + tax
    // Payable Amount will be calculated as: Total Amount - (coupon + business discounts)
    const orderTotal = currentSubtotal + shipping + tax;

    const result = await placeOrder(
      selectedAddress,
      PAYMENT_METHODS.CASH_ON_DELIVERY,
      currentSubtotal,
      shipping,
      tax,
      orderTotal,
      totalDiscount,
      couponDiscount,
      0, // No business discount for COD
      false, // redirectToCheckout = false
    );

    if (result?.success && result.redirectTo) {
      // Clear cart and redirect immediately (no delay to prevent empty cart flash)
      await resetCart();
      setOrderPlacementState(false, "validating");
      window.location.href = result.redirectTo;
    } else {
      // Reset state if no redirect
      setOrderPlacementState(false, "validating");
    }

    setActionType(null);
  };

  const hasOutOfStockItems = cart.some((item) => item.product.stock === 0);

  return (
    <>
      {/* Show overlay skeleton for both checkout and place order actions */}
      {isPlacingOrder &&
        (actionType === "order" || actionType === "checkout") && (
          <OrderPlacementOverlay
            step={orderStep}
            isCheckoutRedirect={actionType === "checkout"}
            redirectUrl={redirectUrl || undefined}
          />
        )}

      <div className="space-y-4">
        {hasOutOfStockItems && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              Some items are out of stock and need to be removed
            </p>
          </div>
        )}

        {!selectedAddress && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-700">
              Please select a shipping address to continue
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleCheckout}
            disabled={
              disabled ||
              !isAuthenticated ||
              isPlacingOrder ||
              actionType === "checkout" ||
              hasOutOfStockItems ||
              !selectedAddress ||
              cart.length === 0
            }
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {actionType === "checkout" ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isPlacingOrder ? "Processing..." : "Redirecting..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {isAuthenticated
                  ? "Proceed to Checkout"
                  : "Sign in to Checkout"}
              </div>
            )}
          </Button>

          <Button
            onClick={handlePlaceOrder}
            disabled={
              disabled ||
              !isAuthenticated ||
              isPlacingOrder ||
              hasOutOfStockItems ||
              !selectedAddress ||
              cart.length === 0
            }
            variant="outline"
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isPlacingOrder && actionType === "order" ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                Placing Order...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Place Order (Pay Later)
              </div>
            )}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>🔒 Secure checkout powered by Stripe</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </div>
    </>
  );
}
