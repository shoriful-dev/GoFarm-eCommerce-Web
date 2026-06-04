import { getCurrentUser, isAdmin } from "@/lib/firebase-admin-auth";
import { redirect } from "next/navigation";
import AdminNotifications from "@/components/admin/AdminNotifications";

export const dynamic = "force-dynamic";

const AdminNotificationsPage = async () => {
  // Check if current user is admin (checks both env var and Sanity isAdmin field)
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/admin/access-denied");
  }

  // Get current user for email
  const currentUser = await getCurrentUser();
  const userEmail = currentUser?.email || "";

  return <AdminNotifications adminEmail={userEmail} />;
};

export default AdminNotificationsPage;
