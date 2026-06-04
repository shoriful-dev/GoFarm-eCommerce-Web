"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw,
  Trash2,
  Briefcase,
  User,
  Shield,
  Pencil,
  Download,
  Upload,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportUsersModal, type ExportScope } from "./ExportUsersModal";
import { UsersSkeleton } from "./SkeletonLoaders";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { UserActionModal } from "./UserActionModal";
import { UserDetailsSidebar } from "./UserDetailsSidebar";
import { EmployeeAssignmentSidebar } from "./EmployeeAssignmentSidebar";
import { safeApiCall, handleApiError } from "./apiHelpers";
import {
  assignEmployeeRole,
  removeEmployeeRole,
} from "@/actions/employeeActions";
import {
  EmployeeRole,
  getRoleDisplayName,
  getRoleBadgeColor,
} from "@/types/employee";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAdminEmails, isUserAdmin } from "@/lib/adminUtils";
import type { CombinedUser } from "@/types/admin";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "user" | "vendor" | "admin" | "employee"
  >("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set());
  const [tableLoading, setTableLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    user: CombinedUser | null;
    action: "delete" | null;
  }>({
    isOpen: false,
    user: null,
    action: null,
  });

  // Sidebar state
  const [sidebarState, setSidebarState] = useState<{
    isOpen: boolean;
    user: CombinedUser | null;
  }>({
    isOpen: false,
    user: null,
  });

  // Employee assignment sidebar state
  const [employeeSidebarState, setEmployeeSidebarState] = useState<{
    isOpen: boolean;
    user: CombinedUser | null;
  }>({
    isOpen: false,
    user: null,
  });

  const perPageOptions = [20, 30, 40, 50, 100];

  // Check if user is an admin
  const checkIsAdmin = (email: string, isAdminFlag?: boolean): boolean => {
    return isAdminFlag === true || isUserAdmin(email);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search changes or per page changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(0);
    }
  }, [debouncedSearchTerm, searchTerm]);

  useEffect(() => {
    setCurrentPage(0);
  }, [perPage]);

  // Reset to first page whenever the role segment changes.
  useEffect(() => {
    setCurrentPage(0);
  }, [roleFilter]);

  // Utility functions
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Modal handlers
  const openActionModal = (user: CombinedUser, action: "delete") => {
    setActionModal({ isOpen: true, user, action });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      user: null,
      action: null,
    });
  };

  // Sidebar handlers
  const openSidebar = (user: CombinedUser) => {
    setSidebarState({
      isOpen: true,
      user,
    });
  };

  const closeSidebar = () => {
    setSidebarState({
      isOpen: false,
      user: null,
    });
  };

  // Handle user update for instant feedback after edit save.
  // Currently unused (sidebar refetches via onSaved); kept for future
  // optimistic updates if we want to avoid the round-trip.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUserUpdate = (updatedUser: CombinedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
    setSidebarState((prev) => ({ ...prev, user: updatedUser }));
  };

  // User deletion (single user - same API as bulk delete).
  const handleUserDeletion = async (userId: string) => {
    setPendingUsers((prev) => new Set(prev).add(userId));

    try {
      await safeApiCall("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      });

      toast.success("User deleted successfully");
      await fetchUsers(currentPage, true);
    } catch (error) {
      handleApiError(error, "User deletion");

      if (error instanceof Error) {
        if (error.message.includes("Cannot delete your own admin account")) {
          toast.error("Cannot delete your own account", {
            description:
              "You cannot delete your own admin account. Please ask another administrator to delete it.",
          });
        } else if (error.message.includes("Admin access required")) {
          toast.error("Permission denied", {
            description: "You don't have permission to delete users.",
          });
        } else if (error.message.includes("Unauthorized")) {
          toast.error("Authentication required", {
            description: "Please sign in again to continue.",
          });
        } else {
          toast.error("Failed to delete user", {
            description: error.message,
          });
        }
      } else {
        toast.error("Failed to delete user");
      }
    } finally {
      setPendingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Confirm action handler
  const handleConfirmAction = async () => {
    if (!actionModal.user || !actionModal.action) return;
    const { user, action } = actionModal;
    closeActionModal();
    if (action === "delete") {
      await handleUserDeletion(user.id);
    }
  };

  // Open employee assignment dialog
  const openEmployeeDialog = (user: CombinedUser) => {
    setEmployeeSidebarState({
      isOpen: true,
      user,
    });
  };

  // Close employee assignment dialog
  const closeEmployeeDialog = () => {
    setEmployeeSidebarState({
      isOpen: false,
      user: null,
    });
  };

  // Handle employee role assignment
  const handleAssignEmployee = async (sanityId: string, role: EmployeeRole) => {
    try {
      const result = await assignEmployeeRole(sanityId, role);

      if (result.success) {
        toast.success(result.message);
        // Immediately fetch fresh data
        await fetchUsers(currentPage, true);
        // Close the sidebar after successful assignment/update
        closeEmployeeDialog();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error assigning employee role:", error);
      toast.error("Failed to assign employee role");
    }
  };

  // Handle employee role removal
  const handleRemoveEmployee = async (sanityId: string, userName: string) => {
    try {
      const result = await removeEmployeeRole(sanityId);

      if (result.success) {
        toast.success(result.message);
        // Immediately fetch fresh data and close sidebar
        await fetchUsers(currentPage, true);
        closeEmployeeDialog();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error removing employee role:", error);
      toast.error("Failed to remove employee role");
    }
  };

  // Fetch users
  const fetchUsers = useCallback(
    async (page = 0, forceFresh = false) => {
      setTableLoading(true);
      try {
        // Add cache-busting parameter for fresh data
        const cacheBuster = forceFresh ? `&_t=${Date.now()}` : "";
        const data = await safeApiCall(
          `/api/admin/users/combined?limit=${perPage}&offset=${
            page * perPage
          }&query=${debouncedSearchTerm}&role=${roleFilter}${cacheBuster}`,
        );
        setUsers(data.users);
        setTotalUsersCount(data.totalCount);
      } catch (error) {
        handleApiError(error, "Users fetch");
      } finally {
        setTableLoading(false);
      }
    },
    [debouncedSearchTerm, perPage, roleFilter],
  );

  // CSV export — scope=page mirrors the current table view (search +
  // pagination); scope=all dumps every Firebase user. Hits a dedicated
  // streaming endpoint to keep the round-trip cheap.
  const handleExport = useCallback(
    async (scope: "page" | "all" | "oauth" | "password") => {
      setIsExporting(true);
      try {
        const params = new URLSearchParams({ scope });
        if (debouncedSearchTerm) params.set("query", debouncedSearchTerm);
        if (scope === "page") {
          params.set("limit", String(perPage));
          params.set("offset", String(currentPage * perPage));
        }
        const res = await fetch(
          `/api/admin/users/export?${params.toString()}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Export failed (${res.status})`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `gofarm-users-${scope}-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(
          scope === "all"
            ? "Exported every user"
            : scope === "page"
              ? "Exported the current page"
              : scope === "oauth"
                ? "Exported OAuth users"
                : "Exported email/password users",
        );
      } catch (err) {
        toast.error((err as Error).message || "Export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [debouncedSearchTerm, perPage, currentPage],
  );

  // CSV import — accepts the same shape produced by handleExport. Only
  // editable columns (firstName, lastName, phone, role, points, wallet)
  // are written back. Identity is keyed on `firebaseUid`, falling back
  // to `email`.
  const handleImportFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/users/import", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || `Import failed (${res.status})`);
        }
        const {
          total,
          updated,
          skipped,
          errors = [],
        } = json as {
          total: number;
          updated: number;
          skipped: number;
          errors: Array<{ row: number; reason: string }>;
        };
        if (errors.length) {
          console.warn("Import errors:", errors);
        }
        toast.success(
          `Imported ${updated}/${total} users${
            skipped ? ` (${skipped} skipped)` : ""
          }`,
        );
        await fetchUsers(currentPage, true);
      } catch (err) {
        toast.error((err as Error).message || "Import failed");
      } finally {
        setIsImporting(false);
        if (importInputRef.current) importInputRef.current.value = "";
      }
    },
    [currentPage, fetchUsers],
  );

  // Selection functions
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  // Delete functions
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUsers = async () => {
    setIsDeleting(true);
    try {
      await safeApiCall("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      toast.success("Users deleted successfully");
      fetchUsers(currentPage);
      setSelectedUsers([]);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      handleApiError(error, "Users delete");

      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes("Cannot delete your own admin account")) {
          toast.error("Cannot delete your own account", {
            description:
              "You cannot delete your own admin account. Please ask another administrator to delete your account if needed.",
          });
        } else if (error.message.includes("Admin access required")) {
          toast.error("Permission denied", {
            description: "You don't have permission to delete users.",
          });
        } else if (error.message.includes("Unauthorized")) {
          toast.error("Authentication required", {
            description: "Please sign in again to continue.",
          });
        } else {
          toast.error("Failed to delete users", {
            description:
              error.message ||
              "An unexpected error occurred. Please try again.",
          });
        }
      } else {
        toast.error("Failed to delete users", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  return (
    <>
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="text-lg font-semibold">Users Management</h3>
            <div className="flex flex-wrap gap-2">
              <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-medium whitespace-nowrap">
                Total: {totalUsersCount}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Show:
              </span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {perPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button
                onClick={() => fetchUsers(currentPage)}
                size="sm"
                className="shrink-0"
                disabled={tableLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", tableLoading && "animate-spin")}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                disabled={isExporting || tableLoading}
                onClick={() => setIsExportModalOpen(true)}
                title="Export users to CSV"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                disabled={isImporting}
                onClick={() => importInputRef.current?.click()}
                title="Import users from CSV"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Import</span>
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                }}
              />
            </div>
          </div>
        </div>

        {/* Role-based segment filter. The header / segment / search row
            stays visible during refreshes \u2014 only the table rows show a
            loading state via the in-card overlay below. */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "user", label: "Users" },
              { key: "vendor", label: "Vendors" },
              { key: "admin", label: "Admins" },
              { key: "employee", label: "Employees" },
            ] as const
          ).map((seg) => (
            <Button
              key={seg.key}
              size="sm"
              variant={roleFilter === seg.key ? "default" : "outline"}
              onClick={() => setRoleFilter(seg.key)}
              className="h-8"
            >
              {seg.label}
            </Button>
          ))}
        </div>

        {tableLoading && users.length === 0 ? (
          <UsersSkeleton />
        ) : (
          <>
            {selectedUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 bg-blue-50 p-3 rounded-lg border">
                <span className="text-sm font-medium text-center sm:text-left">
                  {selectedUsers.length} user
                  {selectedUsers.length > 1 ? "s" : ""} selected
                </span>
                <Button
                  onClick={openDeleteDialog}
                  variant="destructive"
                  size="sm"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Users Permanently
                </Button>
              </div>
            )}

            <Card className="relative">
              {tableLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              )}
              <div className="hidden md:block responsive-table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedUsers.length === users.length &&
                            users.length > 0
                          }
                          onCheckedChange={selectAllUsers}
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[200px]">
                        Email
                      </TableHead>
                      <TableHead className="hidden xl:table-cell min-w-[120px]">
                        Joined
                      </TableHead>
                      <TableHead className="hidden xl:table-cell min-w-[120px]">
                        Last Sign In
                      </TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[120px]">
                        Status
                      </TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No users found.{" "}
                          {totalUsersCount > 0
                            ? `Total users: ${totalUsersCount}`
                            : "No users in database."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() =>
                                toggleUserSelection(user.id)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {user.imageUrl ? (
                                <img
                                  src={user.imageUrl}
                                  alt={user.fullName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {user.fullName}
                                </div>
                                <div className="text-sm text-gray-500 lg:hidden">
                                  {user.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Points: {user.loyaltyPoints} | Spent: $
                                  {user.totalSpent}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <span>{user.email}</span>
                              {checkIsAdmin(user.email, user.isAdmin) && (
                                <Badge
                                  variant="default"
                                  className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {user.lastSignInAt
                              ? formatDate(user.lastSignInAt)
                              : "Never"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex gap-1">
                              <Badge
                                variant={
                                  user.emailVerified ? "default" : "secondary"
                                }
                              >
                                {user.emailVerified ? "Verified" : "Unverified"}
                              </Badge>
                              {user.banned && (
                                <Badge variant="destructive">Disabled</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              {user.isEmployee && user.employeeRole && (
                                <Badge variant="secondary" className="text-xs">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  {user.employeeRole}
                                </Badge>
                              )}
                              {user.notificationCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs hidden lg:inline-flex"
                                >
                                  {user.notificationCount} notifications
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openSidebar(user)}
                                disabled={pendingUsers.has(user.id)}
                                className="h-8 px-3"
                                title="Edit user"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionModal(user, "delete")}
                                disabled={pendingUsers.has(user.id)}
                                className="h-8 px-3"
                                title="Delete user"
                              >
                                {pendingUsers.has(user.id) ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found.{" "}
                    {totalUsersCount > 0
                      ? `Total users: ${totalUsersCount}`
                      : "No users in database."}
                  </div>
                ) : (
                  users.map((user, index) => (
                    <Card
                      key={user.id}
                      className="mobile-user-card p-3"
                      style={{ "--card-index": index } as React.CSSProperties}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <span>{user.email}</span>
                              {checkIsAdmin(user.email, user.isAdmin) && (
                                <Badge
                                  variant="default"
                                  className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs px-1.5 py-0"
                                >
                                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Joined: {formatDate(user.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Points: {user.loyaltyPoints} | Spent: $
                              {user.totalSpent}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={
                              user.emailVerified ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.emailVerified ? "Verified" : "Unverified"}
                          </Badge>
                          {user.banned && (
                            <Badge variant="destructive" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                          {user.isEmployee && user.employeeRole && (
                            <Badge variant="secondary" className="text-xs">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {user.employeeRole}
                            </Badge>
                          )}
                          {user.notificationCount > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {user.notificationCount} notifications
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <div className="text-xs text-muted-foreground">
                            Last:{" "}
                            {user.lastSignInAt
                              ? formatDate(user.lastSignInAt)
                              : "Never"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openSidebar(user)}
                              disabled={pendingUsers.has(user.id)}
                              className="h-7 px-2 text-xs"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionModal(user, "delete")}
                              disabled={pendingUsers.has(user.id)}
                              className="h-7 px-2 text-xs"
                            >
                              {pendingUsers.has(user.id) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {Math.min(currentPage * perPage + 1, totalUsersCount)}{" "}
                to {Math.min((currentPage + 1) * perPage, totalUsersCount)} of{" "}
                {totalUsersCount} users
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0 || tableLoading}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2 whitespace-nowrap">
                  Page {currentPage + 1} of{" "}
                  {Math.max(1, Math.ceil(totalUsersCount / perPage))}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={
                    (currentPage + 1) * perPage >= totalUsersCount ||
                    tableLoading ||
                    totalUsersCount <= perPage
                  }
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUsers}
        title="Delete Users Permanently"
        description={`Are you sure you want to permanently delete ${
          selectedUsers.length
        } user${
          selectedUsers.length > 1 ? "s" : ""
        }? This will remove all user data and related information (addresses, orders, reviews, etc.) from both systems. This action cannot be undone.`}
        itemCount={selectedUsers.length}
        isLoading={isDeleting}
      />

      {/* User Action Confirmation Modal — only the delete action is
          surfaced through this modal now. Legacy `isActive` / `inSanity`
          fields are passed as static `true` to satisfy the existing prop
          contract without re-routing through deleted activation flows. */}
      <UserActionModal
        isOpen={actionModal.isOpen}
        onClose={closeActionModal}
        onConfirm={handleConfirmAction}
        user={
          actionModal.user
            ? {
                firstName: actionModal.user.firstName,
                lastName: actionModal.user.lastName,
                email: actionModal.user.email,
                isActive: true,
                inSanity: true,
                notificationCount: actionModal.user.notificationCount,
              }
            : null
        }
        action={actionModal.action}
        isLoading={pendingUsers.has(actionModal.user?.id || "")}
      />

      {/* User Details Sidebar */}
      <UserDetailsSidebar
        isOpen={sidebarState.isOpen}
        onClose={closeSidebar}
        user={sidebarState.user}
        onDelete={handleUserDeletion}
        onSaved={() => fetchUsers(currentPage, true)}
        isLoading={pendingUsers.has(sidebarState.user?.id || "")}
      />

      {/* Employee Assignment Sidebar */}
      <EmployeeAssignmentSidebar
        isOpen={employeeSidebarState.isOpen}
        onClose={closeEmployeeDialog}
        user={employeeSidebarState.user}
        onAssignRole={handleAssignEmployee}
        onRemoveRole={handleRemoveEmployee}
        isLoading={pendingUsers.has(employeeSidebarState.user?.id || "")}
      />

      {/* Export confirmation modal — closes itself once the download starts */}
      <ExportUsersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        perPage={perPage}
        currentPage={currentPage}
        query={debouncedSearchTerm}
        isExporting={isExporting}
        onConfirm={async (scope: ExportScope) => {
          await handleExport(scope);
          setIsExportModalOpen(false);
        }}
      />
    </>
  );
};

export default AdminUsers;
