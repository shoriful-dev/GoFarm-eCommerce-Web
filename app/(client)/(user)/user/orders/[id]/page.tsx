import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/sanity/queries";
import { getCurrentUser } from "@/lib/firebase-admin-auth";
import OrderDetailsPage from "@/components/OrderDetailsPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return {
      title: "Order Not Found",
    };
  }

  return {
    title: `Order ${order.orderNumber} - gofarm`,
    description: `Order details for ${order.customerName}`,
  };
}

export default async function OrderDetailsPageRoute({ params }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    notFound();
  }

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  // Security check: ensure user can only view their own orders
  if (order.firebaseUid !== user.uid) {
    notFound();
  }

  console.log("userOrder", order);

  return (
    <div className="w-full">
      <OrderDetailsPage order={order as never} />
    </div>
  );
}
