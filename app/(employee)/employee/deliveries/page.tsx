import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import DeliveryOrdersList from "@/components/employee/DeliveryOrdersList";

export const metadata: Metadata = {
  title: "Deliveries - Employee Dashboard",
  description: "Manage delivery orders",
};

export default async function DeliveriesPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/");
  }

  // Only deliveryman and incharge can access
  if (!["deliveryman", "incharge"].includes(employee.role)) {
    redirect("/employee");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Delivery Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage assigned deliveries and cash collection
        </p>
      </div>

      <DeliveryOrdersList />
    </div>
  );
}
