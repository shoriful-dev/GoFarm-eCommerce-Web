"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PriceFormatter from "@/components/PriceFormatter";
import { cn } from "@/lib/utils";

export interface OrderSummaryData {
  // Base amounts
  subtotal: number; // This should be the GROSS subtotal (before any discounts)
  shipping: number;
  tax: number;

  // Discount amounts
  productDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  businessDiscount?: number;

  // Item count
  itemCount?: number;

  // Display options
  showHeader?: boolean;
  showBreakdown?: boolean;
  showMessages?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

interface OrderSummaryProps {
  data: OrderSummaryData;
  className?: string;
}

export function OrderSummary({ data, className }: OrderSummaryProps) {
  const {
    subtotal,
    shipping,
    tax,
    productDiscount = 0,
    couponDiscount = 0,
    couponCode,
    businessDiscount = 0,
    itemCount,
    showHeader = true,
    showBreakdown = true,
    showMessages = true,
    variant = "default",
  } = data;

  // Calculate totals following the correct structure:
  // 1. Subtotal = GROSS subtotal (before product discounts are applied)
  // 2. Add shipping and tax to get Total Amount
  // 3. Calculate Total Discount (sum of all discounts including product discount)
  // 4. Payable Amount = Total Amount - Total Discount

  const totalAmount = subtotal + shipping + tax;
  const totalDiscount = productDiscount + couponDiscount + businessDiscount;
  const payableAmount = totalAmount - totalDiscount;

  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  const textSizeBase = isCompact ? "text-xs" : "text-sm";
  const textSizeTotal = isCompact
    ? "text-sm"
    : isDetailed
    ? "text-xl"
    : "text-lg";
  const spacing = isCompact ? "space-y-2" : "space-y-3";

  return (
    <Card className={cn("shadow-sm", className)}>
      {showHeader && (
        <CardHeader className={isCompact ? "pb-3" : ""}>
          <CardTitle className={isCompact ? "text-base" : "text-lg"}>
            Order Summary
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? "" : "pt-6"}>
        <div className={spacing}>
          {/* Subtotal (Gross Amount) */}
          <div className={cn("flex justify-between", textSizeBase)}>
            <span className="text-gray-600">
              Subtotal{itemCount ? ` (${itemCount} items)` : ""}
            </span>
            <PriceFormatter
              amount={subtotal}
              className="font-medium text-gray-900"
            />
          </div>

          {/* Shipping */}
          <div className={cn("flex justify-between", textSizeBase)}>
            <span className="text-gray-600">Shipping</span>
            {shipping === 0 ? (
              <span className="text-green-600 font-semibold">Free</span>
            ) : (
              <PriceFormatter
                amount={shipping}
                className="font-medium text-gray-900"
              />
            )}
          </div>

          {/* Tax */}
          <div className={cn("flex justify-between", textSizeBase)}>
            <span className="text-gray-600">Tax</span>
            <PriceFormatter
              amount={tax}
              className="font-medium text-gray-900"
            />
          </div>

          {showBreakdown && (
            <>
              <Separator className="my-2" />

              {/* Total Amount (Subtotal + Shipping + Tax) */}
              <div
                className={cn("flex justify-between font-medium", textSizeBase)}
              >
                <div>
                  <span className="text-gray-700">Total Amount</span>
                  {isDetailed && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      (<PriceFormatter amount={subtotal} className="inline" />
                      {" + "}
                      <PriceFormatter amount={shipping} className="inline" />
                      {" + "}
                      <PriceFormatter amount={tax} className="inline" />)
                    </div>
                  )}
                </div>
                <PriceFormatter
                  amount={totalAmount}
                  className="font-semibold text-gray-900"
                />
              </div>
            </>
          )}

          {/* Discounts Section */}
          {totalDiscount > 0 && (
            <>
              <Separator className="my-2" />

              {/* Individual Discounts */}
              {productDiscount > 0 && (
                <div
                  className={cn(
                    "flex justify-between font-medium",
                    textSizeBase
                  )}
                >
                  <span className="text-green-600">Product Discount</span>
                  <span className="text-green-600">
                    -<PriceFormatter amount={productDiscount} />
                  </span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div
                  className={cn(
                    "flex justify-between font-medium",
                    textSizeBase
                  )}
                >
                  <span className="text-green-600">
                    Coupon Discount{couponCode ? ` (${couponCode})` : ""}
                  </span>
                  <span className="text-green-600">
                    -<PriceFormatter amount={couponDiscount} />
                  </span>
                </div>
              )}

              {businessDiscount > 0 && (
                <div
                  className={cn(
                    "flex justify-between font-medium",
                    textSizeBase
                  )}
                >
                  <span className="text-blue-600">Business Discount (2%)</span>
                  <span className="text-blue-600">
                    -<PriceFormatter amount={businessDiscount} />
                  </span>
                </div>
              )}

              {/* Total Discount */}
              {showBreakdown && (
                <div
                  className={cn(
                    "flex justify-between font-semibold",
                    textSizeBase
                  )}
                >
                  <span className="text-green-600">
                    Total Discount
                    {couponCode ? ` (incl. ${couponCode})` : ""}
                  </span>
                  <span className="text-green-600">
                    -<PriceFormatter amount={totalDiscount} />
                  </span>
                </div>
              )}
            </>
          )}

          <Separator className="my-3" />

          {/* Payable Amount (Final Total) */}
          <div className={cn("flex justify-between font-bold", textSizeTotal)}>
            <span className="text-gray-900">Payable Amount</span>
            <PriceFormatter amount={payableAmount} className="text-green-600" />
          </div>

          {/* Messages */}
          {showMessages && (
            <>
              {shipping === 0 && subtotal > 100 && (
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium">
                  🎉 You got free shipping!
                </div>
              )}
              {subtotal < 100 && (
                <div className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-xs">
                  Add <PriceFormatter amount={100 - subtotal} /> more for free
                  shipping
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate order summary from cart
export function calculateCartSummary(
  grossSubtotal: number,
  productDiscount: number,
  couponDiscount: number,
  businessDiscount: number = 0,
  taxRate: number = 0
): {
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  totalDiscount: number;
  payableAmount: number;
} {
  // Calculate subtotal after product and coupon discounts for shipping calculation
  const subtotalAfterDiscounts =
    grossSubtotal - productDiscount - couponDiscount - businessDiscount;

  const shipping = subtotalAfterDiscounts > 100 ? 0 : 10;
  const tax = subtotalAfterDiscounts * taxRate;

  const totalAmount = grossSubtotal + shipping + tax;
  const totalDiscount = productDiscount + couponDiscount + businessDiscount;
  const payableAmount = totalAmount - totalDiscount;

  return {
    subtotal: grossSubtotal,
    shipping,
    tax,
    totalAmount,
    totalDiscount,
    payableAmount,
  };
}

// Helper function to calculate from order data
export function calculateOrderSummary(
  subtotal: number,
  productDiscount: number = 0,
  couponDiscount: number = 0,
  businessDiscount: number = 0,
  shipping: number = 0,
  tax: number = 0
): {
  totalAmount: number;
  totalDiscount: number;
  payableAmount: number;
} {
  const totalAmount = subtotal + shipping + tax;
  const totalDiscount = productDiscount + couponDiscount + businessDiscount;
  const payableAmount = totalAmount - totalDiscount;

  return {
    totalAmount,
    totalDiscount,
    payableAmount,
  };
}
