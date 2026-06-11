import type { Metadata } from "next";
import { UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Vendor Requests",
  robots: { index: false, follow: false },
};

export default function VendorRequestsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl text-center space-y-6 py-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gofarm-light-green/20 text-gofarm-green mx-auto">
          <UserCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gofarm-black">
          Vendor Requests
        </h1>
        <p className="text-gofarm-gray text-lg">
          Coming soon! Manage vendor applications and requests here.
        </p>
      </div>
    </div>
  );
}
