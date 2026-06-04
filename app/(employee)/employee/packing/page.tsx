import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import PackingOrdersList from "@/components/employee/PackingOrdersList";

export const metadata: Metadata = {
  title: "Packing - Employee Dashboard",
  description: "Pack confirmed orders for delivery",
};

export default async function PackingPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/");
  }

  // Only packer and incharge can access
  if (!["packer", "incharge"].includes(employee.role)) {
    redirect("/employee");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Packing Management</h1>
        <p className="text-muted-foreground mt-1">
          Pack confirmed orders and prepare for delivery
        </p>
      </div>

      <PackingOrdersList employee={employee} />
    </div>
  );
}
