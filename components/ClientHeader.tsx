"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import Container from "./Container";
import HeaderMenu from "./layout/HeaderMenu";
import ProductsMegaMenu from "./layout/ProductsMegaMenu";
import Logo from "./common/Logo";
import CartIcon from "./cart/CartIcon";
import MobileMenu from "./layout/MobileMenu";
import SearchBar from "./common/SearchBar";
import FavoriteButton from "./FavoriteButton";
import NotificationBell from "./NotificationBell";
import UserDropdown from "./UserDropdown";
import { useRouter, useSearchParams } from "next/navigation";
import { Store } from "lucide-react";
import TopHeaderBadge from "./TopHeaderBadge";

const ClientHeader = () => {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVendor, setIsVendor] = useState(false);
  const isSignedIn = !!user && !loading;

  // Track when component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll behavior to show/hide header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide header when scrolling down and past threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Handle redirect after successful login
  useEffect(() => {
    if (isSignedIn && user && isMounted && typeof window !== "undefined") {
      const redirectTo = searchParams.get("redirectTo");
      if (redirectTo) {
        // Clean up the URL and redirect
        const cleanUrl = decodeURIComponent(redirectTo);
        router.push(cleanUrl);
        // Remove the redirectTo param from current URL
        const currentPath = window.location.pathname;
        router.replace(currentPath);
      }
    }
  }, [isSignedIn, user, searchParams, router, isMounted]);

  // Check vendor status
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) return;

      try {
        const statusResponse = await fetch("/api/user/status");
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsVendor(
            statusData.userProfile?.isVendor &&
              statusData.userProfile?.vendorStatus === "active",
          );
        }
      } catch (error) {
        console.error("Error checking vendor status:", error);
      }
    };

    checkVendorStatus();
  }, [user]);

  const getSignUpUrl = () => {
    if (!isMounted || typeof window === "undefined") return "/sign-up";
    const currentPath = window.location.pathname + window.location.search;
    return `/sign-up?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  const getSignInUrl = () => {
    if (!isMounted || typeof window === "undefined") return "/sign-in";
    const currentPath = window.location.pathname + window.location.search;
    return `/sign-in?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  const purchaseUrl =
    process.env.NEXT_PUBLIC_PURCHASE_CODE_URL ||
    "https://buymeacoffee.com/reactbd/e/484104";

  return (
    <header
      className={`sticky top-0 z-40 bg-gofarm-white/95 backdrop-blur-md border-b border-gofarm-light-gray shadow-sm transition-transform duration-500 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Purchase Badge */}
      <TopHeaderBadge purchaseUrl={purchaseUrl} />

      {/* Top Header */}
      <div className="border-b border-gofarm-light-gray">
        <Container>
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6 py-3 lg:py-4">
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <Logo />
            </div>

            {/* Products dropdown — visible on md+; mobile gets it through MobileMenu */}
            <div className="hidden md:flex items-center shrink-0">
              <ProductsMegaMenu />
            </div>

            {/* Center: Search Bar — fills all remaining horizontal space */}
            <div className="flex-1 min-w-0 flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <SearchBar />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-4">
                <CartIcon />
                <FavoriteButton />
                <NotificationBell />

                {loading ? (
                  <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl border border-gray-200 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3.5 w-16 bg-gray-200 rounded" />
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                    </div>
                  </div>
                ) : (
                  <>
                    {user ? (
                      <>
                        <UserDropdown />
                        {isVendor && (
                          <Link
                            href="/vendor/dashboard"
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-lg transition-all duration-200 group"
                          >
                            <Store className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                            <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                              Vendor
                            </span>
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Link
                          href={getSignInUrl()}
                          className="bg-transparent border border-gofarm-green hover:bg-gofarm-green text-gofarm-green hover:text-gofarm-white px-3 py-1.5 rounded text-sm font-semibold hoverEffect cursor-pointer"
                        >
                          Sign In
                        </Link>
                        <Link
                          href={getSignUpUrl()}
                          className="bg-gofarm-green border border-gofarm-green hover:bg-transparent text-gofarm-white hover:text-gofarm-green px-3 py-1.5 rounded text-sm font-semibold hoverEffect"
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tablet Actions */}
              <div className="hidden md:flex lg:hidden items-center gap-2">
                <CartIcon />
                <FavoriteButton />
                <NotificationBell />

                {loading ? (
                  <div className="flex items-center gap-2 py-2 px-2.5 rounded-xl border border-gray-200 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                  </div>
                ) : (
                  <>
                    {user ? (
                      <>
                        <UserDropdown />
                        {isVendor && (
                          <Link
                            href="/vendor/dashboard"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all duration-200"
                          >
                            <Store className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              Vendor
                            </span>
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link
                          href={getSignInUrl()}
                          className="text-sm font-semibold text-gofarm-gray hover:text-gofarm-light-green hoverEffect cursor-pointer"
                        >
                          Sign In
                        </Link>
                        <Link
                          href={getSignUpUrl()}
                          className="bg-gofarm-green hover:bg-gofarm-light-green text-gofarm-white px-3 py-1.5 rounded text-sm font-semibold hoverEffect"
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile Actions — intentionally minimal: cart + account live in the sidebar. */}
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Header Menu */}
      <div className="bg-gofarm-white">
        <Container>
          <div className="flex items-center justify-between py-2 lg:py-3">
            {/* Left: Mobile Menu Button (visible on mobile) */}
            <div className="flex md:hidden items-center">
              <MobileMenu />
            </div>

            {/* Center/Left: Navigation Menu */}
            <div className="flex">
              <HeaderMenu />
            </div>

            {/* Right: Help Link */}
            <div className="flex items-center gap-2">
              <Link
                href="/help"
                className="text-sm font-medium text-gofarm-gray hover:text-gofarm-light-green hoverEffect whitespace-nowrap"
              >
                Need Help?
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
};

export default ClientHeader;
