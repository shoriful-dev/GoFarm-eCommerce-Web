"use client";

import { useState } from "react";
import PremiumDialog from "./PremiumDialog";

const NewsletterForm = () => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-2 border border-gofarm-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-gofarm-light-green focus:border-gofarm-light-green transition-all text-gofarm-black placeholder:text-gofarm-gray"
        />
        <button
          type="submit"
          className="w-full bg-gofarm-green text-gofarm-white px-4 py-2 rounded-lg hover:bg-gofarm-light-green transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          Subscribe
        </button>
      </form>

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
    </div>
  );
};

export default NewsletterForm;
