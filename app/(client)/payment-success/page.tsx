"use client";

import {
  Check,
  Home,
  Package,
  ShoppingBag,
  Calendar,
  Eye,
  Truck,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MY_ORDERS_QUERY_RESULT } from "@/sanity.types";
import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import { useAuthStore } from "@/stores/authStore";
import useCartStore from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PriceFormatter from "@/components/PriceFormatter";
import { format } from "date-fns";

// Extended type for order with coupon details
type OrderWithCoupon = MY_ORDERS_QUERY_RESULT[number] & {
  coupon?: {
    code?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
  };
};

const PaymentSuccessPage = () => {
  const [orders, setOrders] = useState<MY_ORDERS_QUERY_RESULT>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [orderAmount, setOrderAmount] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("order_id");
  const paymentMethod = searchParams.get("payment_method");
  const amount = searchParams.get("amount");

  const user = useAuthStore((state) => state.user);
  const userId = user?.uid;
  const { resetCart } = useCartStore();

  const query =
    defineQuery(`*[_type == 'order' && firebaseUid == $userId] | order(orderDate desc){
  ...,
  products[]{
    ...,product->
  },
  subtotal,
  shipping,
  tax,
  totalPrice,
  productDiscount,
  amountDiscount,
  businessDiscount,
  coupon {
    code,
    discountType,
    discountValue,
    discountAmount
  }
}`);

  // Clear cart on successful payment
  useEffect(() => {
    const clearCart = async () => {
      if (orderId) {
        try {
          await resetCart();
        } catch (error) {
          console.error("Error clearing cart after payment:", error);
        }
      }
    };
    clearCart();
  }, [orderId, resetCart]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        console.log("User ID not found. Cannot fetch orders.");
        return;
      }

      try {
        const ordersData = await client.fetch(query, { userId });
        setOrders(ordersData as MY_ORDERS_QUERY_RESULT);

        // If amount is not in URL params, calculate payable amount from the order
        if (!amount && orderId) {
          const currentOrder: any = ordersData.find(
            (order: any) => order._id === orderId
          );
          if (currentOrder) {
            // Calculate payable amount following OrderSummary pattern
            // Subtotal in DB is GROSS (before product discounts)
            const totalAmount =
              (currentOrder.subtotal || 0) +
              (currentOrder.shipping || 0) +
              (currentOrder.tax || 0);

            const productDiscount = currentOrder.productDiscount || 0;
            const couponDiscount =
              currentOrder.coupon?.discountAmount ||
              currentOrder.amountDiscount ||
              0;
            const businessDiscount = currentOrder.businessDiscount || 0;

            const totalDiscount =
              productDiscount + couponDiscount + businessDiscount;
            const payableAmount = totalAmount - totalDiscount;

            setOrderAmount(payableAmount);
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchData();
  }, [userId, query, orderId, amount]);

  // Get the display amount - either from URL param or fetched order data
  const displayAmount = amount ? parseFloat(amount) : orderAmount;

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Animated Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="relative w-32 h-32 mx-auto mb-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gofarm-green/20 rounded-full blur-xl"
            />
            <div className="relative w-full h-full bg-linear-to-br from-gofarm-green to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              >
                <CheckCircle2
                  className="text-white w-16 h-16"
                  strokeWidth={3}
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Payment Successful! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Thank you for your purchase! Your order has been confirmed and is
            being processed. We&apos;ll send you a confirmation email with
            tracking details shortly.
          </motion.p>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Card className="border-2 border-gofarm-green/20 shadow-lg">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  {/* Order Number */}
                  {(orderNumber || orderId) && (
                    <div className="flex flex-col items-center justify-center py-4 md:py-0">
                      <Package className="w-8 h-8 text-gofarm-green mb-2" />
                      <span className="text-sm text-gray-500 mb-1">
                        Order Number
                      </span>
                      <span className="text-xl font-bold text-gofarm-green">
                        #{orderNumber || orderId?.slice(-8)}
                      </span>
                    </div>
                  )}

                  {/* Payment Method */}
                  {paymentMethod && (
                    <div className="flex flex-col items-center justify-center py-4 md:py-0">
                      <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
                      <span className="text-sm text-gray-500 mb-1">
                        Payment Method
                      </span>
                      <Badge
                        variant="outline"
                        className="text-base font-semibold border-blue-200"
                      >
                        {paymentMethod === "stripe"
                          ? "Stripe"
                          : paymentMethod === "sslcommerz"
                          ? "SSLCommerz"
                          : paymentMethod}
                      </Badge>
                    </div>
                  )}

                  {/* Amount */}
                  {displayAmount && (
                    <div className="flex flex-col items-center justify-center py-4 md:py-0">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                      <span className="text-sm text-gray-500 mb-1">
                        Amount Paid
                      </span>
                      <PriceFormatter
                        amount={displayAmount}
                        className="text-xl font-bold text-gray-900"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Order Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-12"
        >
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gofarm-green" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative text-center group"
                >
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                    >
                      <Package className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Order Confirmed
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your order is confirmed and we&apos;re preparing your items
                    for shipment
                  </p>
                  <div className="mt-4 inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    ✓ Completed
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="relative text-center group"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 bg-linear-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                  >
                    <Truck className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Preparing Shipment
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We&apos;re packing your order with care. Ships within 2-3
                    business days
                  </p>
                  <div className="mt-4 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    ⏳ In Progress
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="relative text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="w-16 h-16 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                  >
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Delivered
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your order will be delivered with real-time tracking updates
                  </p>
                  <div className="mt-4 inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    ○ Pending
                  </div>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "33%" }}
                    transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                    className="h-full bg-linear-to-r from-blue-500 via-yellow-500 to-green-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        {userId && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mb-12"
          >
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gofarm-green" />
                    Your Recent Orders
                  </div>
                  <Badge variant="secondary">{orders.length} Orders</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {(showAllOrders ? orders : orders.slice(0, 3)).map(
                    (order, index) => (
                      <motion.div
                        key={order?._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + index * 0.1 }}
                        className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-gofarm-green/30 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-linear-to-br from-gofarm-green/20 to-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6 text-gofarm-green" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Order #
                              {order.orderNumber?.slice(-8) ||
                                order._id.slice(-8)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {order.orderDate
                                  ? format(
                                      new Date(order.orderDate),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </div>
                              <PriceFormatter
                                amount={order.totalPrice || 0}
                                className="font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              order.status === "completed" ||
                              order.status === "delivered"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize font-semibold"
                          >
                            {order.status || "pending"}
                          </Badge>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-2 hover:border-gofarm-green hover:bg-gofarm-green/5"
                          >
                            <Link href={`/user/orders/${order._id}`}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    )
                  )}

                  {orders.length > 3 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllOrders(!showAllOrders)}
                        className="text-sm font-medium hover:text-gofarm-green"
                      >
                        {showAllOrders
                          ? "Show Less ▲"
                          : `Show All ${orders.length} Orders ▼`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Button
            asChild
            size="lg"
            className="h-14 bg-gofarm-green hover:bg-gofarm-green/90 text-base font-semibold shadow-lg hover:shadow-xl transition-all group"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue Shopping
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 border-2 border-gofarm-green/20 hover:border-gofarm-green hover:bg-gofarm-green/5 text-base font-semibold group"
          >
            <Link
              href="/user/orders"
              className="flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Track Orders
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 border-2 border-gofarm-green/20 hover:border-gofarm-green hover:bg-gofarm-green/5 text-base font-semibold group"
          >
            <Link
              href="/shop"
              className="flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Shop More
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
