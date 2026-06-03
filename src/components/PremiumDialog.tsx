'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Crown, Lock, X, ExternalLink } from 'lucide-react';

interface PremiumDialogProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
  title?: string;
  description?: string;
  bullets?: string[];
  ctaLabel?: string;
  purchaseUrl?: string;
}

const PremiumDialog = ({
  open,
  onClose,
  featureName = 'This feature',
  title,
  description,
  bullets,
  ctaLabel = 'Get the premium code',
  purchaseUrl,
}: PremiumDialogProps) => {
  const url = purchaseUrl || process.env.NEXT_PUBLIC_PURCHASE_CODE_URL || 'https://reactbd.com';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  const headline = title || `${featureName} is a premium feature`;
  const desc =
    description ||
    `${featureName} is part of the premium GoFarm code package. Grab the premium version to unlock the full implementation.`;
  const points = bullets || [
    'Full backend wiring & database persistence',
    'Production-ready API routes and validation',
    'Email integration and admin tooling',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-dialog-title"
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close premium dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-linear-to-r from-gofarm-orange via-gofarm-light-orange to-gofarm-green" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-gofarm-gray hover:text-gofarm-black hover:bg-gofarm-light-gray/40 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gofarm-light-orange text-gofarm-orange text-xs font-semibold tracking-wide uppercase">
            <Lock className="w-3.5 h-3.5" />
            Premium feature
          </div>

          <div className="mt-4 flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gofarm-orange/10 text-gofarm-orange flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <h2
              id="premium-dialog-title"
              className="text-xl sm:text-2xl font-bold text-gofarm-black leading-tight"
            >
              {headline}
            </h2>
          </div>

          <p className="mt-3 text-sm text-gofarm-gray leading-relaxed">{desc}</p>

          <ul className="mt-4 space-y-2">
            {points.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-gofarm-black">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gofarm-green shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gofarm-orange hover:bg-gofarm-green text-white font-semibold px-4 py-2.5 rounded-md transition-colors"
            >
              {ctaLabel}
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-gofarm-light-gray text-gofarm-black hover:bg-gofarm-light-gray/40 font-semibold transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDialog;
