"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Package,
  DollarSign,
  Truck,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  startDelivery,
  markAsDelivered,
  rescheduleDelivery,
  markDeliveryFailed,
  collectCash,
  submitCashToAccounts,
  getActiveAccountsEmployees,
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
  phone?: string;
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
    phone?: string;
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
  dispatchedAt?: string;
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
  rescheduledDate?: string;
  deliveryAttempts?: number;
  deliveryNotes?: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedByRole: string;
    changedAt: string;
    notes?: string;
  }>;
};

interface DeliveryOrderSheetProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export default function DeliveryOrderSheet({
  order,
  open,
  onClose,
}: DeliveryOrderSheetProps) {
  const [loading, setLoading] = useState(false);
  const [collectingCash, setCollectingCash] = useState(false);
  const [submittingCash, setSubmittingCash] = useState(false);
  const [notes, setNotes] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [cashAmount, setCashAmount] = useState(order.totalPrice.toString());
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [accountsEmployees, setAccountsEmployees] = useState<
    Array<{ _id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [selectedAccountsEmployee, setSelectedAccountsEmployee] = useState("");

  const isCOD =
    order.paymentMethod === "cash_on_delivery" ||
    order.paymentStatus === "pending";
  const canDeliver = !isCOD || order.cashCollected;

  // Fetch accounts employees when sheet opens
  useEffect(() => {
    if (open) {
      const fetchAccountsEmployees = async () => {
        const employees = await getActiveAccountsEmployees();
        setAccountsEmployees(employees);
      };
      fetchAccountsEmployees();
    }
  }, [open]);

  const handleStartDelivery = async () => {
    setLoading(true);
    try {
      const result = await startDelivery(order._id, notes);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to start delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (isCOD && !order.cashCollected) {
      toast.error("Please collect cash before marking as delivered");
      return;
    }

    setLoading(true);
    try {
      const result = await markAsDelivered(order._id, notes);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to mark as delivered");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectCash = async () => {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setCollectingCash(true);
    try {
      const result = await collectCash(order._id, amount);
      if (result.success) {
        toast.success(result.message);
        // Update local order state to reflect cash collection
        order.cashCollected = true;
        order.cashCollectedAmount = amount;
        order.cashCollectedAt = new Date().toISOString();
        // Don't close the sheet - user can continue to mark as delivered
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to collect cash");
    } finally {
      setCollectingCash(false);
    }
  };

  const handleSubmitCash = async () => {
    if (order.cashSubmittedToAccounts) {
      toast.error("Cash has already been submitted to accounts");
      return;
    }

    if (!selectedAccountsEmployee) {
      toast.error("Please select an accounts employee to submit cash to");
      return;
    }

    setSubmittingCash(true);
    try {
      const result = await submitCashToAccounts(
        order._id,
        selectedAccountsEmployee,
        submissionNotes
      );
      if (result.success) {
        toast.success(result.message);
        // Update local order state to reflect submission
        order.cashSubmittedToAccounts = true;
        order.cashSubmittedAt = new Date().toISOString();
        setSubmissionNotes("");
        setSelectedAccountsEmployee("");
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to submit cash to accounts");
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleReason) {
      toast.error("Please provide date and reason for rescheduling");
      return;
    }

    setLoading(true);
    try {
      const result = await rescheduleDelivery(
        order._id,
        rescheduleDate,
        rescheduleReason
      );
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to reschedule delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!failureReason) {
      toast.error("Please provide reason for failure");
      return;
    }

    setLoading(true);
    try {
      const result = await markDeliveryFailed(order._id, failureReason);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to mark delivery as failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      ready_for_delivery: {
        label: "Ready for Delivery",
        variant: "secondary",
        icon: Package,
      },
      out_for_delivery: {
        label: "Out for Delivery",
        variant: "default",
        icon: Truck,
      },
      delivered: { label: "Delivered", variant: "outline", icon: CheckCircle },
      rescheduled: {
        label: "Rescheduled",
        variant: "secondary",
        icon: Calendar,
      },
      failed_delivery: {
        label: "Failed Delivery",
        variant: "destructive",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
      icon: Package,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent closing if any action is in progress
    if (!open && (loading || collectingCash || submittingCash)) {
      toast.warning("Please wait for the current action to complete");
      return;
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              <span>Order {order.orderNumber}</span>
              {getStatusBadge(order.status)}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6 pb-20">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {order.customerName || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {order.email || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {order.phone || order.shippingAddress?.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </h3>
            {order.shippingAddress ? (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state &&
                    `, ${order.shippingAddress.state}`}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.country}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No address provided
              </p>
            )}
          </div>

          <Separator />

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products ({order.products.length})
            </h3>
            <div className="space-y-3">
              {order.products.map((item) => (
                <div
                  key={item._key}
                  className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg"
                >
                  {item.product.image && (
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        src={urlFor(item.product.image)
                          .width(100)
                          .height(100)
                          .url()}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.product.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <PriceFormatter amount={item.product.price} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-lg">
                  <PriceFormatter amount={order.totalPrice} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <Badge variant="outline">
                  {order.paymentMethod === "cash_on_delivery"
                    ? "Cash on Delivery"
                    : order.paymentMethod}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    order.paymentStatus === "paid" ? "outline" : "destructive"
                  }
                  className={
                    order.paymentStatus === "paid" ? "bg-green-50" : ""
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>

              {order.cashCollected && (
                <>
                  <Separator className="my-2" />
                  <div className="bg-green-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Cash Collected:
                      </span>
                      <span className="font-semibold text-green-700">
                        ${order.cashCollectedAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Collected At:
                      </span>
                      <span>
                        {order.cashCollectedAt &&
                          format(
                            new Date(order.cashCollectedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                      </span>
                    </div>

                    {/* Submission Status */}
                    {order.cashSubmittedToAccounts &&
                      !order.paymentReceivedBy && (
                        <div className="space-y-1 border-t border-orange-200 pt-2 mt-2">
                          <div className="flex items-center gap-2 text-xs text-orange-700 font-medium">
                            <Clock className="w-3 h-3" />
                            Submitted - Pending Receipt by Accounts
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Submitted At:
                            </span>
                            <span>
                              {order.cashSubmittedAt &&
                                format(
                                  new Date(order.cashSubmittedAt),
                                  "MMM d, h:mm a"
                                )}
                            </span>
                          </div>
                          {order.assignedAccountsEmployeeName && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Assigned To:
                              </span>
                              <span className="font-medium text-orange-700">
                                {order.assignedAccountsEmployeeName}
                              </span>
                            </div>
                          )}
                          {order.cashSubmissionNotes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Notes: </span>
                              {order.cashSubmissionNotes}
                            </div>
                          )}
                        </div>
                      )}

                    {order.cashSubmittedToAccounts &&
                      order.paymentReceivedBy && (
                        <div className="space-y-1 border-t border-green-200 pt-2 mt-2">
                          <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Submitted to Accounts
                          </div>
                          {order.assignedAccountsEmployeeName && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Submitted To:
                              </span>
                              <span className="font-medium">
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
                                  "MMM d, h:mm a"
                                )}
                            </span>
                          </div>
                        </div>
                      )}

                    {order.paymentReceivedBy && (
                      <div className="space-y-1 border-t border-green-200 pt-2 mt-2">
                        <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Received by Accounts
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
                    )}

                    {/* Waiting for Accounts to Receive */}
                    {order.cashSubmissionStatus === "pending" &&
                      !order.paymentReceivedBy && (
                        <div className="border-t border-blue-200 pt-3 mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                            <Clock className="w-3 h-3 animate-pulse" />
                            Waiting for Accounts to Review Submission
                          </div>
                          {order.assignedAccountsEmployeeName && (
                            <div className="bg-blue-50 p-2 rounded text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Submitted To:
                                </span>
                                <span className="font-medium">
                                  {order.assignedAccountsEmployeeName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Submitted At:
                                </span>
                                <span>
                                  {order.cashSubmittedAt &&
                                    format(
                                      new Date(order.cashSubmittedAt),
                                      "MMM d, h:mm a"
                                    )}
                                </span>
                              </div>
                              {order.cashSubmissionNotes && (
                                <div className="border-t border-blue-200 pt-1 mt-1">
                                  <div className="text-muted-foreground mb-1">
                                    Notes:
                                  </div>
                                  <div className="bg-white p-1.5 rounded">
                                    {order.cashSubmissionNotes}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground text-center">
                            The accounts team will review and confirm receipt of
                            the cash payment.
                          </p>
                        </div>
                      )}

                    {/* Submission Rejected - Show form again */}
                    {order.cashSubmissionStatus === "rejected" && (
                      <div className="border-t border-red-200 pt-3 mt-2 space-y-3">
                        <div className="bg-red-50 p-2 rounded text-xs space-y-1 mb-3">
                          <div className="text-red-700 font-medium">
                            ❌ Submission Rejected
                          </div>
                          {order.cashSubmissionRejectionReason && (
                            <div className="text-red-600">
                              <div className="text-muted-foreground mb-1">
                                Reason:
                              </div>
                              <div className="bg-white p-1.5 rounded">
                                {order.cashSubmissionRejectionReason}
                              </div>
                            </div>
                          )}
                          <p className="text-muted-foreground mt-2">
                            Please resubmit the cash to accounts.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="accountsEmployee" className="text-xs">
                            Select Accounts Employee{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedAccountsEmployee}
                            onValueChange={setSelectedAccountsEmployee}
                            disabled={submittingCash}
                          >
                            <SelectTrigger className="mt-1 text-xs">
                              <SelectValue placeholder="Choose an accounts employee..." />
                            </SelectTrigger>
                            <SelectContent>
                              {accountsEmployees.map((emp) => (
                                <SelectItem key={emp._id} value={emp._id}>
                                  {emp.firstName} {emp.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="submissionNotes" className="text-xs">
                            Submission Notes (Optional)
                          </Label>
                          <Textarea
                            id="submissionNotes"
                            placeholder="Add any notes for accounts..."
                            value={submissionNotes}
                            onChange={(e) => setSubmissionNotes(e.target.value)}
                            className="mt-1 text-xs"
                            rows={2}
                            disabled={submittingCash}
                          />
                        </div>
                        <Button
                          onClick={handleSubmitCash}
                          disabled={submittingCash || !selectedAccountsEmployee}
                          size="sm"
                          className="w-full"
                        >
                          <DollarSign className="w-3 h-3 mr-2" />
                          {submittingCash
                            ? "Submitting..."
                            : "Resubmit Cash to Accounts"}
                        </Button>
                        {!selectedAccountsEmployee && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please select an accounts employee to continue
                          </p>
                        )}
                      </div>
                    )}

                    {/* Initial submission form - when not submitted or confirmed */}
                    {(!order.cashSubmittedToAccounts ||
                      order.cashSubmissionStatus === "not_submitted") && (
                      <div className="border-t border-orange-200 pt-3 mt-2 space-y-3">
                        <div className="text-xs text-orange-700 font-medium">
                          ⚠ Pending Submission to Accounts
                        </div>
                        <div>
                          <Label htmlFor="accountsEmployee" className="text-xs">
                            Select Accounts Employee{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={selectedAccountsEmployee}
                            onValueChange={setSelectedAccountsEmployee}
                            disabled={submittingCash}
                          >
                            <SelectTrigger className="mt-1 text-xs">
                              <SelectValue placeholder="Choose an accounts employee..." />
                            </SelectTrigger>
                            <SelectContent>
                              {accountsEmployees.map((emp) => (
                                <SelectItem key={emp._id} value={emp._id}>
                                  {emp.firstName} {emp.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="submissionNotes" className="text-xs">
                            Submission Notes (Optional)
                          </Label>
                          <Textarea
                            id="submissionNotes"
                            placeholder="Add any notes for accounts..."
                            value={submissionNotes}
                            onChange={(e) => setSubmissionNotes(e.target.value)}
                            className="mt-1 text-xs"
                            rows={2}
                            disabled={submittingCash}
                          />
                        </div>
                        <Button
                          onClick={handleSubmitCash}
                          disabled={submittingCash || !selectedAccountsEmployee}
                          size="sm"
                          className="w-full"
                        >
                          <DollarSign className="w-3 h-3 mr-2" />
                          {submittingCash
                            ? "Submitting..."
                            : "Submit Cash to Accounts"}
                        </Button>
                        {!selectedAccountsEmployee && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please select an accounts employee to continue
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Delivery Timeline */}
          {(order.dispatchedAt || order.deliveredAt) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Delivery Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  {order.dispatchedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dispatched:</span>
                      <span>
                        {format(
                          new Date(order.dispatchedAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivered:</span>
                      <span>
                        {format(
                          new Date(order.deliveredAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                  )}
                  {order.deliveryAttempts && order.deliveryAttempts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Delivery Attempts:
                      </span>
                      <Badge variant="secondary">
                        {order.deliveryAttempts}
                      </Badge>
                    </div>
                  )}
                  {order.rescheduledDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Rescheduled For:
                      </span>
                      <span>
                        {format(new Date(order.rescheduledDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Actions based on status */}
          <div className="space-y-4">
            {order.status === "ready_for_delivery" && (
              <>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any delivery notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleStartDelivery}
                  disabled={loading}
                  className="w-full"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  {loading ? "Starting..." : "Start Delivery"}
                </Button>
              </>
            )}

            {order.status === "out_for_delivery" && (
              <>
                {/* Cash Collection for COD */}
                {isCOD && !order.cashCollected && (
                  <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-orange-800 font-medium">
                      <DollarSign className="w-4 h-4" />
                      Cash Collection Required
                    </div>
                    <div>
                      <Label htmlFor="cashAmount">Amount to Collect</Label>
                      <Input
                        id="cashAmount"
                        type="number"
                        step="0.01"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        disabled={collectingCash}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleCollectCash}
                      disabled={collectingCash}
                      className="w-full"
                      variant="default"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {collectingCash
                        ? "Collecting Cash..."
                        : "Confirm Cash Collection"}
                    </Button>
                    <p className="text-xs text-orange-700">
                      Click to confirm you have received the cash from the
                      customer. You can then mark the order as delivered.
                    </p>
                  </div>
                )}

                {/* Show cash collected status */}
                {order.cashCollected && (
                  <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Cash Collected
                    </div>
                    <div className="text-sm text-green-700">
                      Amount: ${order.cashCollectedAmount?.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Collected at:{" "}
                      {order.cashCollectedAt &&
                        format(
                          new Date(order.cashCollectedAt),
                          "MMM d, yyyy h:mm a"
                        )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="deliveryNotes">
                    Delivery Notes (Optional)
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="Add delivery notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleMarkAsDelivered}
                  disabled={loading || !canDeliver}
                  className="w-full"
                  variant={canDeliver ? "default" : "secondary"}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {loading
                    ? "Marking as Delivered..."
                    : canDeliver
                    ? "Mark as Delivered"
                    : "Collect Cash First"}
                </Button>

                {!canDeliver && (
                  <p className="text-xs text-center text-orange-600">
                    Please collect and confirm cash payment before marking as
                    delivered
                  </p>
                )}

                <Separator />

                {/* Reschedule */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm">Reschedule Delivery</h4>
                  <div>
                    <Label htmlFor="rescheduleDate">New Date</Label>
                    <Input
                      id="rescheduleDate"
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rescheduleReason">Reason</Label>
                    <Textarea
                      id="rescheduleReason"
                      placeholder="Why is delivery being rescheduled?"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleReschedule}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reschedule Delivery
                  </Button>
                </div>

                <Separator />

                {/* Mark as Failed */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm text-destructive">
                    Mark Delivery Failed
                  </h4>
                  <div>
                    <Label htmlFor="failureReason">Failure Reason</Label>
                    <Textarea
                      id="failureReason"
                      placeholder="Why did the delivery fail?"
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleMarkFailed}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Mark as Failed
                  </Button>
                </div>
              </>
            )}

            {order.status === "delivered" && (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Order Delivered Successfully</p>
                {order.deliveryNotes && (
                  <div className="mt-4 text-left">
                    <Label>Delivery Notes:</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-3 rounded">
                      {order.deliveryNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Notes */}
          <OrderNotes statusHistory={order.statusHistory} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
