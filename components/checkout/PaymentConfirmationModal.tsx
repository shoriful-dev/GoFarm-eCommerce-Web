"use client";

import React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, Loader2, ShieldCheck, X } from "lucide-react";
import PriceFormatter from "@/components/PriceFormatter";
import { cn } from "@/lib/utils";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStripe: () => void;
  onConfirmSSLCommerz: () => void;
  totalAmount: number;
  currency?: string;
  isProcessing: boolean;
  processingMethod?: "stripe" | "sslcommerz" | null;
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirmStripe,
  onConfirmSSLCommerz,
  totalAmount,
  currency = "USD",
  isProcessing,
  processingMethod,
}: PaymentConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
          )}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Choose Payment Method</DialogTitle>
          </VisuallyHidden.Root>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <ShieldCheck className="w-6 h-6 text-gofarm-green" />
              Choose Payment Method
            </div>
            <p className="text-sm text-muted-foreground">
              Select your preferred payment gateway to complete your order
            </p>
          </div>

          <div className="space-y-4">
            {/* Amount Display */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                <PriceFormatter amount={totalAmount} />
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currency.toUpperCase()}
              </p>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              {/* Stripe Option */}
              <button
                onClick={onConfirmStripe}
                disabled={isProcessing}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        Stripe Payment
                      </h3>
                      <p className="text-sm text-gray-600">
                        Credit/Debit Card, Apple Pay, Google Pay
                      </p>
                    </div>
                  </div>
                  {isProcessing && processingMethod === "stripe" && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Secured by Stripe • International payments</span>
                </div>
              </button>

              {/* SSLCommerz Option */}
              <button
                onClick={onConfirmSSLCommerz}
                disabled={isProcessing}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        SSLCommerz Payment
                      </h3>
                      <p className="text-sm text-gray-600">
                        bKash, Nagad, Rocket, Cards (Bangladesh)
                      </p>
                    </div>
                  </div>
                  {isProcessing && processingMethod === "sslcommerz" && (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Secured by SSLCommerz • Local payment methods</span>
                </div>
              </button>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
              <p>
                Your payment information is encrypted and secure. We never store
                your card details on our servers.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
