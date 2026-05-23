import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { UserLayoutClient } from "@/components/user/UserLayoutClient";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication server-side
  const user = await getCurrentUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in?redirectTo=/user/dashboard");
  }

  // Pass user data to client component
  return (
    <UserLayoutClient
      user={{
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      }}
    >
      {children}
    </UserLayoutClient>
  );
}
