"use client";

import {
  X,
  Home,
  ShoppingBag,
  BookOpen,
  Flame,
  User,
  ShoppingCart,
  Heart,
  Package,
  Tag,
  Phone,
  HelpCircle,
  Info,
  Grid3X3,
  ChevronRight,
  LogIn,
  UserPlus,
  Bell,
  Sparkles,
  Shield,
  Store,
  Briefcase,
  LayoutDashboard,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import useStore from "@/store";
import { useUserDataStore } from "@/stores/userDataStore";
import { useIsAdmin } from "@/lib/adminUtils";
import Logo from "../common/Logo";
import SocialMedia from "../common/SocialMedia";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: typeof Home;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { items, favoriteProduct } = useStore();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const isAdminFromProfile = useUserDataStore((s) => s.isAdmin);
  const isVendor = useUserDataStore((s) => s.isVendor);
  const isEmployee = useUserDataStore((s) => s.isEmployee);
  const isAdminFromHook = useIsAdmin(user?.email, user?.uid);
  const isAdmin = isAdminFromHook || isAdminFromProfile;

  useEffect(() => setMounted(true), []);

  const accountHref = isAdmin
    ? "/admin"
    : isVendor
      ? "/vendor/dashboard"
      : isEmployee
        ? "/employee/dashboard"
        : "/user/dashboard";
  const accountLabel = isAdmin
    ? "Admin Dashboard"
    : isVendor
      ? "Vendor Dashboard"
      : isEmployee
        ? "Employee Workspace"
        : "My Dashboard";

  // Lock body scroll while open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const userMenuItems: MenuItem[] = [
    { title: "My Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { title: "My Orders", href: "/orders", icon: Package },
    { title: "Wishlist", href: "/wishlist", icon: Heart },
    { title: "Shopping Cart", href: "/cart", icon: ShoppingCart },
    { title: "Profile Settings", href: "/account", icon: User },
  ];

  const adminMenuItems: MenuItem[] = [
    { title: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Products", href: "/admin/products", icon: Package },
    { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { title: "Vendor Requests", href: "/admin/vendor-requests", icon: Store },
    { title: "Employees", href: "/admin/employees", icon: Briefcase },
  ];

  const vendorMenuItems: MenuItem[] = [
    {
      title: "Vendor Dashboard",
      href: "/vendor/dashboard",
      icon: LayoutDashboard,
    },
    { title: "My Products", href: "/vendor/products", icon: Package },
    { title: "Orders", href: "/vendor/orders", icon: ShoppingBag },
    { title: "Analytics", href: "/vendor/analytics", icon: Sparkles },
  ];

  const employeeMenuItems: MenuItem[] = [
    {
      title: "Employee Dashboard",
      href: "/employee/dashboard",
      icon: LayoutDashboard,
    },
    { title: "Tasks", href: "/employee", icon: Briefcase },
  ];

  const mainMenuItems: MenuItem[] = [
    { title: "Home", href: "/", icon: Home },
    { title: "Shop", href: "/shop", icon: ShoppingBag },
    { title: "Categories", href: "/category", icon: Grid3X3 },
    { title: "Brands", href: "/brands", icon: Tag },
    { title: "Blog", href: "/blog", icon: BookOpen },
    { title: "Hot Deals", href: "/deal", icon: Flame },
  ];

  const supportMenuItems: MenuItem[] = [
    { title: "Help Center", href: "/help", icon: HelpCircle },
    { title: "Customer Service", href: "/support", icon: Phone },
    { title: "About Us", href: "/about", icon: Info },
  ];

  const renderMenuLink = (item: MenuItem) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.title}
        href={item.href}
        onClick={onClose}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-gofarm-light-green/15 text-gofarm-green"
            : "text-gray-700 hover:bg-gray-50 hover:text-gofarm-green"
        }`}
      >
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${
            active
              ? "bg-gofarm-green text-white"
              : "bg-gray-100 text-gray-600 group-hover:bg-gofarm-light-green/20 group-hover:text-gofarm-green"
          } transition-colors`}
        >
          <Icon size={16} />
        </span>
        <span className="flex-1">{item.title}</span>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-gofarm-green group-hover:translate-x-0.5 transition-all"
        />
      </Link>
    );
  };

  const cartCount = items?.length ?? 0;
  const wishlistCount = favoriteProduct?.length ?? 0;

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-gray-900/45 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            key="sidebar-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.28 }}
            className="fixed inset-y-0 left-0 z-[101] w-[88%] max-w-sm bg-white shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:text-gofarm-green hover:border-gofarm-green/40 hover:bg-gofarm-light-green/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* User Card */}
              <div className="px-5 pt-5">
                {user ? (
                  <Link
                    href={accountHref}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gofarm-light-green/10 to-white hover:border-gofarm-green/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-gofarm-green text-white flex items-center justify-center font-bold uppercase shrink-0">
                      {(user.displayName ?? user.email ?? "U").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.displayName ?? "Welcome back"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] font-semibold text-gofarm-green mt-0.5 truncate">
                        Go to {accountLabel}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-gray-400 shrink-0"
                    />
                  </Link>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gofarm-light-green/10 to-white p-4">
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Sparkles size={16} className="text-gofarm-green" />
                      <p className="text-sm font-semibold">Welcome to GoFarm</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Sign in to access your account, orders, and wishlist.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/sign-in"
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-gofarm-green text-white text-xs font-semibold hover:bg-gofarm-green/90 transition-colors"
                      >
                        <LogIn size={14} />
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-gofarm-green text-gofarm-green text-xs font-semibold hover:bg-gofarm-light-green/10 transition-colors"
                      >
                        <UserPlus size={14} />
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Access */}
              <div className="px-5 pt-5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Quick Access
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    onClick={onClose}
                    href="/cart"
                    className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-white hover:border-gofarm-green/40 hover:bg-gofarm-light-green/5 transition-colors"
                  >
                    <ShoppingCart size={18} className="text-gofarm-green" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      Cart
                    </span>
                    {cartCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-gofarm-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    onClick={onClose}
                    href="/wishlist"
                    className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/50 transition-colors"
                  >
                    <Heart size={18} className="text-pink-500" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    onClick={onClose}
                    href={user ? "/orders" : "/sign-in"}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <Package size={18} className="text-blue-500" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      Orders
                    </span>
                  </Link>
                </div>
              </div>

              {/* Navigation */}
              <div className="px-5 pt-5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Browse
                </h3>
                <nav className="flex flex-col gap-1">
                  {mainMenuItems.map(renderMenuLink)}
                </nav>
              </div>

              {/* My Account */}
              {user && (
                <div className="px-5 pt-5">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    My Account
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {userMenuItems.map(renderMenuLink)}
                  </nav>
                </div>
              )}

              {/* Role-specific quick links */}
              {user && isAdmin && (
                <div className="px-5 pt-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 text-gofarm-green">
                    <Shield size={12} /> Admin
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {adminMenuItems.map(renderMenuLink)}
                  </nav>
                </div>
              )}
              {user && isVendor && !isAdmin && (
                <div className="px-5 pt-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 text-gofarm-green">
                    <Store size={12} /> Vendor
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {vendorMenuItems.map(renderMenuLink)}
                  </nav>
                </div>
              )}
              {user && isEmployee && !isAdmin && (
                <div className="px-5 pt-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 text-gofarm-green">
                    <Briefcase size={12} /> Employee
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {employeeMenuItems.map(renderMenuLink)}
                  </nav>
                </div>
              )}

              {/* Promo */}
              <div className="px-5 pt-5">
                <Link
                  href="/deal"
                  onClick={onClose}
                  className="block rounded-xl bg-gradient-to-br from-gofarm-green to-gofarm-light-green p-4 text-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className="text-amber-300" />
                    <p className="text-sm font-bold">Special Offer</p>
                  </div>
                  <p className="text-xs text-white/90 mb-3">
                    Get 20% off on your first order today.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-gofarm-green px-3 py-1.5 rounded-full">
                    Shop Now
                    <ChevronRight size={12} />
                  </span>
                </Link>
              </div>

              {/* Support */}
              <div className="px-5 pt-5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Support
                </h3>
                <nav className="flex flex-col gap-1">
                  {supportMenuItems.map(renderMenuLink)}
                </nav>
              </div>

              {/* Notifications hint */}
              {user && (
                <div className="px-5 pt-5">
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-gofarm-green/40 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 text-amber-600">
                      <Bell size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Notifications
                      </p>
                      <p className="text-xs text-gray-500">
                        Order updates and offers
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                </div>
              )}

              {/* Social */}
              <div className="px-5 pt-6 pb-6">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Follow Us
                </h3>
                <SocialMedia />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-white px-5 py-3 text-center">
              <p className="text-[11px] text-gray-500">
                © {new Date().getFullYear()} GoFarm. All rights reserved.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Sidebar;
