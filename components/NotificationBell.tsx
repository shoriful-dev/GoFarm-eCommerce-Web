"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useUserDataStore } from "@/stores/userDataStore";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const { user } = useAuthStore();
  const unreadNotifications = useUserDataStore(
    (state) => state.unreadNotifications,
  );

  if (!user) {
    return null;
  }

  const displayCount = unreadNotifications > 9 ? "9+" : unreadNotifications;

  return (
    <Link
      href="/user/notifications"
      className="relative inline-block group cursor-pointer"
      aria-label="Open notifications"
    >
      <Bell className="group-hover:text-gofarm-light-green hoverEffect" />
      <span
        className={`absolute -top-1 -right-1 bg-gofarm-green text-white rounded-full text-xs font-semibold flex items-center justify-center min-w-3.5 h-3.5 ${
          unreadNotifications > 9 ? "px-1" : ""
        }`}
      >
        {unreadNotifications > 0 ? displayCount : 0}
      </span>
    </Link>
  );
}
