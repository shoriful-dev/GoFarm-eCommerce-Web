"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function EmailLinkSignInPage() {
  const router = useRouter();
  const { completeEmailLinkSignIn, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  useEffect(() => {
    // Check if this is a valid email link
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get("mode");
      const oobCode = urlParams.get("oobCode");

      if (mode === "signIn" && oobCode) {
        setIsValidLink(true);
        // Try to get email from localStorage
        const savedEmail = window.localStorage.getItem("emailForSignIn");
        if (savedEmail) {
          setEmail(savedEmail);
          // Auto-complete sign-in if email is saved
          handleCompleteSignIn(savedEmail);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Redirect if already signed in
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleCompleteSignIn = async (emailToUse: string) => {
    if (!emailToUse) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await completeEmailLinkSignIn(emailToUse);
      router.push("/");
    } catch (error: any) {
      console.error("Error completing sign-in:", error);
      toast.error(error.message || "Failed to complete sign-in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCompleteSignIn(email);
  };

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Container>
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Sign-In Link
              </h1>
              <p className="text-gray-600 mb-6">
                This link is invalid or has expired. Please request a new
                sign-in link.
              </p>
              <Button
                onClick={() => router.push("/sign-in")}
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Sign-In
            </h1>
            <p className="text-gray-600">
              Enter your email address to complete the sign-in process
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Enter the email address where you received the sign-in link
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Complete Sign-In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/sign-in")}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
