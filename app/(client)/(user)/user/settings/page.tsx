"use client";

import { useState } from "react";
import { Bell, Shield, Trash2, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import NewsletterSubscription from "@/components/profile/NewsletterSubscription";

export default function UserSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    marketingEmails: false,
    twoFactorAuth: false,
    profileVisibility: true,
  });

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        toast.success("Settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/user/export-data");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "user-data.json";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data exported successfully");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch("/api/user/delete-account", {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Account deletion initiated");
          // Redirect to sign out or home page
        } else {
          toast.error("Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about account activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange("emailNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange("pushNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Updates</Label>
              <p className="text-sm text-gray-500">
                Get notified about order status changes
              </p>
            </div>
            <Switch
              checked={settings.orderUpdates}
              onCheckedChange={(checked) =>
                handleSettingChange("orderUpdates", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-gray-500">
                Receive promotional offers and updates
              </p>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={(checked) =>
                handleSettingChange("marketingEmails", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage your account security and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) =>
                handleSettingChange("twoFactorAuth", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-gray-500">
                Make your profile visible to other users
              </p>
            </div>
            <Switch
              checked={settings.profileVisibility}
              onCheckedChange={(checked) =>
                handleSettingChange("profileVisibility", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export or delete your account data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Data</Label>
              <p className="text-sm text-gray-500">
                Download a copy of your account data
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start space-x-3">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
