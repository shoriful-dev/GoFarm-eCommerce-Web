import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthUserId, getCurrentUserRole } from "@/lib/auth/server";
import AdminLayoutClient from "./AdminLayoutClient";

// All admin routes are session-gated; never render statically.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Server layout for the (admin) route group.
 *
 * Per CONTEXT.md §4.4: middleware can only check cookie presence, so the
 * cryptographically-verified role check happens here in a Node-runtime
 * layout. Unauthenticated users are redirected to /sign-in. The resolved
 * role is then passed as a prop to the client shell, eliminating the
 * `/api/auth/role` round-trip and the access-denied flash.
 *
 * Defence in depth: every admin server action *also* calls `requireRole`,
 * so a layout bypass alone cannot mutate data.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const uid = await getAuthUserId();
  if (!uid) {
    redirect("/sign-in?redirectTo=/admin");
  }

  const role = (await getCurrentUserRole()) ?? "user";

  // Server-side enforcement: a non-admin must NEVER see admin chrome or
  // the admin children render tree, even for a frame. Every admin server
  // action also calls `requireRole("admin")` for defence in depth, but
  // doing the redirect here means non-admins never reach those calls.
  // We let `/admin/access-denied` render so the redirect doesn\u2019t loop.
  if (role !== "admin") {
    const hdrs = await headers();
    const pathname = hdrs.get("x-pathname") || "";
    if (pathname !== "/admin/access-denied") {
      redirect("/admin/access-denied");
    }
  }

  return <AdminLayoutClient role={role}>{children}</AdminLayoutClient>;
}
