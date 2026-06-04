"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("auth route error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Authentication error
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn&apos;t complete that authentication step. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-darkColor text-white text-sm font-medium hover:bg-black transition-colors"
        >
          Try again
        </button>
        <Link
          href="/sign-in"
          className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Go to sign-in
        </Link>
      </div>
    </div>
  );
}
