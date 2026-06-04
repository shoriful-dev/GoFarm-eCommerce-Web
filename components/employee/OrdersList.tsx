"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";
import { getOrdersForEmployee } from "@/actions/orderEmployeeActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  Package,
  RefreshCw,
  Eye,
  CheckCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import OrderDetailSheet from "./OrderDetailSheet";

interface OrdersListProps {
  employee: Employee;
}

interface Order {
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
  address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  products: Array<{
    quantity: number;
    product: {
      _id: string;
      name: string;
      price: number;
      image?: string;
    };
  }>;
  addressConfirmedBy?: string;
  addressConfirmedAt?: string;
  orderConfirmedBy?: string;
  orderConfirmedAt?: string;
  packedBy?: string;
  packedAt?: string;
  assignedDeliverymanId?: string;
  assignedDeliverymanName?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  cashCollected?: boolean;
  cashCollectedAmount?: number;
  paymentReceivedBy?: string;
  paymentReceivedAt?: string;
}

export default function OrdersList({ employee }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const loadOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsRefreshing(true);
      }
      const data = await getOrdersForEmployee();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      if (showLoader) {
        setIsRefreshing(false);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(false); // Don't show loader on initial load
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Tab filter (Pending = not confirmed, Confirmed = confirmed)
    if (activeTab === "pending") {
      filtered = filtered.filter((order) => !order.orderConfirmedBy);
    } else if (activeTab === "confirmed") {
      filtered = filtered.filter((order) => !!order.orderConfirmedBy);
    }

    // Search filter
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

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, orders, activeTab]);

  const handleRefresh = async () => {
    await loadOrders(true); // Show loader when manually refreshing
  };

  const handleOrderUpdate = async (
    shouldSwitchToConfirmed = false,
    shouldCloseSheet = false
  ) => {
    const currentOrderId = selectedOrder?._id;

    // First, load the latest orders
    await loadOrders(true);

    // Then perform UI updates after data is loaded
    if (shouldCloseSheet) {
      setSelectedOrder(null); // Only close the sheet when order is confirmed
    } else if (currentOrderId) {
      // Keep the sheet open but update the selected order with fresh data
      // We'll update this in the next effect after orders are loaded
    }

    // Switch to confirmed tab AFTER orders are loaded
    if (shouldSwitchToConfirmed) {
      // Use setTimeout to ensure state updates after orders are processed
      setTimeout(() => {
        setActiveTab("confirmed");
      }, 100);
    }
  };

  // Update selected order when orders change (to reflect latest data in sidebar)
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updatedOrder = orders.find((o) => o._id === selectedOrder._id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  const getPriorityBadge = (order: Order) => {
    // Show priority for orders that need action
    if (employee.role === "callcenter") {
      if (!order.addressConfirmedBy) {
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <MapPin className="w-3 h-3" />
            Address Pending
          </Badge>
        );
      }
      if (!order.orderConfirmedBy) {
        return (
          <Badge variant="default" className="gap-1 bg-blue-600 text-xs">
            <CheckCircle className="w-3 h-3" />
            Needs Confirmation
          </Badge>
        );
      }
    }
    return null;
  };

  // Count orders by tab
  const pendingCount = orders.filter((order) => !order.orderConfirmedBy).length;
  const confirmedCount = orders.filter(
    (order) => !!order.orderConfirmedBy
  ).length;

  // Pagination
  const totalPages =
    perPage === -1 ? 1 : Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders =
    perPage === -1
      ? filteredOrders
      : filteredOrders.slice(
          (currentPage - 1) * perPage,
          currentPage * perPage
        );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (value: string) => {
    const newPerPage = value === "all" ? -1 : parseInt(value);
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Orders Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-48" />
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Orders Management
            </CardTitle>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="out_for_delivery">
                  Out for Delivery
                </SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for Pending/Confirmed */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirmed ({confirmedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {isRefreshing ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <OrdersTable
                    orders={paginatedOrders}
                    employee={employee}
                    onViewOrder={setSelectedOrder}
                    getStatusColor={getStatusColor}
                    getPaymentStatusColor={getPaymentStatusColor}
                    getPriorityBadge={getPriorityBadge}
                  />

                  {/* Pagination Controls */}
                  {filteredOrders.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Showing{" "}
                          {perPage === -1
                            ? filteredOrders.length
                            : Math.min(
                                (currentPage - 1) * perPage + 1,
                                filteredOrders.length
                              )}{" "}
                          to{" "}
                          {perPage === -1
                            ? filteredOrders.length
                            : Math.min(
                                currentPage * perPage,
                                filteredOrders.length
                              )}{" "}
                          of {filteredOrders.length} orders
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Per page:
                        </span>
                        <Select
                          value={perPage === -1 ? "all" : perPage.toString()}
                          onValueChange={handlePerPageChange}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {perPage !== -1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }

                                return (
                                  <Button
                                    key={pageNum}
                                    variant={
                                      currentPage === pageNum
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className="w-9"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              }
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="mt-4">
              {isRefreshing ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <OrdersTable
                    orders={paginatedOrders}
                    employee={employee}
                    onViewOrder={setSelectedOrder}
                    getStatusColor={getStatusColor}
                    getPaymentStatusColor={getPaymentStatusColor}
                    getPriorityBadge={getPriorityBadge}
                  />

                  {/* Pagination Controls */}
                  {filteredOrders.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Showing{" "}
                          {perPage === -1
                            ? filteredOrders.length
                            : Math.min(
                                (currentPage - 1) * perPage + 1,
                                filteredOrders.length
                              )}{" "}
                          to{" "}
                          {perPage === -1
                            ? filteredOrders.length
                            : Math.min(
                                currentPage * perPage,
                                filteredOrders.length
                              )}{" "}
                          of {filteredOrders.length} orders
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Per page:
                        </span>
                        <Select
                          value={perPage === -1 ? "all" : perPage.toString()}
                          onValueChange={handlePerPageChange}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {perPage !== -1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }

                                return (
                                  <Button
                                    key={pageNum}
                                    variant={
                                      currentPage === pageNum
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className="w-9"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              }
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        employee={employee}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdate={handleOrderUpdate}
      />
    </>
  );
}

// Table component for displaying orders
interface OrdersTableProps {
  orders: Order[];
  employee: Employee;
  onViewOrder: (order: Order) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getPriorityBadge: (order: Order) => React.ReactNode;
}

function OrdersTable({
  orders,
  employee,
  onViewOrder,
  getStatusColor,
  getPaymentStatusColor,
  getPriorityBadge,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  #{order.orderNumber.slice(-6)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(order.orderDate), "MMM dd, yyyy")}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(order.orderDate), "HH:mm")}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {order.products.length} item
                  {order.products.length !== 1 ? "s" : ""}
                </TableCell>
                <TableCell className="font-semibold">
                  {order.currency} {order.totalPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => onViewOrder(order)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 p-3">
        {orders.map((order) => (
          <Card key={order._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">#{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.email}
                    </div>
                  </div>
                  <Button
                    onClick={() => onViewOrder(order)}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {format(new Date(order.orderDate), "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span>
                    {order.products.length} item
                    {order.products.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">
                    {order.currency} {order.totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                  {employee.role === "callcenter" && getPriorityBadge(order)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
