"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AppliedCoupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

interface CouponInputProps {
  subtotal: number;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  onCouponApplied: (coupon: AppliedCoupon | null) => void;
  appliedCoupon: AppliedCoupon | null;
  disabled?: boolean;
  className?: string;
}

export default function CouponInput({
  subtotal,
  cartItems,
  onCouponApplied,
  appliedCoupon,
  disabled = false,
  className = "",
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidating(true);

    try {
      // Get auth token if available
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase().trim(),
          subtotal,
          cartItems,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onCouponApplied(data.coupon);
        toast.success(data.message || "Coupon applied successfully!", {
          icon: "🎉",
        });
        setCouponCode("");
      } else {
        toast.error(data.message || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error("Failed to apply coupon. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponApplied(null);
    setCouponCode("");
    setIsExpanded(false);
    toast.info("Coupon removed");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !appliedCoupon) {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div
        className={`flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                {appliedCoupon.code}
              </Badge>
              <span className="text-sm font-medium text-green-700">
                {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discountValue}% off`
                  : `$${appliedCoupon.discountValue} off`}
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              You saved ${appliedCoupon.discountAmount.toFixed(2)}!
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toggle Button */}
      {!isExpanded && !appliedCoupon && (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="flex items-center gap-2 text-sm font-medium text-gofarm-green hover:text-gofarm-light-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Tag className="w-4 h-4" />
          <span>Have a coupon code?</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Coupon Input Form */}
      {isExpanded && !appliedCoupon && (
        <div className="space-y-2 p-4 border border-gofarm-light-gray rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Enter coupon code
            </label>
            <button
              onClick={() => {
                setIsExpanded(false);
                setCouponCode("");
              }}
              disabled={disabled || isValidating}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={disabled || isValidating}
              className="flex-1 uppercase"
              maxLength={20}
              autoFocus
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              variant="outline"
              className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green hover:text-white"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Coupon codes are case-insensitive and will be applied at checkout
          </p>
        </div>
      )}
    </div>
  );
}
