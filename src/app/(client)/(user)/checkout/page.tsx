import Container from "@/components/Container";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import { ShoppingBag } from "lucide-react";
import { CheckoutContent } from "@/components/checkout/CheckoutContent";
import { notFound } from "next/navigation";
import { getOrderById } from "@/sanity/queries";
import { getCurrentUser } from "@/lib/firebase-admin-auth";
import { OrderCheckoutContent } from "@/components/checkout/OrderCheckoutContent";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    orderId?: string;
    order_id?: string;
    orderNumber?: string;
    payment_method?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId || params.order_id;
  const user = await getCurrentUser();

  // If there's an orderId, this is checkout for a pre-created order
  if (orderId) {
    if (!user) {
      console.log("No user found, redirecting to not found");
      notFound();
    }

    // `getOrderById` returns a permissive `OrderByIdResult` because
    // typegen doesn't yet emit a GROQ result type for this query.
    // We only narrow the fields read on this page; the consumer
    // component re-types its own `order` prop separately.
    const order = await getOrderById(orderId);

    if (!order) {
      console.log("Order not found:", orderId);
      notFound();
    }

    if (order.firebaseUid !== user.uid) {
      notFound();
    }

    return (
      <Container className="py-6">
        {/* Breadcrumb with custom items for payment flow */}
        <DynamicBreadcrumb
          customItems={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-6"
        />

        {/* Checkout Header */}
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Complete Your Order</h1>
        </div>

        {/* Order Checkout Content */}
        <OrderCheckoutContent order={order as never} />
      </Container>
    );
  }

  // Regular checkout flow
  return (
    <Container className="py-6">
      {/* Breadcrumb with parent context showing "Home > Dashboard > Cart > Checkout" */}
      <DynamicBreadcrumb
        customItems={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/user" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
        className="mb-6"
      />

      {/* Checkout Header */}
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {/* Checkout Content */}
      <CheckoutContent />
    </Container>
  );
}
