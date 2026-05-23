import Container from "@/components/Container";
import { ClientCartContent } from "@/components/cart/ClientCartContent";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";

function CartPage() {
  return (
    <Container className="py-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb />

      {/* Client Cart Content with Loading */}
      <ClientCartContent />
    </Container>
  );
}

export default CartPage;
