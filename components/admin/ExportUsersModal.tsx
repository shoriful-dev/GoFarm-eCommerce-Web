"use client";

import { FC, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Download,
  Globe,
  Mail,
  RefreshCw,
  AlertTriangle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExportScope = "page" | "all" | "oauth" | "password";

export interface ExportPreview {
  total: number;
  filtered: number;
  query: string;
  counts: Record<ExportScope, number>;
  providers: Array<{ id: string; count: number }>;
  multiProviderCount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: ExportScope) => Promise<void> | void;
  /** Page size used when computing the "current page" count. */
  perPage: number;
  /** Zero-based current page. */
  currentPage: number;
  /** Active search term (already debounced). */
  query: string;
  /** Whether the parent is currently downloading. */
  isExporting: boolean;
}

const SCOPE_META: Record<
  ExportScope,
  { label: string; description: string; icon: React.ReactNode }
> = {
  page: {
    label: "Current page only",
    description:
      "Just the rows visible on the page, honoring search + pagination.",
    icon: <Users className="h-4 w-4" />,
  },
  all: {
    label: "All users",
    description: "Every user in the dataset. Honors the active search filter.",
    icon: <Users className="h-4 w-4" />,
  },
  oauth: {
    label: "OAuth users only",
    description:
      "Users who signed in via Google, Facebook, Apple, GitHub, etc.",
    icon: <Globe className="h-4 w-4" />,
  },
  password: {
    label: "Email + password only",
    description:
      "Users who registered with an email and password (no OAuth provider).",
    icon: <Mail className="h-4 w-4" />,
  },
};

const PROVIDER_DISPLAY: Record<string, string> = {
  "google.com": "Google",
  "facebook.com": "Facebook",
  "apple.com": "Apple",
  "github.com": "GitHub",
  "twitter.com": "Twitter / X",
  "microsoft.com": "Microsoft",
  "yahoo.com": "Yahoo",
  password: "Email + password",
  phone: "Phone",
  anonymous: "Anonymous",
};

export const ExportUsersModal: FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  perPage,
  currentPage,
  query,
  isExporting,
}) => {
  const [scope, setScope] = useState<ExportScope>("all");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh the preview each time the modal is opened — counts can drift
  // between sessions and we want the admin to see something current.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        params.set("limit", String(perPage));
        params.set("offset", String(currentPage * perPage));
        const res = await fetch(
          `/api/admin/users/export/preview?${params.toString()}`,
          { credentials: "include" },
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error || `Preview failed (${res.status})`);
        if (!cancelled) setPreview(json as ExportPreview);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, perPage, currentPage, query]);

  const formatNumber = (n: number) => n.toLocaleString();

  const handleConfirm = async () => {
    await onConfirm(scope);
  };

  const selectedCount = preview?.counts[scope] ?? 0;
  const showQueryBanner = !!preview?.query;
  const isHugeExport = scope === "all" && (preview?.counts.all ?? 0) > 10_000;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export users to CSV
          </DialogTitle>
          <DialogDescription>
            Pick which slice of the user list to download. The CSV opens cleanly
            in Excel, Google Sheets, and Numbers.
          </DialogDescription>
        </DialogHeader>

        {showQueryBanner && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              Active search:{" "}
              <span className="font-medium">&quot;{preview?.query}&quot;</span>{" "}
              — counts below reflect the filtered list, not every user in your
              project.
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Total: {loading ? "…" : formatNumber(preview?.total ?? 0)}
            </Badge>
            {preview && preview.filtered !== preview.total && (
              <Badge variant="secondary" className="gap-1">
                Matching search: {formatNumber(preview.filtered)}
              </Badge>
            )}
            {preview && preview.multiProviderCount > 0 && (
              <Badge variant="outline" className="gap-1">
                Linked accounts (multi-provider):{" "}
                {formatNumber(preview.multiProviderCount)}
              </Badge>
            )}
          </div>

          {/* Provider breakdown */}
          {preview && preview.providers.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Sign-in providers in this dataset
              </div>
              <div className="flex flex-wrap gap-2">
                {preview.providers.map((p) => (
                  <Badge key={p.id} variant="secondary" className="text-xs">
                    {PROVIDER_DISPLAY[p.id] || p.id}: {formatNumber(p.count)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Scope picker */}
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as ExportScope)}
            className="space-y-2"
          >
            {(Object.keys(SCOPE_META) as ExportScope[]).map((key) => {
              const meta = SCOPE_META[key];
              const count = preview?.counts[key] ?? 0;
              const disabled = !loading && count === 0;
              return (
                <Label
                  key={key}
                  htmlFor={`scope-${key}`}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                    scope === key
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <RadioGroupItem
                    id={`scope-${key}`}
                    value={key}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-medium">
                        {meta.icon}
                        {meta.label}
                      </div>
                      <Badge
                        variant={scope === key ? "default" : "outline"}
                        className="shrink-0"
                      >
                        {loading ? "…" : `${formatNumber(count)} users`}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {meta.description}
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          {isHugeExport && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Large export: the file may take a moment to generate and could be
              hundreds of MB depending on column data.
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || isExporting || selectedCount === 0 || !!error}
            className="gap-2"
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export {formatNumber(selectedCount)} user
            {selectedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportUsersModal;
