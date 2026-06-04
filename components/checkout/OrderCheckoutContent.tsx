"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Truck,
  MapPin,
  Package,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import PriceFormatter from "@/components/PriceFormatter";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { showToast } from "@/lib/toast";
import { PAYMENT_METHODS, PaymentMethod } from "@/lib/orderStatus";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { OrderSummary } from "@/components/shared/OrderSummary";

interface OrderProduct {
  product: {
    _id: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images?: any[];
    price: number;
  };
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  products: OrderProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  currency: string;
  amountDiscount: number;
  productDiscount?: number;
  businessDiscount?: number;
  coupon?: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
  };
  address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  status: string;
  paymentStatus: string;
  orderDate: string;
}

interface OrderCheckoutContentProps {
  order: Order;
}

export function OrderCheckoutContent({ order }: OrderCheckoutContentProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PAYMENT_METHODS.STRIPE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<
    "stripe" | "sslcommerz" | null
  >(null);

  const handlePayNowClick = () => {
    // Show modal for online payment methods
    if (selectedPaymentMethod !== PAYMENT_METHODS.CASH_ON_DELIVERY) {
      setShowPaymentModal(true);
    } else {
      handleCODPayment();
    }
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    setProcessingMethod("stripe");

    try {
      const response = await fetch(`/api/orders/${order._id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        showToast.error(
          "Payment Failed",
          data.error || "Failed to create payment session"
        );
        setIsProcessing(false);
        setProcessingMethod(null);
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      showToast.error("Payment Failed", "Failed to initiate payment");
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleSSLCommerzPayment = async () => {
    setIsProcessing(true);
    setProcessingMethod("sslcommerz");

    try {
      const response = await fetch(`/api/orders/${order._id}/pay/sslcommerz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.gatewayUrl) {
        // Redirect to SSLCommerz payment gateway
        window.location.href = data.gatewayUrl;
      } else {
        showToast.error(
          "Payment Failed",
          data.error || "Failed to create SSLCommerz payment session"
        );
        setIsProcessing(false);
        setProcessingMethod(null);
      }
    } catch (error) {
      console.error("SSLCommerz payment error:", error);
      showToast.error(
        "Payment Failed",
        "Failed to initiate SSLCommerz payment"
      );
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleCODPayment = async () => {
    setIsProcessing(true);

    try {
      // Here you could implement COD logic if needed
      // For now, just show a message
      showToast.success(
        "Order Confirmed",
        "Order confirmed with Cash on Delivery payment method"
      );

      setTimeout(() => {
        window.location.href = `/user/orders/${order._id}`;
      }, 1500);
    } catch (error) {
      console.error("COD payment error:", error);
      showToast.error("Payment Failed", "Failed to process COD payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate payable amount following the pricing structure:
  // Total Amount = subtotal + shipping + tax
  // Total Discount = productDiscount + couponDiscount + businessDiscount
  // Payable Amount = Total Amount - Total Discount
  const totalAmount = order.subtotal + order.shipping + order.tax;
  const totalDiscount =
    (order.productDiscount || 0) +
    (order.amountDiscount || 0) +
    (order.businessDiscount || 0);
  const payableAmount = totalAmount - totalDiscount;

  console.log("orders", order);

  return (
    <>
      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessing(false);
          setProcessingMethod(null);
        }}
        onConfirmStripe={handleStripePayment}
        onConfirmSSLCommerz={handleSSLCommerzPayment}
        totalAmount={payableAmount}
        currency={order.currency}
        isProcessing={isProcessing}
        processingMethod={processingMethod}
      />
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order #{order.orderNumber?.slice(-8)}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-muted-foreground">{order.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.address.name}</p>
                <p className="text-muted-foreground">{order.address.address}</p>
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state}{" "}
                  {order.address.zip}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(value) =>
                  setSelectedPaymentMethod(value as PaymentMethod)
                }
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem
                    value={PAYMENT_METHODS.STRIPE}
                    id="stripe"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="stripe" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <CreditCard className="w-4 h-4" />
                        Credit/Debit Card
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pay securely with your credit or debit card via Stripe
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem
                    value={PAYMENT_METHODS.CASH_ON_DELIVERY}
                    id="cod"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="cod" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <Truck className="w-4 h-4" />
                        Cash on Delivery
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pay when your order is delivered to your doorstep
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.products.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.products.map((item, index) => (
                <div key={index} className="flex gap-3 p-3 border rounded-lg">
                  {item.product.images && (
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        src={urlFor(item.product.images[0]).url()}
                        alt={item.product.name || "Product"}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      <PriceFormatter
                        amount={item.product.price * item.quantity}
                      />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <PriceFormatter amount={item.product.price} /> each
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Actions */}
        <div className="space-y-6">
          <OrderSummary
            data={{
              subtotal: (order.subtotal || 0) + (order.productDiscount || 0),
              shipping: order.shipping,
              tax: order.tax,
              productDiscount: order.productDiscount || 0,
              couponDiscount: order.amountDiscount || 0,
              couponCode: order.coupon?.code,
              businessDiscount: order.businessDiscount || 0,
              itemCount: order.products.length,
              showHeader: true,
              showBreakdown: true,
              showMessages: true,
              variant: "detailed",
            }}
          />

          <Button
            onClick={handlePayNowClick}
            disabled={isProcessing}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {selectedPaymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY ? (
                  <>
                    <Truck className="w-5 h-5" />
                    Confirm COD Order
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay{" "}
                    <PriceFormatter
                      className="text-gofarm-white text-base"
                      amount={payableAmount}
                    />
                  </>
                )}
              </div>
            )}
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/user/orders" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            {selectedPaymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY ? (
              <>
                <p>💵 Pay when your order arrives</p>
                <p>Cash payment to delivery agent</p>
              </>
            ) : (
              <>
                <p>🔒 Secure payment gateway</p>
                <p>Your payment information is encrypted and secure</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
