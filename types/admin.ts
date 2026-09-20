/**
 * Canonical shape of a user as rendered in the admin console.
 *
 * The admin "Users" page merges Firebase Auth records with their Sanity
 * mirror documents and surfaces the union to several components. Keeping
 * the type here means `AdminUsers`, `UserDetailsSidebar`,
 * `EmployeeAssignmentSidebar`, and any future panels stay in sync — and
 * a property added in one place can't silently drift away from the
 * others.
 *
 * Fields fall into three buckets:
 *   1. Identity / display       — id, firebaseUid, sanityId, names, email, etc.
 *   2. Auth state from Firebase — emailVerified, banned, lastSignInAt, ...
 *   3. Business state from Sanity — role, isVendor, walletBalance, ...
 *
 * `isActive` is optional because not every code path (e.g. the bulk
 * users list) computes it; consumers should treat `undefined` as
 * "active by default" rather than "inactive".
 */
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

  /**
   * Sanity role string. Kept as `string` (not the `Role` union) because
   * legacy documents may carry values we haven't normalized yet.
   */
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
}
