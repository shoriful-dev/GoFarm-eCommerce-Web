import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  AlertCircle,
  Package,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - Employee Portal",
  description: "Overview of all employee operations",
};

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/");
  }

  // Only incharge can access
  if (employee.role !== "incharge") {
    redirect("/employee");
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="bg-linear-to-r from-gofarm-green to-gofarm-light-green rounded-xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {employee?.firstName || "Incharge"}
            </h1>
            <p className="text-green-50 text-sm sm:text-base">
              Here's what's happening with your team today
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <Activity className="w-5 h-5" />
            <div>
              <p className="text-xs font-medium text-green-50">Status</p>
              <p className="text-sm font-bold">All Systems Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Total Orders</span>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold text-gofarm-black">
                0
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                All time orders
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Active Employees</span>
              <div className="bg-green-50 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold text-gofarm-black">
                0
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Currently active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Performance</span>
              <div className="bg-purple-50 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold text-gofarm-black">
                -
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                This month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Pending Tasks</span>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-bold text-gofarm-black">
                0
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Awaiting action
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gofarm-black">0</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-0"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Processing
                </p>
                <p className="text-2xl font-bold text-gofarm-black">0</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-0"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cancelled
                </p>
                <p className="text-2xl font-bold text-gofarm-black">0</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-0"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Analytics Card - Takes 2 columns on xl screens */}
        <Card className="xl:col-span-2 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b bg-linear-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <div className="bg-gofarm-green/10 p-2 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-gofarm-green" />
              </div>
              Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-16 sm:py-20">
              <div className="bg-linear-to-br from-gofarm-green/5 to-gofarm-light-green/5 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gofarm-green/50" />
              </div>
              <p className="font-semibold text-lg sm:text-xl mb-2 text-gofarm-black">
                Analytics Coming Soon
              </p>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                Comprehensive analytics, charts, and performance reports will be
                available here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b bg-linear-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white hover:shadow-lg transition-all duration-200 flex items-center gap-3">
                <Package className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">View Orders</p>
                  <p className="text-xs text-green-50">Manage all orders</p>
                </div>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg bg-white border-2 border-gofarm-green/20 hover:border-gofarm-green hover:shadow-md transition-all duration-200 flex items-center gap-3">
                <Users className="w-5 h-5 text-gofarm-green" />
                <div>
                  <p className="font-medium text-sm text-gofarm-black">
                    Team Management
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View employees
                  </p>
                </div>
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg bg-white border-2 border-gofarm-green/20 hover:border-gofarm-green hover:shadow-md transition-all duration-200 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-gofarm-green" />
                <div>
                  <p className="font-medium text-sm text-gofarm-black">
                    Reports
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generate reports
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b bg-linear-to-r from-gray-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
            <p className="font-medium mb-1">No recent activity</p>
            <p className="text-sm">Activity logs will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
