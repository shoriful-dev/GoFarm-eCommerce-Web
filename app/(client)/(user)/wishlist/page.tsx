import { getCurrentUser } from "@/lib/firebase-admin-auth";
import Container from "@/components/Container";
import NoAccessToCart from "@/components/NoAccessToCart";
import WishlistProducts from "@/components/WishlistProducts";
import { Heart } from "lucide-react";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";

export const dynamic = "force-dynamic";

const WishListPage = async () => {
  const user = await getCurrentUser();

  return (
    <Container className="py-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb />

      {/* Page Header */}
      <div className="flex items-center gap-2 mb-8">
        <Heart className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">
            Save your favorite items for later
          </p>
        </div>
      </div>

      {/* Content */}
      {user ? (
        <WishlistProducts />
      ) : (
        <NoAccessToCart details="Log in to save and view your favorite products. Don't miss out on the items you love!" />
      )}
    </Container>
  );
};

export default WishListPage;
