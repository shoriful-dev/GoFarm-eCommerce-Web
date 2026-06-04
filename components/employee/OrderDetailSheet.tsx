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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  Edit,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import {
  confirmAddress,
  confirmOrder,
  updateShippingAddress,
} from "@/actions/orderEmployeeActions";
import { toast } from "sonner";
import { urlFor } from "@/sanity/lib/image";
import PriceFormatter from "@/components/PriceFormatter";
import { Employee } from "@/types/employee";
import OrderNotes from "./OrderNotes";
import Image from "next/image";

interface OrderDetailSheetProps {
  order: any;
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    shouldSwitchToConfirmed?: boolean,
    shouldCloseSheet?: boolean
  ) => void;
}

interface EditableProduct {
  _key: string;
  product: {
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
  quantity: number;
}

export default function OrderDetailSheet({
  order,
  employee,
  isOpen,
  onClose,
  onUpdate,
}: OrderDetailSheetProps) {
  const [isConfirmingAddress, setIsConfirmingAddress] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [addressNotes, setAddressNotes] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(
    []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editableAddress, setEditableAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  useEffect(() => {
    if (order?.products) {
      // Ensure each product has a unique _key
      const productsWithKeys = order.products.map(
        (item: any, index: number) => ({
          ...item,
          _key:
            item._key || `${item.product?._id}-${index}` || `product-${index}`,
        })
      );
      setEditableProducts(productsWithKeys);
    }

    // Initialize editable address
    if (order?.shippingAddress) {
      setEditableAddress({
        fullName: order.shippingAddress.fullName || "",
        address: order.shippingAddress.address || "",
        city: order.shippingAddress.city || "",
        state: order.shippingAddress.state || "",
        postalCode: order.shippingAddress.postalCode || "",
        country: order.shippingAddress.country || "",
        phone: order.shippingAddress.phone || "",
      });
    }
  }, [order]);

  const handleConfirmAddress = async () => {
    if (!order?._id) return;

    setIsConfirmingAddress(true);
    try {
      const result = await confirmAddress(order._id, addressNotes);

      if (result.success) {
        toast.success("Address confirmed successfully");
        setAddressNotes("");
        onUpdate(false, false); // Don't switch tabs, don't close sheet
      } else {
        toast.error(result.message || "Failed to confirm address");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsConfirmingAddress(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!order?._id) return;

    setIsConfirmingOrder(true);
    try {
      const result = await confirmOrder(order._id, orderNotes);

      if (result.success) {
        toast.success("Order confirmed successfully");
        setOrderNotes("");
        onUpdate(false, true); // Don't switch to confirmed tab, just close sheet
      } else {
        toast.error(result.message || "Failed to confirm order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!order?._id) return;

    setIsSavingAddress(true);
    try {
      const result = await updateShippingAddress(order._id, editableAddress);

      if (result.success) {
        toast.success("Address updated successfully");
        setIsEditingAddress(false);
        onUpdate(false, false); // Refresh order data
      } else {
        toast.error(result.message || "Failed to update address");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelEditAddress = () => {
    // Reset to original values
    if (order?.shippingAddress) {
      setEditableAddress({
        fullName: order.shippingAddress.fullName || "",
        address: order.shippingAddress.address || "",
        city: order.shippingAddress.city || "",
        state: order.shippingAddress.state || "",
        postalCode: order.shippingAddress.postalCode || "",
        country: order.shippingAddress.country || "",
        phone: order.shippingAddress.phone || "",
      });
    }
    setIsEditingAddress(false);
  };

  const handleQuantityChange = (key: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setEditableProducts((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveProduct = (key: string) => {
    setEditableProducts((prev) => prev.filter((item) => item._key !== key));
  };

  const handleSaveProducts = async () => {
    // TODO: Implement updateOrderProducts server action
    toast.info("Save products functionality coming soon");
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableProducts(order.products);
    setIsEditing(false);
  };

  const calculateTotal = () => {
    return editableProducts.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  if (!order) return null;

  const isAddressConfirmed = !!order.addressConfirmedBy;
  const isOrderConfirmed = !!order.orderConfirmedBy;

  // Prevent closing during any loading/processing state
  const isProcessing =
    isConfirmingAddress || isConfirmingOrder || isSavingAddress;

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent closing if processing
    if (!open && isProcessing) {
      toast.warning("Please wait for the current action to complete");
      return;
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
          <SheetTitle>Order Details - #{order.orderNumber}</SheetTitle>
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
                <span className="font-medium">{order.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">
                  {order._createdAt
                    ? format(new Date(order._createdAt), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Address with inline confirm button */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Delivery Address</h3>
              {!isAddressConfirmed && employee.role === "callcenter" && (
                <div className="flex gap-2">
                  {isEditingAddress ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEditAddress}
                        disabled={isSavingAddress}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAddress}
                        disabled={isSavingAddress}
                      >
                        {isSavingAddress ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingAddress(true)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmAddress}
                        disabled={isConfirmingAddress}
                        className="gap-2"
                      >
                        {isConfirmingAddress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        Confirm
                      </Button>
                    </>
                  )}
                </div>
              )}
              {!isAddressConfirmed && employee.role !== "callcenter" && (
                <Badge variant="secondary" className="gap-1">
                  Pending Confirmation
                </Badge>
              )}
              {isAddressConfirmed && (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Address Confirmed
                </Badge>
              )}
            </div>

            {isEditingAddress &&
            !isAddressConfirmed &&
            employee.role === "callcenter" ? (
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Full Name
                  </label>
                  <Input
                    value={editableAddress.fullName}
                    onChange={(e) =>
                      setEditableAddress({
                        ...editableAddress,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Address
                  </label>
                  <Textarea
                    value={editableAddress.address}
                    onChange={(e) =>
                      setEditableAddress({
                        ...editableAddress,
                        address: e.target.value,
                      })
                    }
                    placeholder="Street address"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      City
                    </label>
                    <Input
                      value={editableAddress.city}
                      onChange={(e) =>
                        setEditableAddress({
                          ...editableAddress,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      State
                    </label>
                    <Input
                      value={editableAddress.state}
                      onChange={(e) =>
                        setEditableAddress({
                          ...editableAddress,
                          state: e.target.value,
                        })
                      }
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Postal Code
                    </label>
                    <Input
                      value={editableAddress.postalCode}
                      onChange={(e) =>
                        setEditableAddress({
                          ...editableAddress,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="Postal Code"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Country
                    </label>
                    <Input
                      value={editableAddress.country}
                      onChange={(e) =>
                        setEditableAddress({
                          ...editableAddress,
                          country: e.target.value,
                        })
                      }
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Phone
                  </label>
                  <Input
                    value={editableAddress.phone}
                    onChange={(e) =>
                      setEditableAddress({
                        ...editableAddress,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>
            ) : (
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
            )}

            {isAddressConfirmed && (
              <div className="mt-2 text-xs text-muted-foreground">
                Confirmed by {order.addressConfirmedBy?.name} on{" "}
                {order.addressConfirmedAt
                  ? format(
                      new Date(order.addressConfirmedAt),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )
                  : "N/A"}
              </div>
            )}

            {!isAddressConfirmed && (
              <Textarea
                placeholder="Add notes about address confirmation..."
                value={addressNotes}
                onChange={(e) => setAddressNotes(e.target.value)}
                className="mt-3"
                rows={2}
              />
            )}
          </div>

          <Separator />

          {/* Products Section with Edit Capability */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Order Items</h3>
              {!isOrderConfirmed && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveProducts}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Products
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {editableProducts.map((item, index) => (
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
                      <Image
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

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          handleQuantityChange(item._key, item.quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item._key,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-16 h-7 text-center"
                        min="1"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          handleQuantityChange(item._key, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={() => handleRemoveProduct(item._key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm font-medium">x{item.quantity}</div>
                  )}

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
                  <PriceFormatter amount={calculateTotal()} />
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Confirmation Section - Only show after address confirmed */}
          {isAddressConfirmed && !isOrderConfirmed && (
            <div>
              <h3 className="font-semibold mb-3">Confirm Order</h3>
              <Textarea
                placeholder="Add notes about order confirmation..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <Button
                onClick={handleConfirmOrder}
                disabled={isConfirmingOrder}
                className="w-full gap-2"
              >
                {isConfirmingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirm Order
              </Button>
            </div>
          )}

          {isOrderConfirmed && (
            <div>
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Order Confirmed
              </Badge>
              <div className="mt-2 text-xs text-muted-foreground">
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
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-medium font-mono text-xs">
                    {order.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          <OrderNotes statusHistory={order.statusHistory} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
