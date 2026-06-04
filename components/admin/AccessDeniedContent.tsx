"use client";

import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, LogIn, ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Container from "@/components/Container";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "motion/react";

export default function AccessDeniedContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-linear-to-br from-red-50/50 via-white to-orange-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <Container className="relative z-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <Card className="text-center border-red-200/50 shadow-2xl backdrop-blur-sm bg-white/80 overflow-hidden">
            <CardHeader className="relative pb-8 pt-12">
              {/* Animated Shield Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="mx-auto w-24 h-24 bg-linear-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl relative"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-red-400 rounded-full opacity-30 blur-xl"
                />
                <ShieldAlert className="w-12 h-12 text-white relative z-10" />
              </motion.div>

              {/* Title with animation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-red-700 mb-2 flex items-center justify-center gap-2">
                  <Lock className="w-6 h-6" />
                  Access Denied
                </h1>
                <div className="h-1 w-24 bg-linear-to-r from-transparent via-red-500 to-transparent mx-auto rounded-full" />
              </motion.div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                {!user ? (
                  <>
                    {/* Not logged in message */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <LogIn className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-1">
                            Authentication Required
                          </h3>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            You need to be logged in with an admin account to
                            access the admin panel.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="space-y-3 pt-2"
                    >
                      <Button
                        onClick={() =>
                          router.push("/sign-in?redirectTo=/admin")
                        }
                        className="w-full bg-linear-to-r from-gofarm-green to-green-600 hover:from-gofarm-green/90 hover:to-green-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                      >
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In to Continue
                      </Button>
                      <Button
                        onClick={() => router.push("/")}
                        className="w-full border-2 hover:bg-gray-50 h-12 text-base font-medium"
                        variant="outline"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Logged in but not admin message */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-sm font-semibold text-amber-800">
                          Currently logged in as:
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg px-4 py-3 border border-amber-200">
                        <p className="text-base font-mono text-amber-900 break-all">
                          {user.email}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-linear-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900 mb-1">
                            Insufficient Permissions
                          </h3>
                          <p className="text-sm text-red-700 leading-relaxed">
                            Your account doesn&apos;t have administrator
                            privileges. Please contact an administrator if you
                            believe this is an error.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="pt-2"
                    >
                      <Button
                        onClick={() => router.push("/")}
                        className="w-full border-2 hover:bg-gray-50 h-12 text-base font-medium"
                        variant="outline"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                      </Button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </CardContent>
          </Card>

          {/* Additional help text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            Need help? Contact support at{" "}
            <a
              href="mailto:admin@gofarm.com"
              className="text-gofarm-green hover:underline font-medium"
            >
              admin@gofarm.com
            </a>
          </motion.p>
        </motion.div>
      </Container>
    </div>
  );
}
