"use client";

import { useAuthStore } from "@/stores/authStore";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  User,
  Bell,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Container from "@/components/Container";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: LayoutDashboard,
    description: "Overview & stats",
  },
  {
    title: "Orders",
    href: "/user/orders",
    icon: Package,
    description: "Track your orders",
  },
  {
    title: "Profile",
    href: "/user/profile",
    icon: User,
    description: "Personal information",
  },
  {
    title: "Notifications",
    href: "/user/notifications",
    icon: Bell,
    description: "Updates & alerts",
  },
  {
    title: "Wishlist",
    href: "/wishlist",
    icon: Heart,
    description: "Saved items",
  },
  {
    title: "Settings",
    href: "/user/settings",
    icon: Settings,
    description: "Account preferences",
  },
];

const adminItems = [
  {
    title: "Manage Users",
    href: "/user/admin/manage-users",
    icon: Users,
    description: "User premium status",
  },
  {
    title: "Premium Accounts",
    href: "/user/admin/premium-accounts",
    icon: Shield,
    description: "Premium approvals",
  },
  {
    title: "Business Accounts",
    href: "/user/admin/business-accounts",
    icon: Building2,
    description: "Business approvals",
  },
];

interface UserLayoutClientProps {
  user: {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
  };
  children: React.ReactNode;
}

export function UserLayoutClient({ user, children }: UserLayoutClientProps) {
  const logout = useAuthStore((state) => state.logout);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen py-5 bg-linear-to-br from-gray-50 via-white to-gofarm-light-orange/20">
      <Container className="py-6">
        <div className="flex flex-col gap-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gofarm-light-green/10">
              <div className="flex items-center space-x-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gofarm-light-green/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gofarm-light-green/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-gofarm-green" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {user?.displayName || "User"}
                  </h2>
                  <p className="text-sm text-gray-500">User Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Desktop Top Navigation */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden">
              {/* User Profile Header */}
              <div className="p-6 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-bold text-lg text-white">
                        {user?.displayName || "User"}
                      </h2>
                      <p className="text-white/80 text-sm">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-white/90 text-sm">Active</span>
                    </div>
                    <Button
                      onClick={logout}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 border border-white/30"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              {/* Horizontal Navigation */}
              <nav className="p-6">
                <div className="flex flex-wrap gap-3">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group border",
                          isActive
                            ? "bg-gofarm-light-green/10 border-gofarm-light-green/30 shadow-sm"
                            : "hover:bg-gray-50 border-gray-200 hover:border-gofarm-light-green/30"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-gofarm-light-green text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gofarm-light-green/20 group-hover:text-gofarm-green"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isActive ? "text-gofarm-green" : "text-gray-900"
                            )}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Admin Section - Show for dev.reactbd@gmail.com */}
                  {user?.email === "dev.reactbd@gmail.com" && (
                    <>
                      <div className="w-full border-t border-gray-200 my-3"></div>
                      <div className="w-full text-xs text-gray-500 mb-2 px-2">
                        Admin Tools
                      </div>
                      {adminItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group border",
                              isActive
                                ? "bg-red-50 border-red-200 shadow-sm"
                                : "hover:bg-red-50 border-gray-200 hover:border-red-200"
                            )}
                          >
                            <div
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                isActive
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-red-600"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div
                                className={cn(
                                  "font-medium text-sm",
                                  isActive ? "text-red-700" : "text-gray-900"
                                )}
                              >
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>

          {/* Mobile Sidebar */}
          <div className={cn("lg:hidden", sidebarOpen ? "block" : "hidden")}>
            <div className="bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden">
              {/* User Profile Section */}
              <div className="p-6 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white">
                <div className="flex items-center space-x-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      className="w-16 h-16 rounded-full object-cover border-3 border-white/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-white">
                      {user?.displayName || "User"}
                    </h2>
                    <p className="text-white/80 text-sm">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-white/90 text-xs">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="p-4 space-y-2">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-gofarm-light-green/10 border border-gofarm-light-green/30 shadow-sm"
                          : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-gofarm-light-green text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gofarm-light-green/20 group-hover:text-gofarm-green"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              "font-medium",
                              isActive ? "text-gofarm-green" : "text-gray-900"
                            )}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-gofarm-green" : "text-gray-400"
                        )}
                      />
                    </Link>
                  );
                })}

                {/* Admin Section - Mobile */}
                {user?.email === "dev.reactbd@gmail.com" && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="text-xs text-gray-500 mb-3 px-4">
                        Admin Tools
                      </div>
                      {adminItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl transition-all duration-200 group",
                              isActive
                                ? "bg-red-50 border border-red-200 shadow-sm"
                                : "hover:bg-red-50 border border-transparent"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isActive
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-red-600"
                                )}
                              >
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div
                                  className={cn(
                                    "font-medium text-sm",
                                    isActive ? "text-red-700" : "text-gray-900"
                                  )}
                                >
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? "text-red-600" : "text-gray-400"
                              )}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </nav>

              {/* Mobile Sign Out Button */}
              <div className="p-4 border-t border-gray-100">
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden">
              <div className="p-6 lg:p-8">{children}</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
