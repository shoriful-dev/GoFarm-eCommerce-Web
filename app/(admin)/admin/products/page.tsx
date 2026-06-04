import { isAdmin } from "@/lib/firebase-admin-auth";
import { redirect } from "next/navigation";
import { getAdminCategories } from "@/sanity/queries";
import AdminProducts from "@/components/admin/AdminProducts";

export const dynamic = "force-dynamic";

const AdminProductsPage = async () => {
  // Check if current user is admin (checks both env var and Sanity isAdmin field)
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/admin/access-denied");
  }

  // Fetch categories server-side using the query function
  const categories = await getAdminCategories();

  return <AdminProducts initialCategories={categories} />;
};

export default AdminProductsPage;
