"use client";

import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VendorBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function VendorBadge({
  size = "sm",
  className = "",
}: VendorBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Badge
      className={`bg-linear-to-r from-gofarm-green to-emerald-600 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-shadow ${sizeClasses[size]} ${className}`}
    >
      <Store className={`${iconSizes[size]} mr-1`} />
      Vendor
    </Badge>
  );
}
