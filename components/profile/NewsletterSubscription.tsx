"use client";

import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumDialog from "@/components/PremiumDialog";

export default function NewsletterSubscription() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Newsletter Subscription
        </CardTitle>
        <CardDescription>
          Manage your newsletter subscription preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-gofarm-light-orange/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gofarm-orange">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gofarm-black">Premium feature</p>
              <p className="text-sm text-gofarm-gray">
                Newsletter subscription management is available in the premium
                version.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-gofarm-orange hover:bg-gofarm-green text-white"
          >
            Learn more
          </Button>
        </div>
      </CardContent>

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
    </Card>
  );
}
