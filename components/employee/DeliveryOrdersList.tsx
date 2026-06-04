"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  Package,
  CheckCircle,
  DollarSign,
  Search,
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrdersForEmployee } from "@/actions/orderEmployeeActions";
import DeliveryOrderSheet from "./DeliveryOrderSheet";

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
  paymentReceivedBy?: string;
  paymentReceivedAt?: string;
  rescheduledDate?: string;
  deliveryAttempts?: number;
};

export default function DeliveryOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState("assigned");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, activeTab]);

  const fetchOrders = async (forceFresh = false) => {
    if (forceFresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await getOrdersForEmployee();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by tab
    switch (activeTab) {
      case "assigned":
        // Ready for delivery - assigned but not yet out for delivery
        filtered = filtered.filter(
          (order) => order.status === "ready_for_delivery"
        );
        break;
      case "delivering":
        // Out for delivery
        filtered = filtered.filter(
          (order) => order.status === "out_for_delivery"
        );
        break;
      case "delivered":
        // Delivered orders
        filtered = filtered.filter((order) => order.status === "delivered");
        break;
      case "collections":
        // Orders with cash collected but not yet submitted to accounts
        filtered = filtered.filter(
          (order) => order.cashCollected && !order.paymentReceivedBy
        );
        break;
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      ready_for_delivery: { label: "Ready", variant: "secondary" },
      out_for_delivery: { label: "Delivering", variant: "default" },
      delivered: { label: "Delivered", variant: "outline" },
      rescheduled: { label: "Rescheduled", variant: "secondary" },
      failed_delivery: { label: "Failed", variant: "destructive" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (order: Order) => {
    if (order.cashCollected && order.paymentReceivedBy) {
      return (
        <Badge variant="outline" className="bg-green-50">
          Submitted
        </Badge>
      );
    }
    if (order.cashCollected) {
      return (
        <Badge variant="default" className="bg-blue-500">
          Collected
        </Badge>
      );
    }
    if (
      order.paymentMethod === "cash_on_delivery" ||
      order.paymentStatus === "pending"
    ) {
      return <Badge variant="destructive">COD - Pending</Badge>;
    }
    return (
      <Badge variant="outline" className="bg-green-50">
        Paid
      </Badge>
    );
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedOrder(null);
    fetchOrders(true);
  };

  // Calculate stats
  const stats = {
    assigned: orders.filter((o) => o.status === "ready_for_delivery").length,
    delivering: orders.filter((o) => o.status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    collections: orders.filter((o) => o.cashCollected && !o.paymentReceivedBy)
      .length,
    pendingSubmission: orders.filter(
      (o) =>
        o.cashCollected &&
        (!o.cashSubmittedToAccounts || o.cashSubmissionStatus === "rejected")
    ).length,
    totalCashCollected: orders
      .filter((o) => o.cashCollected && !o.paymentReceivedBy)
      .reduce((sum, o) => sum + (o.cashCollectedAmount || o.totalPrice), 0),
  };

  const displayedOrders =
    itemsPerPage === 0 ? filteredOrders : filteredOrders.slice(0, itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned
            </CardTitle>
            <Package className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivering
            </CardTitle>
            <Truck className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivering}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out for delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collections
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${stats.totalCashCollected.toFixed(2)} total
            </p>
            {stats.pendingSubmission > 0 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                {stats.pendingSubmission} pending submission
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>My Deliveries</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="0">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assigned">
                Assigned ({stats.assigned})
              </TabsTrigger>
              <TabsTrigger value="delivering">
                Delivering ({stats.delivering})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Delivered ({stats.delivered})
              </TabsTrigger>
              <TabsTrigger value="collections">
                Collections ({stats.collections})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {displayedOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No orders found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Orders will appear here when assigned to you"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedOrders.map((order) => (
                          <TableRow
                            key={order._id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {order.customerName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-1 max-w-[200px]">
                                <MapPin className="w-3 h-3 mt-1 shrink-0 text-muted-foreground" />
                                <div className="text-sm">
                                  {order.shippingAddress?.street},{" "}
                                  {order.shippingAddress?.city}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ${order.totalPrice.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.products.length} items
                              </div>
                            </TableCell>
                            <TableCell>{getPaymentBadge(order)}</TableCell>
                            <TableCell>
                              {getStatusBadge(order.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {format(
                                  new Date(
                                    order.dispatchedAt || order.orderDate
                                  ),
                                  "MMM d"
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderClick(order);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {displayedOrders.map((order) => (
                      <Card key={order._id} className="hover:bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold">
                                  {order.orderNumber}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order.customerName}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">
                                  ${order.totalPrice.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.products.length} items
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div>
                                {order.shippingAddress?.street},{" "}
                                {order.shippingAddress?.city}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex gap-2 flex-wrap">
                                {getStatusBadge(order.status)}
                                {getPaymentBadge(order)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(
                                  new Date(
                                    order.dispatchedAt || order.orderDate
                                  ),
                                  "MMM d"
                                )}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleOrderClick(order)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {itemsPerPage > 0 && filteredOrders.length > itemsPerPage && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing {displayedOrders.length} of{" "}
                      {filteredOrders.length} orders
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Details Sheet */}
      {selectedOrder && (
        <DeliveryOrderSheet
          order={selectedOrder}
          open={sheetOpen}
          onClose={handleSheetClose}
        />
      )}
    </div>
  );
}
