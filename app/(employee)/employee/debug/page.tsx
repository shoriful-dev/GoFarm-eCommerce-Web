import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { backendClient } from "@/sanity/lib/backendClient";
import { redirect } from "next/navigation";
import {
  User,
  Mail,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
} from "lucide-react";

export default async function EmployeeDebugPage() {
  const firebaseUid = await getAuthUserId();

  if (!firebaseUid) {
    redirect("/");
  }

  // Fetch user data
  const user = await backendClient.fetch(
    `*[_type == "user" && firebaseUid == $firebaseUid][0]`,
    { firebaseUid }
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-gofarm-green">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gofarm-green/10 p-3 rounded-lg">
              <Database className="w-6 h-6 text-gofarm-green" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gofarm-black">
                Employee Debug Information
              </h1>
              <p className="text-sm text-gofarm-gray mt-1">
                Authentication and database status for troubleshooting
              </p>
            </div>
          </div>
        </div>

        {/* Firebase UID Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gofarm-black">
              Firebase User ID
            </h2>
          </div>
          <div className="bg-linear-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <code className="text-sm text-gofarm-black font-mono break-all">
              {firebaseUid}
            </code>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Email Status */}
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gofarm-black text-sm">Email</h3>
            </div>
            <p
              className="text-sm text-gofarm-gray truncate"
              title={user?.email}
            >
              {user?.email || "Not found"}
            </p>
          </div>

          {/* Employee Status */}
          <div
            className={`bg-white rounded-xl shadow-md p-5 border-t-4 ${
              user?.isEmployee ? "border-t-green-500" : "border-t-red-500"
            } hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center gap-2 mb-2">
              {user?.isEmployee ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="font-semibold text-gofarm-black text-sm">
                Is Employee
              </h3>
            </div>
            <p
              className={`text-sm font-medium ${
                user?.isEmployee ? "text-green-600" : "text-red-600"
              }`}
            >
              {user?.isEmployee ? "✅ Yes" : "❌ No"}
            </p>
          </div>

          {/* Role Status */}
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gofarm-black text-sm">Role</h3>
            </div>
            <p className="text-sm text-gofarm-gray font-medium">
              {user?.employeeRole || "Not set"}
            </p>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-t-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gofarm-black text-sm">
                Status
              </h3>
            </div>
            <p className="text-sm text-gofarm-gray font-medium">
              {user?.employeeStatus || "Not set"}
            </p>
          </div>
        </div>

        {/* Issues/Warnings */}
        {!user?.isEmployee && (
          <div className="bg-red-50 border-l-4 border-l-red-500 rounded-xl shadow-md p-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  Employee Access Denied
                </h3>
                <p className="text-sm text-red-700">
                  This user is not marked as an employee in the database. To
                  grant employee access:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>
                    Set{" "}
                    <code className="bg-red-100 px-1 rounded">
                      isEmployee: true
                    </code>
                  </li>
                  <li>
                    Assign an{" "}
                    <code className="bg-red-100 px-1 rounded">
                      employeeRole
                    </code>
                  </li>
                  <li>
                    Set{" "}
                    <code className="bg-red-100 px-1 rounded">
                      employeeStatus: "active"
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {user?.isEmployee && !user?.employeeRole && (
          <div className="bg-yellow-50 border-l-4 border-l-yellow-500 rounded-xl shadow-md p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">
                  Missing Employee Role
                </h3>
                <p className="text-sm text-yellow-700">
                  Employee role is not set. Please assign one of the following
                  roles:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "callcenter",
                    "packer",
                    "warehouse",
                    "deliveryman",
                    "incharge",
                    "accounts",
                  ].map((role) => (
                    <span
                      key={role}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Data Display */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gofarm-green/10 p-2 rounded-lg">
              <Database className="w-5 h-5 text-gofarm-green" />
            </div>
            <h2 className="text-lg font-semibold text-gofarm-black">
              Complete User Data from Sanity
            </h2>
          </div>
          <div className="bg-linear-to-br from-gray-900 to-gray-800 p-6 rounded-lg overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono leading-relaxed">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        {/* Success Message */}
        {user?.isEmployee && user?.employeeRole && (
          <div className="bg-green-50 border-l-4 border-l-green-500 rounded-xl shadow-md p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">
                  ✅ Employee Access Configured Correctly
                </h3>
                <p className="text-sm text-green-700">
                  All employee settings are properly configured. You should have
                  access to the employee portal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
