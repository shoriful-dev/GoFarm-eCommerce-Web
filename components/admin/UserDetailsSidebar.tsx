"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  Save,
  Phone,
  Shield,
  Briefcase,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { ROLES, type Role } from "@/lib/auth/roles";
import type { CombinedUser } from "@/types/admin";

interface UserDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: CombinedUser | null;
  onDelete: (userId: string) => Promise<void>;
  onSaved?: () => void;
  isLoading: boolean;
}

const formatDate = (ts?: number | null) => {
  if (!ts) return "Never";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const UserDetailsSidebar: React.FC<UserDetailsSidebarProps> = ({
  isOpen,
  onClose,
  user: userProp,
  onDelete,
  onSaved,
  isLoading,
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "user" as Role,
    loyaltyPoints: 0,
    walletBalance: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Cache the last user we rendered for so the sheet can finish its
  // slide-out animation even after the parent clears `user` to null.
  const [displayUser, setDisplayUser] = useState<CombinedUser | null>(userProp);
  const busy = saving || deleting;

  useEffect(() => {
    if (userProp) setDisplayUser(userProp);
  }, [userProp]);

  // From here on, prefer the live prop but fall back to the cached one
  // while the closing animation plays out.
  const user = userProp ?? displayUser;

  // Hydrate the form whenever the sidebar opens with a different user.
  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      role: (ROLES as readonly string[]).includes(user.role)
        ? (user.role as Role)
        : "user",
      loyaltyPoints: user.loyaltyPoints || 0,
      walletBalance: user.walletBalance || 0,
    });
  }, [user]);

  // Render the sheet using the cached user so the close animation can
  // play out even when the parent has already cleared `user` to null.
  const sheetUser = user;
  if (!sheetUser) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${sheetUser.firebaseUid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.role,
          loyaltyPoints: Number(form.loyaltyPoints) || 0,
          walletBalance: Number(form.walletBalance) || 0,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || `HTTP ${res.status}`);
      }
      toast.success("User updated");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error("Failed to update user", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Permanently delete ${sheetUser.fullName || sheetUser.email}? This removes the user from Firebase and all related Sanity data (orders, reviews, addresses).`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(sheetUser.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(next) => {
        // While a save/delete is in flight, ignore overlay/Esc-driven
        // close attempts — the user must finish or cancel via the form
        // (or hit the explicit close “X” once the action completes).
        if (!next && busy) return;
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="right"
        // Block Radix’s built-in dismiss paths while a mutation is in
        // flight so the sidebar stays open until the action finishes.
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        className="w-full sm:max-w-[540px] md:max-w-[660px] lg:max-w-[760px] overflow-y-auto p-0"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>
              Identity comes from Firebase. Profile, role, points and wallet
              live in Sanity.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Header card */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {user.fullName || user.email}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={user.emailVerified ? "default" : "secondary"}
                    >
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                    {user.banned && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                    {user.isAdmin && (
                      <Badge className="bg-amber-500 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.isEmployee && (
                      <Badge variant="secondary">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {user.employeeRole || "Employee"}
                      </Badge>
                    )}
                    {user.isVendor && (
                      <Badge variant="outline">
                        <Store className="h-3 w-3 mr-1" />
                        Vendor
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined
                </div>
                <div className="text-right">{formatDate(user.createdAt)}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last sign in
                </div>
                <div className="text-right">
                  {formatDate(user.lastSignInAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  Firebase UID
                </div>
                <div className="text-right font-mono text-xs truncate">
                  {user.firebaseUid}
                </div>
              </div>
            </Card>

            {/* Editable form */}
            <Card className="p-6 space-y-4">
              <h4 className="font-medium">Profile (Sanity)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as Role }))
                  }
                  disabled={saving}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Changing the role updates Firebase custom claims and revokes
                  the user&apos;s session, forcing a fresh sign-in.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loyaltyPoints">Loyalty points</Label>
                  <Input
                    id="loyaltyPoints"
                    type="number"
                    min={0}
                    value={form.loyaltyPoints}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        loyaltyPoints: Number(e.target.value || 0),
                      }))
                    }
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walletBalance">Wallet balance</Label>
                  <Input
                    id="walletBalance"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.walletBalance}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        walletBalance: Number(e.target.value || 0),
                      }))
                    }
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                <div className="text-muted-foreground">Total spent</div>
                <div className="text-right">${user.totalSpent.toFixed(2)}</div>
                <div className="text-muted-foreground">Notifications</div>
                <div className="text-right">{user.notificationCount}</div>
              </div>
            </Card>
          </div>

          <div className="border-t bg-background/50 px-6 py-4 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || isLoading}
              className="flex-1"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save changes
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || isLoading}
            >
              {deleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
