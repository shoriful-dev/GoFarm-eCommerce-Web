"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";

interface QuickAuthSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reason shown at the top — e.g. "Sign in to view your cart". */
  reason?: string;
}

const QuickAuthSidebar = ({
  open,
  onOpenChange,
  reason = "Sign in to continue",
}: QuickAuthSidebarProps) => {
  const { signIn, signInWithGoogle, signInWithGithub, sendEmailLink } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  const fullSignInHref =
    typeof window !== "undefined"
      ? `/sign-in?redirectTo=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`
      : "/sign-in";

  const fullSignUpHref =
    typeof window !== "undefined"
      ? `/sign-up?redirectTo=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`
      : "/sign-up";

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleProvider = async (provider: "google" | "github") => {
    setError("");
    setLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLink = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendEmailLink(email);
      setEmailLinkSent(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Failed to send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gofarm-light-gray">
          <SheetTitle className="text-2xl font-bold text-gofarm-black">
            Welcome back
          </SheetTitle>
          <SheetDescription className="text-sm text-gofarm-gray">
            {reason}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            {emailLinkSent && (
              <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded text-sm">
                Check your email — we&apos;ve sent you a sign-in link.
              </div>
            )}

            <div>
              <label className="text-gofarm-black text-[13px] font-medium block mb-1.5">
                Email
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-gofarm-black text-sm border border-gofarm-gray/30 focus:border-gofarm-green rounded-md pl-3 pr-9 py-2.5 outline-none transition-colors"
                />
                <Mail className="w-4 h-4 absolute right-3 text-gofarm-gray" />
              </div>
            </div>

            <div>
              <label className="text-gofarm-black text-[13px] font-medium block mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-gofarm-black text-sm border border-gofarm-gray/30 focus:border-gofarm-green rounded-md pl-3 pr-9 py-2.5 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 text-gofarm-gray hover:text-gofarm-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={handleEmailLink}
                disabled={loading || !email}
                className="text-gofarm-green font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Email me a link
              </button>
              <Link
                href="/forgot-password"
                onClick={() => onOpenChange(false)}
                className="text-gofarm-green font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-medium rounded-md text-white bg-gofarm-green hover:bg-gofarm-light-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-gofarm-gray/30" />
            <span className="text-xs text-gofarm-gray">or continue with</span>
            <hr className="flex-1 border-gofarm-gray/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleProvider("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 border border-gofarm-gray/30 rounded-md text-sm font-medium hover:bg-gofarm-light-gray/40 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleProvider("github")}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 border border-gofarm-gray/30 rounded-md text-sm font-medium hover:bg-gofarm-light-gray/40 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gofarm-gray">
            New to GoFarm?{" "}
            <Link
              href={fullSignUpHref}
              onClick={() => onOpenChange(false)}
              className="text-gofarm-green font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <div className="border-t border-gofarm-light-gray px-6 py-4">
          <Link
            href={fullSignInHref}
            onClick={() => onOpenChange(false)}
            className="block w-full text-center py-2.5 text-sm font-medium text-gofarm-green border border-gofarm-green rounded-md hover:bg-gofarm-green hover:text-white transition-colors"
          >
            Open full sign-in page
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuickAuthSidebar;
