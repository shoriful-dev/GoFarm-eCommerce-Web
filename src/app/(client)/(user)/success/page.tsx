"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import { useAuthStore } from "@/stores/authStore";

const SuccessPage = () => {
  const [isRedirecting, setIsRedirecting] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  const user = useAuthStore((state) => state.user);
  const userId = user?.uid;

  useEffect(() => {
    const redirectToPaymentSuccess = async () => {
      if (!orderId) {
        console.error("No order ID found");
        router.push("/user/orders");
        return;
      }

      try {
        // Fetch order details to get order number and amount
        const order = await client.fetch(
          defineQuery(`*[_type == 'order' && _id == $orderId][0]{
            _id,
            orderNumber,
            totalPrice,
            currency
          }`),
          { orderId }
        );

        if (!order) {
          console.error("Order not found");
          router.push("/user/orders");
          return;
        }

        // Build redirect URL with all parameters
        const params = new URLSearchParams({
          order_id: orderId,
          payment_method: "stripe",
        });

        if (order.orderNumber) {
          params.append("orderNumber", order.orderNumber);
        }

        // Don't pass amount - let payment-success page calculate it from order data
        // This ensures the correct payable amount is shown (after all discounts)

        if (sessionId) {
          params.append("session_id", sessionId);
        }

        // Redirect to the unified payment success page
        router.push(`/payment-success?${params.toString()}`);
      } catch (error) {
        console.error("Error fetching order:", error);
        router.push("/user/orders");
      }
    };

    redirectToPaymentSuccess();
  }, [orderId, sessionId, router, userId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gofarm-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">
          Redirecting to order confirmation...
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
