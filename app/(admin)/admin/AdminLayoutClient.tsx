"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Container from "@/components/Container";
import AdminTopNavigation from "@/components/admin/AdminTopNavigation";
import Header from "@/components/Header";
import FooterClient from "@/components/FooterClient";
import type { Role } from "@/lib/auth/roles";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  /**
   * Role resolved server-side from the verified session cookie. This is
   * the source of truth — there is no client-side `/api/auth/role`
   * round-trip and no flash through `access-denied` for legitimate admins.
   */
  role: Role;
}

/**
 * Client shell for the (admin) route group.
 *
 * The parent server layout has already enforced authentication (redirecting
 * unauthenticated visitors to /sign-in). This component only decides
 * whether to render the full admin chrome or the access-denied page.
 */
export default function AdminLayoutClient({
  children,
  role,
}: AdminLayoutClientProps) {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const isAccessDeniedPage = pathname === "/admin/access-denied";
  const isAdmin = role === "admin";

  // Non-admins land on the access-denied page. Server-side actions still
  // re-check `requireRole("admin")`, so this redirect is purely UX.
  React.useEffect(() => {
    if (!isAdmin && !isAccessDeniedPage) {
      router.replace("/admin/access-denied");
    }
  }, [isAdmin, isAccessDeniedPage, router]);

  if (!isAdmin && isAccessDeniedPage) {
    return (
      <div className="min-h-screen">
        <Header />
        {children}
        <FooterClient />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Container className="py-6">
        <div className="flex flex-col gap-6">
          <AdminTopNavigation currentPath={pathname} user={user} />
          <div className="admin-content-push bg-white rounded-2xl shadow-xl border border-gofarm-light-green/10 overflow-hidden">
            {children}
          </div>
        </div>
      </Container>
      <FooterClient />
    </div>
  );
}
