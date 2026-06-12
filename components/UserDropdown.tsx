"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  Package,
  Heart,
  LogOut,
  UserCircle,
  Logs,
  Shield,
  Briefcase,
  Wallet,
  Store,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useUserDataStore } from "../stores/userDataStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { useIsAdmin } from "../lib/adminUtils";
import Image from "next/image";

const UserDropdown = () => {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isEmployeeStatus, setIsEmployeeStatus] = useState(false);
  const [isAdminFromProfile, setIsAdminFromProfile] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ordersCount = useUserDataStore((state) => state.ordersCount);
  const isEmployee = useUserDataStore((state) => state.isEmployee);
  const walletBalance = useUserDataStore((state) => state.walletBalance);
  const isLoadingOrders = useUserDataStore((state) => state.isLoading);
  const refreshUserData = useUserDataStore((state) => state.refreshUserData);

  // Check if user is admin (checks both env var and Sanity isAdmin field)
  const isAdminFromHook = useIsAdmin(user?.email, user?.uid);
  const isAdmin = isAdminFromHook || isAdminFromProfile;

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) return;

      try {
        const statusResponse = await fetch("/api/user/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsVendor(
            statusData.userProfile?.role === "vendor" ||
              (statusData.userProfile?.isVendor &&
                statusData.userProfile?.vendorStatus === "active"),
          );
          // Update employee status from API
          const employeeFromApi = statusData.userProfile?.isEmployee || false;
          setIsEmployeeStatus(employeeFromApi);
          // Admin signal from Sanity profile (role field or legacy isAdmin)
          setIsAdminFromProfile(
            statusData.userProfile?.role === "admin" ||
              statusData.userProfile?.isAdmin === true,
          );
        } else if (statusResponse.status === 401) {
          // Session not ready yet, ignore silently
          return;
        }
      } catch (error) {
        // Silently handle network errors
      }
    };

    checkUserStatus();
  }, [user]);

  // Keep employee status in sync with store updates
  useEffect(() => {
    if (isEmployee) {
      setIsEmployeeStatus(true);
    }
  }, [isEmployee]);

  // Refresh user data when dropdown opens
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && user) {
      // Force refresh user data to get latest employee status
      await refreshUserData(user.uid);

      // Also re-check user status from API
      try {
        const statusResponse = await fetch("/api/user/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsVendor(
            statusData.userProfile?.role === "vendor" ||
              (statusData.userProfile?.isVendor &&
                statusData.userProfile?.vendorStatus === "active"),
          );
          setIsEmployeeStatus(statusData.userProfile?.isEmployee || false);
          setIsAdminFromProfile(
            statusData.userProfile?.role === "admin" ||
              statusData.userProfile?.isAdmin === true,
          );
        }
        // Silently ignore 401 errors
      } catch (error) {
        // Silently handle network errors
      }
    }
  };

  // Handle hover with delay
  const handleMouseEnter = () => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Set a timeout to open the dropdown
    hoverTimeoutRef.current = setTimeout(() => {
      handleOpenChange(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set a timeout to close the dropdown
    leaveTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await logout();
    setOpen(false);
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button className="flex items-center md:gap-2.5 md:py-2 md:px-3 md:rounded-xl md:border md:border-gofarm-green/20 md:hover:border-gofarm-green md:hover:bg-gofarm-green/5 md:hoverEffect md:hover:shadow-sm group transition-all duration-200">
            <div className="relative">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gofarm-green/30 md:group-hover:border-gofarm-green transition-all ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-gofarm-green to-gofarm-light-green flex items-center justify-center shadow-sm">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="hidden md:block absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm ring-1 ring-green-100"></div>
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-semibold text-gofarm-black group-hover:text-gofarm-green transition-colors">
                {user.displayName?.split(" ")[0] || "User"}
              </span>
              <span className="text-xs text-gofarm-gray">My Account</span>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-0 shadow-xl border-gofarm-green/20"
          align="end"
          sideOffset={8}
        >
          {/* Header Section with linear */}
          <div className="p-5 bg-linear-to-br from-gofarm-green to-gofarm-light-green relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 mask-[linear-linear(0deg,transparent,rgba(255,255,255,0.1))]"></div>
            <div className="relative flex items-center gap-3">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg ring-2 ring-white/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                  <UserCircle className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base truncate">
                  {user.displayName || "User"}
                </h3>
                <p className="text-sm text-white/90 truncate">{user.email}</p>
                {(isAdmin || isEmployeeStatus || isVendor) && (
                  <span
                    className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white border border-white/30`}
                  >
                    {isAdmin
                      ? "Admin"
                      : isEmployeeStatus
                        ? "Employee"
                        : "Vendor"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3">
            {/* Role-based quick access — pinned at top so it's always visible */}
            {(isAdmin || isEmployeeStatus || isVendor) && (
              <div className="mb-3 space-y-1.5">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-200 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-bold flex-1">
                        Admin Dashboard
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/vendor-management"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-purple-50 hover:bg-purple-100 transition-all duration-200 group border border-purple-200/60"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Store className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-purple-800 group-hover:text-purple-900 font-semibold flex-1">
                        Vendor Management
                      </span>
                    </Link>
                  </>
                )}
                {isEmployeeStatus && !isAdmin && (
                  <Link
                    href="/employee"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 group shadow-md"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold flex-1">
                      Employee Dashboard
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
                {isVendor && (
                  <Link
                    href="/vendor/dashboard"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 group shadow-md"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold flex-1">
                      Vendor Dashboard
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            )}

            {/* Wallet Balance Card */}
            {walletBalance > 0 && (
              <div className="mb-3 p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-amber-700 block">
                        Wallet Balance
                      </span>
                      <span className="text-xl font-bold text-amber-900">
                        ${walletBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1">
              <Link
                href="/user/profile"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gofarm-green/5 transition-all duration-200 group border border-transparent hover:border-gofarm-green/20"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gofarm-black font-medium group-hover:text-gofarm-green transition-colors flex-1">
                  My Profile
                </span>
              </Link>

              <Link
                href="/user/orders"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gofarm-green/5 transition-all duration-200 group border border-transparent hover:border-gofarm-green/20"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gofarm-black font-medium group-hover:text-gofarm-green transition-colors flex-1">
                  My Orders
                </span>
                {isLoadingOrders ? (
                  <div className="w-4 h-4 border-2 border-gofarm-green border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  ordersCount > 0 && (
                    <span className="bg-gofarm-green text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm">
                      {ordersCount}
                    </span>
                  )
                )}
              </Link>

              <Link
                href="/wishlist"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gofarm-green/5 transition-all duration-200 group border border-transparent hover:border-gofarm-green/20"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                  <Heart className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-gofarm-black font-medium group-hover:text-gofarm-green transition-colors">
                  Wishlist
                </span>
              </Link>

              <Link
                href="/user"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gofarm-green/5 transition-all duration-200 group border border-transparent hover:border-gofarm-green/20"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Logs className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gofarm-black font-medium group-hover:text-gofarm-green transition-colors">
                  Dashboard
                </span>
              </Link>

              <Link
                href="/user/settings"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gofarm-green/5 transition-all duration-200 group border border-transparent hover:border-gofarm-green/20"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gofarm-black font-medium group-hover:text-gofarm-green transition-colors">
                  Settings
                </span>
              </Link>
            </nav>

            {/* Help Link */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Link
                href="/help"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-50 transition-all duration-200 group"
              >
                <svg
                  className="w-4 h-4 text-gray-500 group-hover:text-gofarm-green transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-600 group-hover:text-gofarm-green transition-colors font-medium">
                  Help & Support
                </span>
              </Link>
            </div>
          </div>

          {/* Sign Out Section */}
          <div className="p-3 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 transition-all duration-200 w-full text-left group border border-transparent hover:border-red-200"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-red-600 font-semibold group-hover:text-red-700 transition-colors">
                Sign Out
              </span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default UserDropdown;
