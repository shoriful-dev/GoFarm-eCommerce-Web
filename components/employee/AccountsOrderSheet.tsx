"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  receivePaymentFromDeliveryman,
  rejectCashSubmission,
} from "@/actions/orderEmployeeActions";
import PriceFormatter from "../PriceFormatter";
import OrderNotes from "./OrderNotes";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

type Order = {
  _id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  orderDate: string;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  products: Array<{
    _key: string;
    quantity: number;
    product: {
      _id: string;
      name: string;
      price: number;
      image?: string;
    };
  }>;
  deliveredAt?: string;
  cashCollected?: boolean;
  cashCollectedAmount?: number;
  cashCollectedAt?: string;
  cashSubmittedToAccounts?: boolean;
  cashSubmittedBy?: string;
  cashSubmittedAt?: string;
  cashSubmissionNotes?: string;
  cashSubmissionStatus?: string;
  cashSubmissionRejectionReason?: string;
  assignedAccountsEmployeeId?: string;
  assignedAccountsEmployeeName?: string;
  paymentReceivedBy?: string;
  paymentReceivedAt?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  paymentCompletedAt?: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedByRole: string;
    changedAt: string;
    notes?: string;
  }>;
};

interface AccountsOrderSheetProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export default function AccountsOrderSheet({
  order,
  open,
  onClose,
}: AccountsOrderSheetProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReceivePayment = async () => {
    if (order.paymentReceivedBy) {
      toast.error("Payment has already been received");
      return;
    }

    setLoading(true);
    try {
      const result = await receivePaymentFromDeliveryman(order._id, notes);
      if (result.success) {
        toast.success("Payment received and order marked as completed!");
        setNotes("");
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to receive payment");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const result = await rejectCashSubmission(order._id, rejectionReason);
      if (result.success) {
        toast.success("Cash submission rejected. Deliveryman can resubmit.");
        setRejectionReason("");
        setShowRejectForm(false);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to reject submission");
    } finally {
      setRejecting(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent closing if payment is being processed
    if (!open && loading) {
      toast.warning("Please wait for the payment action to complete");
      return;
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="sm:max-w-2xl p-0 flex flex-col h-full">
        {/* Sticky Header */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <SheetTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            <Badge
              variant={
                order.paymentReceivedBy
                  ? "default"
                  : order.status === "delivered"
                  ? "secondary"
                  : "outline"
              }
            >
              {order.status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-xs">{order.email}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Delivery Address */}
          {order.shippingAddress && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h3>
                <div className="text-sm bg-muted/50 p-3 rounded-lg">
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}
                    {order.shippingAddress.state &&
                      `, ${order.shippingAddress.state}`}
                  </p>
                  {order.shippingAddress.postalCode && (
                    <p>{order.shippingAddress.postalCode}</p>
                  )}
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Items ({order.products.length})
            </h3>
            <div className="space-y-2">
              {order.products.map((item) => (
                <div
                  key={item._key}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {item.product.image && (
                    <div className="relative w-12 h-12 shrink-0">
                      <Image
                        src={urlFor(item.product.image)
                          .width(100)
                          .height(100)
                          .url()}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <PriceFormatter
                      amount={item.product.price * item.quantity}
                      className="font-semibold text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <Badge variant="outline">{order.paymentMethod}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <PriceFormatter
                  amount={order.totalPrice}
                  className="font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    order.paymentStatus === "paid" ? "default" : "secondary"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>

              {/* Online Payment Details */}
              {order.stripePaymentIntentId && (
                <>
                  <Separator className="my-2" />
                  <div className="bg-green-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs text-green-700 font-medium mb-2">
                      <CheckCircle className="w-3 h-3" />
                      Online Payment Received
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Amount Paid Online:
                      </span>
                      <span className="font-semibold text-green-700">
                        <PriceFormatter amount={order.totalPrice} />
                      </span>
                    </div>
                    {order.paymentCompletedAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Paid At:</span>
                        <span>
                          {format(
                            new Date(order.paymentCompletedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-[10px]">
                        {order.stripePaymentIntentId.substring(0, 20)}...
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Cash Submission Details */}
              {order.cashSubmittedToAccounts && (
                <>
                  <Separator className="my-2" />
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Cash Amount (COD):
                      </span>
                      <span className="font-semibold text-blue-700">
                        ${order.cashCollectedAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Submitted By:
                      </span>
                      <span className="font-medium">
                        {order.cashSubmittedBy}
                      </span>
                    </div>
                    {order.assignedAccountsEmployeeName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Assigned To:
                        </span>
                        <span className="font-medium text-blue-700">
                          {order.assignedAccountsEmployeeName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Submitted At:
                      </span>
                      <span>
                        {order.cashSubmittedAt &&
                          format(
                            new Date(order.cashSubmittedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                      </span>
                    </div>
                    {order.cashSubmissionNotes && (
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Submission Notes:
                        </div>
                        <div className="text-xs bg-white p-2 rounded">
                          {order.cashSubmissionNotes}
                        </div>
                      </div>
                    )}

                    {/* Receipt Status */}
                    {order.paymentReceivedBy ? (
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <div className="flex items-center gap-2 text-xs text-green-700 font-medium mb-2">
                          <CheckCircle className="w-3 h-3" />
                          Payment Received
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Received By:
                          </span>
                          <span className="font-medium">
                            {order.paymentReceivedBy}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Received At:
                          </span>
                          <span>
                            {order.paymentReceivedAt &&
                              format(
                                new Date(order.paymentReceivedAt),
                                "MMM d, h:mm a"
                              )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-orange-200 pt-3 mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-orange-700 font-medium">
                          <Clock className="w-3 h-3" />
                          Pending Receipt Confirmation
                        </div>

                        {!showRejectForm ? (
                          <>
                            <div>
                              <Label htmlFor="receiptNotes" className="text-xs">
                                Receipt Notes (Optional)
                              </Label>
                              <Textarea
                                id="receiptNotes"
                                placeholder="Add any notes about receiving this payment..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="mt-1 text-xs"
                                rows={2}
                                disabled={loading}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleReceivePayment}
                                disabled={loading}
                                size="sm"
                                className="flex-1"
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                {loading ? "Processing..." : "Receive Cash"}
                              </Button>
                              <Button
                                onClick={() => setShowRejectForm(true)}
                                disabled={loading}
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                              >
                                Reject
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Confirm receipt to complete the order, or reject
                              to return to deliveryman
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="bg-red-50 p-2 rounded">
                              <p className="text-xs text-red-700 font-medium mb-2">
                                Rejecting Cash Submission
                              </p>
                              <p className="text-xs text-muted-foreground">
                                The deliveryman will be able to resubmit after
                                you provide a reason.
                              </p>
                            </div>
                            <div>
                              <Label
                                htmlFor="rejectionReason"
                                className="text-xs"
                              >
                                Rejection Reason{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                id="rejectionReason"
                                placeholder="Explain why you're rejecting this submission..."
                                value={rejectionReason}
                                onChange={(e) =>
                                  setRejectionReason(e.target.value)
                                }
                                className="mt-1 text-xs"
                                rows={3}
                                disabled={rejecting}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setShowRejectForm(false);
                                  setRejectionReason("");
                                }}
                                disabled={rejecting}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleRejectSubmission}
                                disabled={rejecting || !rejectionReason.trim()}
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                              >
                                {rejecting
                                  ? "Rejecting..."
                                  : "Confirm Rejection"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Order Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Order Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ordered:</span>
                <span>
                  {format(new Date(order.orderDate), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivered:</span>
                  <span>
                    {format(new Date(order.deliveredAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              )}
              {order.cashCollectedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cash Collected:</span>
                  <span>
                    {format(
                      new Date(order.cashCollectedAt),
                      "MMM d, yyyy h:mm a"
                    )}
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
