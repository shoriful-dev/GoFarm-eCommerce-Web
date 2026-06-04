import { Metadata } from "next";
import { contactConfig } from "@/config/contact";
import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Authentication - ${contactConfig.company.name}`,
  description: `Sign in or create an account with ${contactConfig.company.name} to access exclusive deals, track orders, and enjoy personalized shopping experiences.`,
  keywords: [
    "sign in",
    "sign up",
    "login",
    "register",
    "account",
    "authentication",
  ],
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const user = await getCurrentUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/user/dashboard");
  }

  return <div className="auth-layout">{children}</div>;
}
