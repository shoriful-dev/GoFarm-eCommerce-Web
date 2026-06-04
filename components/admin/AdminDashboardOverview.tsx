"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardOverviewSkeleton } from "@/components/admin/SkeletonLoaders";
import Link from "next/link";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
  productsChange: number;
}

const AdminDashboardOverview = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);

      const statsResponse = await fetch("/api/admin/stats");

      if (!statsResponse.ok) {
        throw new Error(`HTTP error! stats: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();

      if (statsData.error) {
        throw new Error(statsData.error);
      }

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch stats",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      format: "currency",
      color: "from-green-500 to-emerald-600",
      href: "/admin/analytics",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || 0,
      icon: ShoppingCart,
      format: "number",
      color: "from-blue-500 to-cyan-600",
      href: "/admin/orders",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.usersChange || 0,
      icon: Users,
      format: "number",
      color: "from-purple-500 to-pink-600",
      href: "/admin/users",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      change: stats?.productsChange || 0,
      icon: Package,
      format: "number",
      color: "from-orange-500 to-red-600",
      href: "/admin/products",
    },
  ];

  const quickActions = [
    {
      title: "View Analytics",
      description: "Detailed business insights",
      icon: TrendingUp,
      href: "/admin/analytics",
      color: "from-gofarm-light-green to-gofarm-green",
    },
    {
      title: "Vendor Requests",
      description: "Review vendor applications",
      icon: UserCheck,
      href: "/admin/vendor-requests",
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Manage Orders",
      description: "Process and track orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "from-gofarm-light-green to-gofarm-green",
    },
    {
      title: "User Management",
      description: "View and manage customers",
      icon: Users,
      href: "/admin/users",
      color: "from-gofarm-orange to-gofarm-light-orange",
    },
    {
      title: "Product Catalog",
      description: "Manage inventory",
      icon: Package,
      href: "/admin/products",
      color: "from-gofarm-light-orange to-gofarm-orange",
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return <DashboardOverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error}</p>
            <Button
              onClick={fetchStats}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="md:text-3xl font-bold text-gofarm-black flex items-center gap-3">
            <Activity className="w-8 h-8 text-gofarm-light-green" />
            Dashboard Overview
          </h1>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-gofarm-gray text-sm md:text-lg">
          Monitor your business performance at a glance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={stat.href}>
                <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-gofarm-light-green/20 hover:border-gofarm-light-green/40 overflow-hidden">
                  <div className={`h-1 bg-linear-to-r ${stat.color}`}></div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gofarm-gray flex items-center justify-between">
                      {stat.title}
                      <Icon className="w-4 h-4" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-gofarm-black">
                      {formatValue(stat.value, stat.format)}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <Badge
                        variant={isPositive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isPositive ? "+" : ""}
                        {stat.change}%
                      </Badge>
                      <span className="text-xs text-gofarm-gray">
                        vs last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Vendor Requests Summary */}
      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gofarm-black mb-2">
            Quick Actions
          </h2>
          <p className="text-gofarm-gray">Navigate to key admin sections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-gofarm-light-green/20 hover:border-gofarm-light-green/40 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 rounded-xl bg-linear-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {action.badge && action.badge > 0 && (
                            <Badge variant="destructive" className="bg-red-500">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gofarm-black group-hover:text-gofarm-green transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gofarm-gray">
                            {action.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start p-0 h-auto text-gofarm-light-green hover:text-gofarm-green"
                        >
                          Access →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="border-gofarm-light-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gofarm-light-green" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gofarm-gray">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Recent business activities will appear here</p>
            <p className="text-sm">
              Check individual sections for detailed information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardOverview;
