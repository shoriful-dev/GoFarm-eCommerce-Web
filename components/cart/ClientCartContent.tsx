"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ServerCartContent } from "./ServerCartContent";
import { CartSkeleton } from "./CartSkeleton";
import { trackCartView } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface Address {
  _id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  default: boolean;
  createdAt: string;
}

interface UserOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  currency: string;
  status: string;
  orderDate: string;
  customerName: string;
  email: string;
}

interface UserData {
  addresses: Address[];
  orders: UserOrder[];
}

export function ClientCartContent() {
  const { user, loading: authLoading } = useAuthStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      // No user - just finish loading, cart will work without auth
      setLoading(false);
      return;
    }

    const userEmail = user.email;
    if (!userEmail) {
      setError("Email not found. Please contact support.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user data from API endpoint
      const response = await fetch(
        `/api/user-data?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        // Silently handle errors for unauthenticated users
        if (response.status === 401) {
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  const refreshAddresses = async () => {
    if (!user?.email) return;

    try {
      // Only fetch addresses to refresh them
      const response = await fetch(
        `/api/user-data?email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        throw new Error("Failed to refresh addresses");
      }

      const data = await response.json();
      setUserData((prev) =>
        prev ? { ...prev, addresses: data.addresses } : data
      );
    } catch (err) {
      console.error("Failed to refresh addresses:", err);
      // Don't show error toast for refresh failures
    }
  };

  useEffect(() => {
    fetchUserData();
    // Track cart view
    if (user) {
      trackCartView(user.uid);
    }
  }, [user, fetchUserData]);

  if (authLoading || loading) {
    return <CartSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-4">
              <ShoppingCart className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gofarm-black mb-2">
                Error Loading Cart
              </h2>
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  fetchUserData();
                }}
                className="bg-gofarm-green hover:bg-gofarm-light-green"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Allow cart to work without authentication
  // User can browse cart, but needs to log in for checkout
  const userEmail = user?.email || "";

  return (
    <ServerCartContent
      userEmail={userEmail}
      userAddresses={userData?.addresses || []}
      userOrders={userData?.orders || []}
      onAddressesRefresh={refreshAddresses}
      isAuthenticated={!!user}
    />
  );
}
