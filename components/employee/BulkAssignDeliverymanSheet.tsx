"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Package,
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/sanity/lib/backendClient";

interface BulkAssignDeliverymanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  orders: any[];
  onComplete: () => void;
}

interface Deliveryman {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  firebaseUid: string;
  activeOrders?: number;
}

export default function BulkAssignDeliverymanSheet({
  isOpen,
  onClose,
  selectedOrderIds,
  orders,
  onComplete,
}: BulkAssignDeliverymanSheetProps) {
  const [deliverymen, setDeliverymen] = useState<Deliveryman[]>([]);
  const [selectedDeliveryman, setSelectedDeliveryman] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchDeliverymen = async () => {
      try {
        setLoading(true);
        const data = await backendClient.fetch(
          `*[_type == "user" && isEmployee == true && employeeRole == "deliveryman" && employeeStatus == "active"]{
            _id,
            firstName,
            lastName,
            email,
            firebaseUid,
            "activeOrders": count(*[_type == "order" && assignedDeliverymanId == ^.firebaseUid && status in ["ready_for_delivery", "out_for_delivery"]])
          } | order(activeOrders asc)`
        );
        setDeliverymen(data || []);
      } catch (error) {
        console.error("Error fetching deliverymen:", error);
        toast.error("Failed to load deliverymen");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDeliverymen();
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedDeliveryman) {
      toast.error("Please select a deliveryman");
      return;
    }

    try {
      setAssigning(true);

      const selectedDeliverymanData = deliverymen.find(
        (d) => d._id === selectedDeliveryman
      );

      if (!selectedDeliverymanData) {
        toast.error("Invalid deliveryman selected");
        return;
      }

      const deliverymanFullName = `${selectedDeliverymanData.firstName} ${selectedDeliverymanData.lastName}`;

      // Call server-side API route to update orders
      const response = await fetch("/api/employee/bulk-assign-deliveryman", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          deliverymanId: selectedDeliverymanData.firebaseUid,
          deliverymanName: deliverymanFullName,
          deliverymanEmail: selectedDeliverymanData.email || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign orders");
      }

      toast.success(data.message);
      onComplete();
    } catch (error) {
      console.error("Error assigning orders:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign orders"
      );
    } finally {
      setAssigning(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-gofarm-black">
            <Users className="w-5 h-5 text-gofarm-green" />
            Bulk Assign Deliveryman
          </SheetTitle>
          <SheetDescription>
            Assign {selectedOrderIds.length} selected order
            {selectedOrderIds.length !== 1 ? "s" : ""} to a deliveryman
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 px-3">
          {/* Selected Orders Summary */}
          <Card className="border-l-4 border-l-gofarm-green">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gofarm-green/10 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-gofarm-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-gofarm-black">
                    Selected Orders
                  </h3>
                  <p className="text-sm text-gofarm-gray">
                    {selectedOrderIds.length} order
                    {selectedOrderIds.length !== 1 ? "s" : ""} • Total:{" "}
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <ScrollArea className="h-40 rounded-lg border bg-gray-50 p-3">
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-gofarm-gray">
                          {order.customerName}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(order.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Deliverymen Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-gofarm-green" />
              <h3 className="font-semibold text-gofarm-black">
                Select Deliveryman
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gofarm-green" />
              </div>
            ) : deliverymen.length === 0 ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        No Deliverymen Available
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        There are no active deliverymen available at the moment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <RadioGroup
                value={selectedDeliveryman}
                onValueChange={setSelectedDeliveryman}
              >
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-3">
                    {deliverymen.map((deliveryman) => (
                      <Card
                        key={deliveryman._id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedDeliveryman === deliveryman._id
                            ? "border-gofarm-green border-2 bg-gofarm-green/5"
                            : "border-gray-200"
                        }`}
                        onClick={() => setSelectedDeliveryman(deliveryman._id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value={deliveryman._id}
                              id={deliveryman._id}
                              className="mt-1"
                            />
                            <Label
                              htmlFor={deliveryman._id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gofarm-black">
                                    {deliveryman.firstName}{" "}
                                    {deliveryman.lastName}
                                  </div>
                                  <div className="text-sm text-gofarm-gray">
                                    {deliveryman.email}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    deliveryman.activeOrders === 0
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : deliveryman.activeOrders! < 5
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-orange-50 text-orange-700 border-orange-200"
                                  }
                                >
                                  {deliveryman.activeOrders || 0} active
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </RadioGroup>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDeliveryman || assigning || loading}
              className="flex-1 bg-gofarm-green hover:bg-gofarm-light-green"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assign Orders
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
