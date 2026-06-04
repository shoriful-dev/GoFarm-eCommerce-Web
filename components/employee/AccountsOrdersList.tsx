"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getOrdersForAccounts,
  getAccountsPaymentStats,
} from "@/actions/orderEmployeeActions";
import AccountsOrderSheet from "./AccountsOrderSheet";

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

export default function AccountsOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "online" | "pending" | "collected"
  >("online");
  const [onlinePage, setOnlinePage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [collectedPage, setCollectedPage] = useState(1);
  const [paymentStats, setPaymentStats] = useState<{
    totalCodRevenue: number;
    codPaidRevenue: number;
    codPendingRevenue: number;
    cardRevenue: number;
    totalCodOrders: number;
    codPaidOrders: number;
    codPendingOrders: number;
    cardOrders: number;
  } | null>(null);
  const itemsPerPage = 10;

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [fetchedOrders, stats] = await Promise.all([
        getOrdersForAccounts(),
        getAccountsPaymentStats(),
      ]);
      setOrders(fetchedOrders);
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedOrder(null);
    fetchOrders(true); // Refresh orders after closing
  };

  // Filter orders
  const onlinePaymentOrders = orders.filter(
    (order) => order.stripePaymentIntentId && order.paymentStatus === "paid"
  );
  const pendingOrders = orders.filter(
    (order) => order.cashSubmittedToAccounts && !order.paymentReceivedBy
  );
  const receivedOrders = orders.filter((order) => order.paymentReceivedBy);

  // Pagination
  const totalOnlinePages = Math.ceil(onlinePaymentOrders.length / itemsPerPage);
  const totalPendingPages = Math.ceil(pendingOrders.length / itemsPerPage);
  const totalCollectedPages = Math.ceil(receivedOrders.length / itemsPerPage);

  const paginatedOnlineOrders = onlinePaymentOrders.slice(
    (onlinePage - 1) * itemsPerPage,
    onlinePage * itemsPerPage
  );

  const paginatedPendingOrders = pendingOrders.slice(
    (pendingPage - 1) * itemsPerPage,
    pendingPage * itemsPerPage
  );

  const paginatedCollectedOrders = receivedOrders.slice(
    (collectedPage - 1) * itemsPerPage,
    collectedPage * itemsPerPage
  );

  // Calculate stats
  const stats = {
    totalOnlinePayments: onlinePaymentOrders.length,
    totalPending: pendingOrders.length,
    totalReceived: receivedOrders.length,
    onlinePaymentAmount: onlinePaymentOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    ),
    pendingAmount: pendingOrders.reduce(
      (sum, order) => sum + (order.cashCollectedAmount || 0),
      0
    ),
    receivedAmount: receivedOrders.reduce(
      (sum, order) => sum + (order.cashCollectedAmount || 0),
      0
    ),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <div className="text-2xl font-bold">
                {stats.totalOnlinePayments}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.onlinePaymentAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending COD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div className="text-2xl font-bold">{stats.totalPending}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.pendingAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Received COD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="text-2xl font-bold">{stats.totalReceived}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${stats.receivedAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-500" />
              <div className="text-2xl font-bold">
                ${(stats.onlinePaymentAmount + stats.receivedAmount).toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Online + COD Received
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {paymentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Payment Method Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Card Payments
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${paymentStats.cardRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {paymentStats.cardOrders} orders
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">COD Paid</div>
                <div className="text-2xl font-bold text-green-600">
                  ${paymentStats.codPaidRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {paymentStats.codPaidOrders} orders
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">COD Pending</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${paymentStats.codPendingRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {paymentStats.codPendingOrders} orders
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cash Submissions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No Cash Submissions</p>
              <p className="text-sm">
                Cash submissions from deliverymen will appear here
              </p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "online" | "pending" | "collected")
              }
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="online" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Online ({onlinePaymentOrders.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending COD ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="collected" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Received COD ({receivedOrders.length})
                </TabsTrigger>
              </TabsList>

              {/* Online Payments Tab */}
              <TabsContent value="online" className="space-y-4">
                {paginatedOnlineOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No Online Payments</p>
                    <p className="text-sm">
                      Online card payments will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Paid At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOnlineOrders.map((order) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">
                                {order.orderNumber}
                              </TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell className="font-semibold text-blue-600">
                                ${order.totalPrice.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-blue-500 text-blue-700"
                                >
                                  Card/Online
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {order.paymentCompletedAt
                                  ? format(
                                      new Date(order.paymentCompletedAt),
                                      "MMM d, h:mm a"
                                    )
                                  : order.orderDate
                                  ? format(
                                      new Date(order.orderDate),
                                      "MMM d, h:mm a"
                                    )
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-blue-500 text-blue-700"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination for Online */}
                    {totalOnlinePages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {(onlinePage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            onlinePage * itemsPerPage,
                            onlinePaymentOrders.length
                          )}{" "}
                          of {onlinePaymentOrders.length} payments
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setOnlinePage((p) => Math.max(1, p - 1))
                            }
                            disabled={onlinePage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <div className="text-sm">
                            Page {onlinePage} of {totalOnlinePages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setOnlinePage((p) =>
                                Math.min(totalOnlinePages, p + 1)
                              )
                            }
                            disabled={onlinePage === totalOnlinePages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Pending Tab */}
              <TabsContent value="pending" className="space-y-4">
                {paginatedPendingOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No Pending Submissions</p>
                    <p className="text-sm">
                      Pending cash submissions will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPendingOrders.map((order) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">
                                {order.orderNumber}
                              </TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell className="font-semibold">
                                ${order.cashCollectedAmount?.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {order.cashSubmittedBy}
                              </TableCell>
                              <TableCell className="text-xs">
                                {order.cashSubmittedAt &&
                                  format(
                                    new Date(order.cashSubmittedAt),
                                    "MMM d, h:mm a"
                                  )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-orange-500 text-orange-700"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination for Pending */}
                    {totalPendingPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {(pendingPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            pendingPage * itemsPerPage,
                            pendingOrders.length
                          )}{" "}
                          of {pendingOrders.length} submissions
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPendingPage((p) => Math.max(1, p - 1))
                            }
                            disabled={pendingPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <div className="text-sm">
                            Page {pendingPage} of {totalPendingPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPendingPage((p) =>
                                Math.min(totalPendingPages, p + 1)
                              )
                            }
                            disabled={pendingPage === totalPendingPages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Collected Tab */}
              <TabsContent value="collected" className="space-y-4">
                {paginatedCollectedOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No Collected Submissions</p>
                    <p className="text-sm">
                      Collected cash submissions will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Received At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCollectedOrders.map((order) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">
                                {order.orderNumber}
                              </TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell className="font-semibold">
                                ${order.cashCollectedAmount?.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {order.cashSubmittedBy}
                              </TableCell>
                              <TableCell className="text-xs">
                                {order.paymentReceivedAt &&
                                  format(
                                    new Date(order.paymentReceivedAt),
                                    "MMM d, h:mm a"
                                  )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-green-500 text-green-700"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Received
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination for Collected */}
                    {totalCollectedPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {(collectedPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            collectedPage * itemsPerPage,
                            receivedOrders.length
                          )}{" "}
                          of {receivedOrders.length} submissions
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCollectedPage((p) => Math.max(1, p - 1))
                            }
                            disabled={collectedPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <div className="text-sm">
                            Page {collectedPage} of {totalCollectedPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCollectedPage((p) =>
                                Math.min(totalCollectedPages, p + 1)
                              )
                            }
                            disabled={collectedPage === totalCollectedPages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Order Details Sheet */}
      {selectedOrder && (
        <AccountsOrderSheet
          order={selectedOrder}
          open={sheetOpen}
          onClose={handleCloseSheet}
        />
      )}
    </div>
  );
}
