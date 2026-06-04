"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { showToast } from "@/lib/toast";
import {
  User,
  Phone,
  Calendar,
  Save,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  providerData?: Array<{
    providerId: string;
    uid: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    photoURL?: string | null;
  }>;
}

interface Address {
  _id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  default: boolean;
  type: "home" | "office" | "other";
  createdAt?: string;
  phone?: string;
}

interface SanityUser {
  _id: string;
  firebaseUid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  dateOfBirth?: string;
  profileImage?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  addresses?: Address[];
  preferences?: Record<string, unknown>;
  loyaltyPoints?: number;
  rewardPoints?: number;
  totalSpent?: number;
  lastLogin?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    firebase: FirebaseUser;
    sanity: SanityUser | null;
  };
}

export default function ProfileEditSidebar({
  isOpen,
  onClose,
  userData,
}: ProfileEditSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData.sanity?.firstName || "",
    lastName: userData.sanity?.lastName || "",
    phone: userData.sanity?.phone || "",
    dateOfBirth: userData.sanity?.dateOfBirth || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Check if user signed in with OAuth (Google, Facebook, etc.) or email/password
  const isOAuthUser = userData.firebase.providerData?.some(
    (provider) => provider.providerId !== "password"
  );
  const isPasswordUser = userData.firebase.providerData?.some(
    (provider) => provider.providerId === "password"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          firebaseUid: userData.firebase.uid,
        }),
      });

      if (response.ok) {
        showToast.success(
          "Profile Updated",
          "Your profile has been successfully updated."
        );
        onClose();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast.error("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error("Error", "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success(
          "Password Changed",
          "Your password has been successfully updated."
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
      } else {
        throw new Error(data.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      showToast.error(
        "Error",
        error.message || "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Edit Profile</span>
          </SheetTitle>
          <SheetDescription>
            Update your personal information. Firebase/OAuth data is read-only.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clerk Data (Read-only) */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Firebase Account (Read-only)
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">First Name</Label>
                    <div className="text-gray-900 bg-white p-2 rounded border text-sm">
                      {userData.sanity?.firstName ||
                        userData.firebase.displayName?.split(" ")[0] ||
                        "Not provided"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Last Name</Label>
                    <div className="text-gray-900 bg-white p-2 rounded border text-sm">
                      {userData.sanity?.lastName ||
                        userData.firebase.displayName
                          ?.split(" ")
                          .slice(1)
                          .join(" ") ||
                        "Not provided"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <div className="text-gray-900 bg-white p-2 rounded border text-sm">
                      {userData.firebase.email || "Not provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Sanity Data */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Additional Information (Editable)
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>First Name (Override)</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter first name"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Override Firebase first name for display
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="lastName"
                      className="flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>Last Name (Override)</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter last name"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Override Firebase last name for display
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className="flex items-center space-x-1"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="dateOfBirth"
                      className="flex items-center space-x-1"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Date of Birth</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>

          {/* Password Section */}
          {isPasswordUser && (
            <div className="border rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Password Settings
                </h3>
                {!showPasswordSection && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {showPasswordSection ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordInputChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      placeholder="Enter current password"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordInputChange("newPassword", e.target.value)
                      }
                      placeholder="Enter new password (min 6 characters)"
                      className="mt-1"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordInputChange(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-500">
                  Click "Change Password" to update your password
                </p>
              )}
            </div>
          )}

          {/* OAuth Info Message */}
          {isOAuthUser && !isPasswordUser && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                You signed in with{" "}
                {userData.firebase.providerData?.[0]?.providerId ===
                "google.com"
                  ? "Google"
                  : "a social provider"}
                . Password management is handled by your OAuth provider and
                cannot be changed here.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
