'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '../../../lib/logger';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('client route error', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We hit an unexpected error while loading this page. You can try again, or head back to the
        home page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-darkColor text-white text-sm font-medium hover:bg-black transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-8 text-xs text-left bg-gray-50 border border-gray-200 rounded p-3 max-w-2xl overflow-auto">
          {error.message}
        </pre>
      )}
    </div>
  );
}
