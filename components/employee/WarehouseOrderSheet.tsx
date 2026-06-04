"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, Truck, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { urlFor } from "@/sanity/lib/image";
import PriceFormatter from "@/components/PriceFormatter";
import { Employee } from "@/types/employee";
import { assignDeliveryman } from "@/actions/orderEmployeeActions";
import { writeClient } from "@/sanity/lib/client";
import OrderNotes from "./OrderNotes";

interface WarehouseOrderSheetProps {
  order: any;
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    shouldSwitchToAssigned?: boolean,
    shouldCloseSheet?: boolean
  ) => void;
}

export default function WarehouseOrderSheet({
  order,
  employee,
  isOpen,
  onClose,
  onUpdate,
}: WarehouseOrderSheetProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDeliveryman, setSelectedDeliveryman] = useState("");
  const [deliverymen, setDeliverymen] = useState<
    Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>
  >([]);
  const [loadingDeliverymen, setLoadingDeliverymen] = useState(false);

  // Fetch available deliverymen
  useEffect(() => {
    const fetchDeliverymen = async () => {
      setLoadingDeliverymen(true);
      try {
        const data = await writeClient.fetch(`
          *[_type == "user" && isEmployee == true && employeeRole == "deliveryman" && employeeStatus == "active"] {
            _id,
            firstName,
            lastName,
            email
          }
        `);
        setDeliverymen(data);
      } catch (error) {
        console.error("Error fetching deliverymen:", error);
        toast.error("Failed to load deliverymen");
      } finally {
        setLoadingDeliverymen(false);
      }
    };

    if (isOpen) {
      fetchDeliverymen();
    }
  }, [isOpen]);

  const handleAssignDeliveryman = async () => {
    if (!order?._id || !selectedDeliveryman) {
      toast.error("Please select a deliveryman");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignDeliveryman(order._id, selectedDeliveryman);

      if (result.success) {
        toast.success(result.message);
        setSelectedDeliveryman("");
        onUpdate(false, true); // Don't switch to assigned tab, just close sheet
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while assigning deliveryman");
      console.error("Error assigning deliveryman:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!order) return null;

  const isAssigned = !!order.assignedDeliverymanId;
  const selectedDeliverymanData = deliverymen.find(
    (d) => d._id === selectedDeliveryman
  );

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent closing if assigning deliveryman or loading deliverymen data
    if (!open && (isAssigning || loadingDeliverymen)) {
      toast.warning("Please wait for the current action to complete");
      return;
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
          <SheetTitle>Warehouse - Order #{order.orderNumber}</SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={
                order.status === "packed"
                  ? "secondary"
                  : order.status === "ready_for_delivery"
                  ? "default"
                  : order.status === "out_for_delivery"
                  ? "outline"
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
            {isAssigned && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />
                Assigned
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

          {/* Products List */}
          <div>
            <h3 className="font-semibold mb-3">Products to Deliver</h3>
            <div className="space-y-3">
              {order.products?.map((item: any) => {
                const product = item.product;
                const imageUrl = product?.image
                  ? urlFor(product.image).url()
                  : null;

                return (
                  <div
                    key={item._key}
                    className="flex gap-4 p-3 border rounded-lg bg-muted/30"
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={product?.name || "Product"}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">
                        {product?.name || "Unknown Product"}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        <PriceFormatter amount={product?.price || 0} />
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            × {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-lg">
                  <PriceFormatter amount={order.totalPrice} />
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Packing Status */}
          {order.packedBy && (
            <div>
              <h3 className="font-semibold mb-3">Packing Status</h3>
              <div className="space-y-2 text-sm bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Packed and Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Packed by:</span>
                  <span className="font-medium">{order.packedBy}</span>
                </div>
                {order.packedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packed at:</span>
                    <span className="font-medium">
                      {format(new Date(order.packedAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Assignment Status */}
          {isAssigned && (
            <div>
              <h3 className="font-semibold mb-3">Delivery Assignment</h3>
              <div className="space-y-2 text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">Assigned to Deliveryman</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliveryman:</span>
                  <span className="font-medium">
                    {order.assignedDeliverymanName}
                  </span>
                </div>
                {order.dispatchedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Dispatched at:
                    </span>
                    <span className="font-medium">
                      {format(
                        new Date(order.dispatchedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assign Deliveryman Section */}
          {!isAssigned && (
            <div>
              <h3 className="font-semibold mb-3">Assign Deliveryman</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deliveryman">Select Deliveryman</Label>
                  <Select
                    value={selectedDeliveryman}
                    onValueChange={setSelectedDeliveryman}
                    disabled={loadingDeliverymen || isAssigning}
                  >
                    <SelectTrigger id="deliveryman" className="mt-2">
                      <SelectValue
                        placeholder={
                          loadingDeliverymen
                            ? "Loading deliverymen..."
                            : "Choose a deliveryman"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {deliverymen.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No active deliverymen available
                        </div>
                      ) : (
                        deliverymen.map((deliveryman) => (
                          <SelectItem
                            key={deliveryman._id}
                            value={deliveryman._id}
                          >
                            {deliveryman.firstName} {deliveryman.lastName}
                            <span className="text-muted-foreground text-xs ml-2">
                              ({deliveryman.email})
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAssignDeliveryman}
                  disabled={
                    !selectedDeliveryman || isAssigning || loadingDeliverymen
                  }
                  className="w-full gap-2"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4" />
                      Assign to Deliveryman
                    </>
                  )}
                </Button>

                {selectedDeliveryman && selectedDeliverymanData && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Selected Deliveryman:</p>
                    <p>
                      {selectedDeliverymanData.firstName}{" "}
                      {selectedDeliverymanData.lastName}
                    </p>
                    <p className="text-xs">{selectedDeliverymanData.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Notes */}
          <OrderNotes statusHistory={order.statusHistory} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
