import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import AccountsOrdersList from "@/components/employee/AccountsOrdersList";

export const metadata: Metadata = {
  title: "Accounts - Employee Dashboard",
  description: "Manage cash submissions from deliverymen",
};

export default async function AccountsPage() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/");
  }

  // Only accounts and incharge can access
  if (!["accounts", "incharge"].includes(employee.role)) {
    redirect("/employee");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts Management</h1>
        <p className="text-muted-foreground mt-1">
          Receive and manage cash submissions from deliverymen
        </p>
      </div>

      <AccountsOrdersList />
    </div>
  );
}
