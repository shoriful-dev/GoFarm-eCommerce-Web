import AdminOrders from "@/components/admin/AdminOrders";
import { getAuthUserId } from "@/lib/firebase-admin-auth";

export const dynamic = "force-dynamic";

const AdminOrdersPage = async () => {
  const userId = await getAuthUserId();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">
          Please sign in to access this page
        </p>
      </div>
    );
  }

  // Admin view - no employee check needed as this is admin-only route
  return <AdminOrders />;
};

export default AdminOrdersPage;
