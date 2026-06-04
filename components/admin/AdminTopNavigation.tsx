"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { User as FirebaseUser } from "firebase/auth";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Shield,
  Bell,
  UserCheck,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronUp,
  Star,
  Mail,
} from "lucide-react";

interface AdminTopNavigationProps {
  currentPath: string;
  user: FirebaseUser | null;
}

const adminRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Vendor Requests",
    icon: UserCheck,
    href: "/admin/vendor-requests",
  },
  {
    label: "Products",
    icon: Package,
    href: "/admin/products",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    label: "Reviews",
    icon: Star,
    href: "/admin/reviews",
  },
  {
    label: "Subscriptions",
    icon: Mail,
    href: "/admin/subscriptions",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
  },
];

const AdminTopNavigation = ({ currentPath, user }: AdminTopNavigationProps) => {
  const logout = useAuthStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMobileMenuToggle = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setMobileMenuOpen(!mobileMenuOpen);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gofarm-light-green/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-linear-to-br from-gofarm-light-green to-gofarm-green rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Admin Panel</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMobileMenuToggle}
            className="p-2 transition-transform duration-200 hover:scale-105"
            disabled={isAnimating}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-200" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Top Navigation */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden">
          {/* Admin Profile Header */}
          <div className="p-6 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-white">Admin Panel</h2>
                  <p className="text-white/80 text-sm">
                    Welcome back, {user?.displayName || user?.email || "Admin"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Admin avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-white/90 text-sm">Online</span>
                  </div>
                </div>
                <Button
                  onClick={() => logout()}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 border border-white/30 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Accordion Toggle Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <Menu className="h-5 w-5 text-gofarm-green" />
                <span className="font-medium text-gray-900">
                  Navigation Menu
                </span>
              </div>
              {desktopMenuOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200" />
              )}
            </Button>
          </div>

          {/* Collapsible Horizontal Navigation */}
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              desktopMenuOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <nav className="px-4 py-3">
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide">
                  {adminRoutes.map((route, index) => {
                    const isActive = currentPath === route.href;
                    const Icon = route.icon;

                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "admin-nav-item flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group border-2 transform whitespace-nowrap shrink-0",
                          isActive
                            ? "active bg-gofarm-light-green/10 border-gofarm-light-green shadow-md"
                            : "hover:bg-gray-50 border-gray-200 hover:border-gofarm-light-green/40",
                        )}
                        style={{
                          animationDelay: desktopMenuOpen
                            ? `${index * 50}ms`
                            : "0ms",
                        }}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md transition-all duration-200",
                            isActive
                              ? "bg-gofarm-light-green text-white shadow-md"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gofarm-light-green/20 group-hover:text-gofarm-green",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div
                          className={cn(
                            "font-medium text-xs transition-colors duration-200",
                            isActive ? "text-gofarm-green" : "text-gray-900",
                          )}
                        >
                          {route.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden mobile-menu-container",
          mobileMenuOpen
            ? "max-h-[800px] opacity-100 mt-2"
            : "max-h-0 opacity-0 mt-0",
        )}
      >
        <div
          className={cn(
            "admin-mobile-menu bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden transform transition-all duration-300 ease-out",
            mobileMenuOpen
              ? "translate-y-0 scale-100"
              : "-translate-y-4 scale-95",
          )}
        >
          {/* Admin Profile Section */}
          <div
            className={cn(
              "p-6 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white transition-all duration-200 delay-75",
              mobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            )}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-white">Admin Panel</h2>
                <p className="text-white/80 text-sm">
                  {user?.displayName || "Admin"}
                </p>
                <p className="text-xs text-white/60">{user?.email}</p>
              </div>
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Admin avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                />
              )}
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <nav
            className={cn(
              "p-6 space-y-2 transition-all duration-300 delay-100",
              mobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0",
            )}
          >
            {adminRoutes.map((route, index) => {
              const isActive = currentPath === route.href;
              const Icon = route.icon;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 300);
                  }}
                  className={cn(
                    "admin-nav-item flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "active bg-linear-to-r from-gofarm-light-green to-gofarm-green text-white shadow-lg"
                      : "hover:bg-gray-50 hover:shadow-md text-gray-900",
                  )}
                  style={{
                    animationDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms",
                  }}
                >
                  <div
                    className={cn(
                      "p-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gofarm-light-green/10 text-gofarm-light-green group-hover:bg-gofarm-light-green/20",
                    )}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "font-semibold text-base transition-colors duration-200",
                        isActive ? "text-white" : "text-gray-900",
                      )}
                    >
                      {route.label}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-sm" />
                  )}
                </Link>
              );
            })}

            {/* Sign Out Button */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAnimating(true);
                  setTimeout(() => {
                    setIsAnimating(false);
                    logout();
                  }, 300);
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="font-medium">Sign Out</span>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminTopNavigation;
