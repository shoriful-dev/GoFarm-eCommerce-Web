import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import OrdersList from "@/components/employee/OrdersList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders - Employee Dashboard",
  description: "Manage and process customer orders",
};

export default async function OrdersPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/");
  }

  // Only call center and incharge can access
  if (!["callcenter", "incharge"].includes(employee.role)) {
    redirect("/employee");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-muted-foreground mt-1">
          Confirm addresses and process customer orders
        </p>
      </div>
      <OrdersList employee={employee} />
    </div>
  );
}
