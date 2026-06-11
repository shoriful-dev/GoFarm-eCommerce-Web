"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { urlFor } from "@/sanity/lib/image";
import PriceFormatter from "@/components/PriceFormatter";
import { Employee } from "@/types/employee";
import { markAsPacked } from "@/actions/orderEmployeeActions";
import OrderNotes from "./OrderNotes";

interface PackingOrderSheetProps {
  order: any;
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    shouldSwitchToPacked?: boolean,
    shouldCloseSheet?: boolean
  ) => void;
}

export default function PackingOrderSheet({
  order,
  isOpen,
  onClose,
  onUpdate,
}: PackingOrderSheetProps) {
  const [isPacking, setIsPacking] = useState(false);
  const [packingNotes, setPackingNotes] = useState("");

  const handleMarkAsPacked = async () => {
    if (!order?._id) return;

    setIsPacking(true);
    try {
      const result = await markAsPacked(order._id, packingNotes);

      if (result.success) {
        toast.success(result.message);
        setPackingNotes("");
        onUpdate(false, true); // Don't switch to packed tab, just close sheet
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while packing the order");
      console.error("Error packing order:", error);
    } finally {
      setIsPacking(false);
    }
  };

  if (!order) return null;

  const isPacked = !!order.packedBy;

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent closing if packing is in progress
    if (!open && isPacking) {
      toast.warning("Please wait for the packing action to complete");
      return;
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
          <SheetTitle>Packing Order - #{order.orderNumber}</SheetTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                order.status === "pending"
                  ? "secondary"
                  : order.status === "processing"
                  ? "default"
                  : order.status === "shipped"
                  ? "outline"
                  : order.status === "delivered"
                  ? "default"
                  : "destructive"
              }
            >
              {order.status}
            </Badge>
            <Badge
              variant={order.paymentStatus === "paid" ? "default" : "secondary"}
            >
              {order.paymentStatus}
            </Badge>
            {isPacked && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />
                Packed
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {order.customerName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{order.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">
                  {order.phone || order.shippingAddress?.phone || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">
                  {order.orderDate
                    ? format(new Date(order.orderDate), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div>
            <h3 className="font-semibold mb-3">Delivery Address</h3>
            <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.address}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="text-muted-foreground">
                  Phone: {order.shippingAddress.phone}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Items to Pack</h3>
            <div className="space-y-3">
              {order.products?.map((item: any, index: number) => (
                <div
                  key={
                    item._key ||
                    `product-${item.product?._id}-${index}` ||
                    `item-${index}`
                  }
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  {item.product?.image && (
                    <div className="relative w-12 h-12 shrink-0">
                      <img
                        src={urlFor(item.product.image)
                          .width(60)
                          .height(60)
                          .url()}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <PriceFormatter amount={item.product?.price || 0} />
                    </p>
                  </div>

                  <div className="text-sm font-medium">x{item.quantity}</div>

                  <div className="text-sm font-semibold">
                    <PriceFormatter
                      amount={(item.product?.price || 0) * item.quantity}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">
                  <PriceFormatter amount={order.totalPrice || 0} />
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Packing Confirmation */}
          {!isPacked ? (
            <div>
              <h3 className="font-semibold mb-3">Mark as Packed</h3>
              <Textarea
                placeholder="Add notes about packing (optional)..."
                value={packingNotes}
                onChange={(e) => setPackingNotes(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <Button
                onClick={handleMarkAsPacked}
                disabled={isPacking}
                className="w-full gap-2"
              >
                {isPacking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Mark as Packed
              </Button>
            </div>
          ) : (
            <div>
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />
                Order Packed
              </Badge>
              <div className="mt-2 text-xs text-muted-foreground">
                Packed by {order.packedBy?.name} on{" "}
                {order.packedAt
                  ? format(
                      new Date(order.packedAt),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )
                  : "N/A"}
              </div>
            </div>
          )}

          {/* Order Confirmed Info */}
          {order.orderConfirmedBy && (
            <div>
              <h3 className="font-semibold mb-2">Order Confirmed</h3>
              <div className="text-xs text-muted-foreground">
                Confirmed by {order.orderConfirmedBy?.name} on{" "}
                {order.orderConfirmedAt
                  ? format(
                      new Date(order.orderConfirmedAt),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )
                  : "N/A"}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3">Payment Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    order.paymentStatus === "paid" ? "default" : "secondary"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <OrderNotes statusHistory={order.statusHistory} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
