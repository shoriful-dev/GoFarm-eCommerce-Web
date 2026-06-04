import Link from "next/link";
import {
  Crown,
  ArrowRight,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Container from "./Container";

/**
 * Public URL where users can purchase the production / premium code.
 * Falls back to the public marketing page if unset.
 */
const PURCHASE_URL =
  process.env.NEXT_PUBLIC_PURCHASE_CODE_URL || "https://reactbd.com";

export interface PremiumFeatureProps {
  /** Short label that names the locked feature (e.g. "Hot Deals"). */
  featureName?: string;
  /** Headline shown in the card. Defaults to a generic message. */
  title?: string;
  /** Supporting paragraph below the title. */
  description?: string;
  /** Optional bullet list of what the premium version unlocks. */
  bullets?: string[];
  /** Override the eyebrow icon. */
  Icon?: LucideIcon;
  /** Override the primary CTA label. */
  ctaLabel?: string;
  /** Override the purchase URL (defaults to NEXT_PUBLIC_PURCHASE_CODE_URL). */
  purchaseUrl?: string;
  /** Where the secondary "back" link points. Defaults to "/". */
  homeHref?: string;
  /** Extra wrapper classes. */
  className?: string;
}

const DEFAULT_BULLETS = [
  "Production-ready source code with full TypeScript types",
  "All premium pages, components, and admin tooling",
  "Free updates and email support from the maintainer",
];

/**
 * Reusable "this feature is part of the premium build" placeholder.
 *
 * Used on routes that exist in the public/free branch as marketing
 * surfaces but whose implementation lives in the paid release. Drop it
 * anywhere — server component, no Sanity fetches, no client JS.
 *
 * @example
 *   // app/(client)/deal/page.tsx
 *   export default function DealPage() {
 *     return <PremiumFeature featureName="Hot Deals" />;
 *   }
 */
const PremiumFeature = ({
  featureName,
  title,
  description,
  bullets = DEFAULT_BULLETS,
  Icon = Crown,
  ctaLabel = "Get the premium code",
  purchaseUrl = PURCHASE_URL,
  homeHref = "/",
  className = "",
}: PremiumFeatureProps) => {
  const resolvedTitle =
    title ??
    (featureName
      ? `${featureName} is a premium feature`
      : "This is a premium feature");

  const resolvedDescription =
    description ??
    `The full implementation${featureName ? ` of ${featureName}` : ""} ships with the production / premium build of GoFarm. Grab the code to unlock it on your own deployment.`;

  return (
    <section
      className={`min-h-[70vh] flex items-center bg-linear-to-b from-gofarm-light-orange to-white ${className}`}
    >
      <Container className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-gofarm-light-green/30 bg-white shadow-xl">
            {/* Decorative top accent */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-gofarm-green via-gofarm-light-green to-gofarm-orange"
            />

            <div className="p-8 md:p-12">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gofarm-orange/30 bg-gofarm-light-orange px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gofarm-orange">
                <Lock className="h-3.5 w-3.5" />
                Premium feature
              </div>

              {/* Icon */}
              <div className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gofarm-green/10 text-gofarm-green">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>

              {/* Title */}
              <h1 className="mt-5 text-3xl md:text-4xl font-bold text-gofarm-black leading-tight">
                {resolvedTitle}
              </h1>

              {/* Description */}
              <p className="mt-4 text-base md:text-lg text-gofarm-gray leading-relaxed">
                {resolvedDescription}
              </p>

              {/* Bullets */}
              {bullets.length > 0 && (
                <ul className="mt-8 space-y-3">
                  {bullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm md:text-base text-gofarm-black"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gofarm-green/15 text-gofarm-green">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Actions */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href={purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gofarm-orange px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-orange focus:ring-offset-2"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={homeHref}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gofarm-light-gray bg-white px-6 py-3 text-sm font-semibold text-gofarm-black transition-colors hover:border-gofarm-green hover:text-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-green focus:ring-offset-2"
                >
                  Back to home
                </Link>
              </div>

              <p className="mt-6 text-xs text-gofarm-gray">
                You're viewing the open-source build. Premium features are kept
                private to support continued development.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default PremiumFeature;
