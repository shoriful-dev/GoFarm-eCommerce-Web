import { getCurrentEmployee } from "@/actions/employeeActions";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Payments - Employee Dashboard",
  description: "Manage payments and cash collection",
};

export default async function PaymentsPage() {
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
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground mt-1">
          Receive and manage cash collections from deliveries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Payment Module Coming Soon</p>
            <p className="text-sm">
              This section will show cash collections pending receipt
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
