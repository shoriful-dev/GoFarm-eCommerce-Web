export interface CombinedUser {
  id: string;
  firebaseUid: string;
  sanityId?: string;

  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  imageUrl: string;

  createdAt: number;
  lastSignInAt?: number | null;
  emailVerified: boolean;
  banned: boolean;

  role: string;

  loyaltyPoints: number;
  walletBalance: number;
  totalSpent: number;
  notificationCount: number;

  isEmployee?: boolean;
  employeeRole?: string;
  employeeStatus?: string;

  isAdmin?: boolean;

  isVendor?: boolean;
  vendorStatus?: string;

  isActive?: boolean;
};
