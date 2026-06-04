"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumDialog from "./PremiumDialog";

const NewsletterSection = () => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(true);
  };

  return (
    <section
      aria-label="Newsletter signup"
      className="relative mt-16 lg:mt-24 w-full overflow-hidden bg-cover bg-center bg-no-repeat min-h-80 md:min-h-95 flex items-center"
      style={{ backgroundImage: "url('/newsletter_bg.webp')" }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6 md:mb-8 drop-shadow-lg">
            Join newsletter <br className="hidden md:block" />
            and get{" "}
            <span className="text-gofarm-light-orange">$10 discount</span>
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:bg-white sm:rounded-md sm:p-1.5 sm:shadow-lg">
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                className="flex-1 px-4 py-3 rounded-md sm:rounded-none bg-white text-gofarm-black placeholder:text-gofarm-gray focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gofarm-orange hover:bg-gofarm-green text-white font-semibold px-8 py-3 rounded-md transition-colors min-w-35"
              >
                Subscribe
              </button>
            </div>

            <label className="flex items-center gap-2 text-white text-sm select-none">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 accent-gofarm-orange"
              />
              <span>
                I accept{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-gofarm-light-orange"
                >
                  terms and conditions
                </Link>{" "}
                &{" "}
                <Link
                  href="/privacy-policy"
                  className="underline hover:text-gofarm-light-orange"
                >
                  privacy policy
                </Link>
              </span>
            </label>
          </form>
        </div>
      </div>

      <PremiumDialog
        open={open}
        onClose={() => setOpen(false)}
        featureName="Newsletter subscriptions"
        title="Newsletter subscriptions are a premium feature"
        description="The full newsletter system — Sanity persistence, rate limiting, branded welcome emails, and unsubscribe flow — is part of the premium GoFarm code package."
        bullets={[
          "Sanity-backed subscriber storage with duplicate detection",
          "Rate-limited subscribe API + branded welcome email",
          "User profile subscription management & unsubscribe flow",
        ]}
      />
    </section>
  );
};

export default NewsletterSection;
