/**
 * Canonical role model for the entire app.
 *
 * Identity (who you are) is owned by Firebase.
 * Authorization (what you can do) is owned by the `role` field on the
 * Sanity user document, mirrored into Firebase custom claims for fast
 * server-side checks.
 *
 * Roles:
 *  - "user"     : default for everyone who signs up
 *  - "admin"    : full backend access (admin panel, vendor management)
 *  - "vendor"   : approved seller; access to vendor dashboard
 *  - "employee" : internal staff (warehouse / call center / etc.)
 *
 * Bootstrap: emails listed in ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAIL are
 * promoted to "admin" the first time they sign in. After that, role is
 * managed entirely through Sanity (or admin UI) — env vars are only a
 * seed mechanism.
 */

export const ROLES = ["user", "admin", "vendor", "employee"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "user";

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

/**
 * Parse `ADMIN_EMAILS` (server) or `NEXT_PUBLIC_ADMIN_EMAIL` (legacy/client).
 * Both formats are accepted: `a@x.com,b@x.com` or `[a@x.com,b@x.com]`.
 */
export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .replace(/[\[\]]/g, "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getBootstrapAdminEmails(): string[] {
  return [
    ...parseAdminEmails(process.env.ADMIN_EMAILS),
    ...parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
  ];
}

export function isBootstrapAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return getBootstrapAdminEmails().includes(email.toLowerCase());
}

/**
 * Derive the effective role from a (partial) Sanity user document.
 * Falls back to legacy boolean flags for documents written before the
 * `role` field existed.
 */
export function roleFromUserDoc(
  user:
    | {
        role?: string | null;
        isAdmin?: boolean | null;
        isEmployee?: boolean | null;
        isVendor?: boolean | null;
      }
    | null
    | undefined,
): Role {
  if (!user) return DEFAULT_ROLE;
  if (isRole(user.role)) return user.role;
  if (user.isAdmin) return "admin";
  if (user.isEmployee) return "employee";
  if (user.isVendor) return "vendor";
  return DEFAULT_ROLE;
}

/**
 * Mirror a role onto the legacy boolean flags so existing GROQ queries
 * (and Sanity Studio filters) keep working without rewrites.
 */
export function legacyFlagsForRole(role: Role): {
  isAdmin: boolean;
  isEmployee: boolean;
  isVendor: boolean;
} {
  return {
    isAdmin: role === "admin",
    isEmployee: role === "employee",
    isVendor: role === "vendor",
  };
}

/**
 * Is `role` allowed when the route requires `required`?
 * Admin satisfies any requirement (super-role).
 */
export function roleSatisfies(role: Role, required: Role): boolean {
  if (role === "admin") return true;
  return role === required;
}
