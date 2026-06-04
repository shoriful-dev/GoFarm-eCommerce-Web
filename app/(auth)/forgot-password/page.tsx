"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "motion/react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { ArrowLeft, Mail } from "lucide-react";
import { contactConfig } from "@/config/contact";
import Container from "@/components/Container";

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gofarm-light-green/5 via-gray-50 to-gofarm-light-orange/50 relative overflow-hidden">
      <Container>
        <div className="absolute inset-0 bg-[radial-linear(circle_at_30%_20%,rgba(59,156,60,0.1)_0%,transparent_50%)]"></div>

        <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/sign-in"
              className="flex items-center gap-2 text-gofarm-green hover:text-gofarm-light-green transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Sign In</span>
            </Link>
            <Logo />
          </div>
        </header>

        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100/50 p-8">
              <h2 className="text-2xl font-bold text-gofarm-green mb-2 text-center">
                Reset Your Password
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              {success ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    <p className="font-medium">Check your email!</p>
                    <p className="text-sm mt-1">
                      We've sent a password reset link to{" "}
                      <strong>{email}</strong>
                    </p>
                  </div>
                  <Link
                    href="/sign-in"
                    className="inline-block text-gofarm-light-green hover:text-gofarm-green font-medium"
                  >
                    Return to Sign In
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gofarm-light-green focus:border-transparent"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gofarm-light-green text-white py-3 rounded-lg font-semibold hover:bg-gofarm-green transition-colors disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link
                      href="/sign-in"
                      className="text-gofarm-light-green hover:text-gofarm-green font-semibold"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPasswordPage;
