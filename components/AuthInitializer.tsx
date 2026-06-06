"use client";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useUserDataStore } from "../stores/userDataStore";

export default function AuthInitializer() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const fetchUserData = useUserDataStore((state) => state.fetchUserData);
  const resetUserData = useUserDataStore((state) => state.resetUserData);

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  // Fetch user data when user is authenticated
  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchUserData(user.uid);
      } else {
        resetUserData();
      }
    }
  }, [user, loading, fetchUserData, resetUserData]);

  return null;
}
