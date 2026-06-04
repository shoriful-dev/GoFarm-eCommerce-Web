"use client";

import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Heart,
  Bell,
  Star,
  TrendingUp,
  Clock,
  ArrowRight,
  User,
  CheckCircle,
  Wallet,
  Store,
  Rocket,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PremiumBadge from "@/components/ui/premium-badge";
import VendorBadge from "@/components/ui/vendor-badge";
import ApplicationSuccessNotification from "@/components/ui/application-success-notification";
import { toast } from "sonner";

interface UserStats {
  ordersCount: number;
  wishlistCount: number;
  notificationsCount: number;
  unreadNotifications: number;
  rewardPoints: number;
  walletBalance: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "order" | "notification" | "wishlist";
}

interface UserProfile {
  _id: string;
  isActive: boolean; // Premium account status
  premiumStatus: "none" | "pending" | "active" | "rejected" | "cancelled";
  vendorStatus?: "none" | "pending" | "active" | "rejected" | "suspended";
  isVendor?: boolean;
  membershipType: string;
  firstName?: string;
  lastName?: string;
  businessApprovedBy?: string;
  businessApprovedAt?: string;
  premiumAppliedAt?: string;
  premiumApprovedBy?: string;
  premiumApprovedAt?: string;
  businessAppliedAt?: string;
  vendorAppliedAt?: string;
  vendorApprovedAt?: string;
  vendorRejectedAt?: string;
  vendorRejectionReason?: string;
  rejectionReason?: string;
}

export default function UserDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<UserStats>({
    ordersCount: 0,
    wishlistCount: 0,
    notificationsCount: 0,
    unreadNotifications: 0,
    rewardPoints: 0,
    walletBalance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] =
    useState<"premium">("premium");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user status first
        const statusResponse = await fetch("/api/user/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setUserExists(statusData.userExists);
          setUserProfile(statusData.userProfile);
        }

        // Fetch user dashboard stats
        const response = await fetch("/api/user/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.stats);
            setRecentActivity(data.recentActivity);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handlePremiumRegister = () => {
    // Show success notification instead of immediate reload
    setNotificationType("premium");
    setShowSuccessNotification(true);
    setUserExists(true);
  };

  const handleCancelApplication = async () => {
    if (!user?.email) {
      toast.error("Unable to get user email");
      return;
    }

    try {
      const response = await fetch("/api/user/cancel-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          applicationType: "premium",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh user profile
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to cancel application");
      }
    } catch (error) {
      console.error("Error cancelling application:", error);
      toast.error("Error cancelling application");
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "notification":
        return <Bell className="h-4 w-4 text-purple-500" />;
      case "wishlist":
        return <Heart className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="animate-pulse">
          <div className="space-y-4 mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back,{" "}
                  {userProfile?.firstName ||
                    user?.displayName ||
                    user?.email?.split("@")[0] ||
                    "User"}
                  !
                </h1>
                {userProfile?.isActive && (
                  <PremiumBadge
                    membershipType={userProfile.membershipType}
                    size="md"
                  />
                )}
                {userProfile?.isVendor && <VendorBadge size="md" />}
              </div>
              <p className="text-gray-600 mt-1">
                Here&apos;s what&apos;s happening with your account today
              </p>
            </div>
          </div>
        </div>
        <Separator className="my-6" />

        {/* Vendor Application Section */}
        {userProfile && !userProfile.isVendor && (
          <>
            {/* Pending Application */}
            {userProfile.vendorStatus === "pending" && (
              <div className="mb-6 p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-blue-900 text-lg">
                        Vendor Application Under Review
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-700 border-blue-300"
                      >
                        Pending
                      </Badge>
                    </div>
                    <p className="text-blue-800 mb-3 text-sm leading-relaxed">
                      Your vendor application is currently being reviewed by our
                      team. We typically process applications within 24-48
                      hours.
                    </p>
                    {userProfile.vendorAppliedAt && (
                      <p className="text-blue-700 text-xs">
                        Applied on:{" "}
                        {new Date(
                          userProfile.vendorAppliedAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Application */}
            {userProfile.vendorStatus === "rejected" && (
              <div className="mb-6 p-6 bg-linear-to-r from-red-50 to-rose-50 border-l-4 border-red-400 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-red-900 text-lg">
                        Vendor Application Not Approved
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-700 border-red-300"
                      >
                        Rejected
                      </Badge>
                    </div>
                    <p className="text-red-800 mb-3 text-sm leading-relaxed">
                      Unfortunately, your vendor application was not approved at
                      this time.
                    </p>
                    {userProfile.vendorRejectionReason && (
                      <div className="bg-red-100/50 p-3 rounded-lg mb-3">
                        <p className="text-red-900 text-sm font-medium mb-1">
                          Reason:
                        </p>
                        <p className="text-red-800 text-sm">
                          {userProfile.vendorRejectionReason}
                        </p>
                      </div>
                    )}
                    {userProfile.vendorRejectedAt && (
                      <p className="text-red-700 text-xs mb-3">
                        Reviewed on:{" "}
                        {new Date(
                          userProfile.vendorRejectedAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    <p className="text-red-700 text-sm">
                      If you believe this was a mistake or would like to discuss
                      your application, please contact our vendor support team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show application form only if no application exists */}
            {(!userProfile.vendorStatus ||
              userProfile.vendorStatus === "none") && (
              <div className="mb-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-14 h-14 bg-linear-to-br from-gofarm-green to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Store className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-green-900 text-xl">
                        🚀 Become a GoFarm Vendor
                      </h3>
                      <div className="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                        NEW OPPORTUNITY
                      </div>
                    </div>
                    <p className="text-green-800 text-base mb-4 leading-relaxed">
                      Start selling your products on GoFarm! Reach thousands of
                      customers, manage your inventory, and grow your business
                      with our powerful vendor platform.
                    </p>
                    <div className="bg-white/70 p-4 rounded-lg border border-green-200 mb-4">
                      <h4 className="font-semibold text-green-900 text-sm mb-3">
                        Vendor Benefits:
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Your own digital storefront
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Unlimited product listings
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Advanced sales analytics
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Priority vendor support
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Zero setup fees
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-green-700 text-sm">
                            Secure payment processing
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/vendor">
                        <Button className="bg-gofarm-green hover:bg-gofarm-green/90 text-white font-semibold px-6 h-11 shadow-lg hover:shadow-xl transition-all">
                          <Rocket className="w-5 h-5 mr-2" />
                          Apply to Become a Vendor
                        </Button>
                      </Link>
                      <Link href="/vendor">
                        <Button
                          variant="outline"
                          className="border-2 border-green-600 text-green-700 hover:bg-green-50 font-medium px-6 h-11"
                        >
                          Learn More About Vendors
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Premium Application Status */}
        {userProfile && userProfile.premiumStatus === "pending" && (
          <div className="mb-6 p-6 bg-linear-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-amber-900 text-lg">
                    🎉 Premium Application Submitted!
                  </h3>
                  <div className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                    PENDING REVIEW
                  </div>
                </div>
                <p className="text-amber-800 text-sm mb-3">
                  Great news! Your premium account application has been
                  successfully submitted and is currently under administrative
                  review.
                </p>
                <div className="bg-white/60 p-3 rounded-md border border-amber-200">
                  <h4 className="font-semibold text-amber-900 text-sm mb-2">
                    What happens next?
                  </h4>
                  <ul className="text-amber-700 text-xs space-y-1">
                    <li>
                      • Our admin team will review your application within 24-48
                      hours
                    </li>
                    <li>
                      • You&apos;ll receive an email notification once your
                      status changes
                    </li>
                    <li>
                      • Upon approval, you&apos;ll unlock premium features
                      immediately
                    </li>
                  </ul>
                </div>
                {userProfile.premiumAppliedAt && (
                  <p className="text-amber-600 text-xs mt-3">
                    Applied on:{" "}
                    {new Date(userProfile.premiumAppliedAt).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {userProfile && userProfile.premiumStatus === "rejected" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900">
                  Premium Application Rejected
                </h3>
                <p className="text-red-700 text-sm">
                  Your premium account application was not approved. You can
                  cancel to apply again.
                </p>
                {userProfile.rejectionReason && (
                  <p className="text-red-600 text-xs mt-1">
                    Reason: {userProfile.rejectionReason}
                  </p>
                )}
              </div>
              <Button
                onClick={handleCancelApplication}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Cancel & Reapply
              </Button>
            </div>
          </div>
        )}

        {/* Premium Account Active Status */}
        {userProfile &&
          userProfile.isActive &&
          userProfile.premiumStatus === "active" && (
            <div className="mb-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-green-900 text-lg">
                      ✨ Premium Account Active!
                    </h3>
                    <div className="px-3 py-1 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                      APPROVED
                    </div>
                  </div>
                  <p className="text-green-800 text-sm mb-3">
                    Congratulations! Your premium account is now active and you
                    have access to all premium features.
                  </p>
                  <div className="bg-white/60 p-3 rounded-md border border-green-200">
                    <h4 className="font-semibold text-green-900 text-sm mb-2">
                      Premium Benefits:
                    </h4>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>• Exclusive access to premium features</li>
                      <li>• Priority customer support</li>
                      <li>• Enhanced rewards and loyalty points</li>
                      <li>• Special discounts and offers</li>
                    </ul>
                  </div>
                  {userProfile.premiumApprovedAt &&
                    userProfile.premiumApprovedBy && (
                      <p className="text-green-600 text-xs mt-3">
                        Approved by {userProfile.premiumApprovedBy} on{" "}
                        {new Date(
                          userProfile.premiumApprovedAt,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.ordersCount}</div>
            <p className="text-xs text-blue-100">Orders placed</p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.notificationsCount}
            </div>
            <p className="text-xs text-purple-100">
              {stats.unreadNotifications} unread
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.wishlistCount}</div>
            <p className="text-xs text-red-100">Items saved</p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
            <Star className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.rewardPoints}</div>
            <p className="text-xs text-green-100">Available points</p>
          </CardContent>
        </Card>

        {stats.walletBalance > 0 && (
          <Card className="bg-linear-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">
                Wallet Balance
              </CardTitle>
              <Wallet className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                ${stats.walletBalance.toFixed(2)}
              </div>
              <p className="text-xs text-emerald-100">From refunds</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content Section with Proper Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/user/notifications">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className="shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    {index < recentActivity.slice(0, 5).length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0 h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </div>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/user/orders">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <Package className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="font-medium">View Orders</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>

              <Link href="/user/notifications">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                >
                  <Bell className="mr-3 h-4 w-4 text-purple-500" />
                  <span className="font-medium">Notifications</span>
                  {stats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                  {stats.unreadNotifications === 0 && (
                    <ArrowRight className="ml-auto h-4 w-4" />
                  )}
                </Button>
              </Link>

              <Link href="/wishlist">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Heart className="mr-3 h-4 w-4 text-red-500" />
                  <span className="font-medium">Wishlist</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>

              <Link href="/user/profile">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-green-500" />
                  <span className="font-medium">Profile Settings</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Success Notification */}
      <ApplicationSuccessNotification
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        type="premium"
      />
    </div>
  );
}
