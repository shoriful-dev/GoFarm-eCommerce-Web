import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/actions/employeeActions";
import WarehouseOrdersList from "@/components/employee/WarehouseOrdersList";

export default async function WarehousePage() {
  const employee = await getCurrentEmployee();

  // If not logged in or not an employee, redirect
  if (!employee) {
    redirect("/employee");
  }

  // Only warehouse employees can access this page
  if (employee.role !== "warehouse") {
    redirect("/employee");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WarehouseOrdersList employee={employee} />
    </div>
  );
}
