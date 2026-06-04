"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/lib/store-settings";

// Module-level memo so multiple consumers share one fetch per session.
let cached: StoreSettings | null = null;
let inflight: Promise<StoreSettings> | null = null;

async function loadStoreSettings(): Promise<StoreSettings> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/store-settings", { cache: "force-cache" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as StoreSettings;
      cached = json;
      return json;
    } catch (err) {
      console.error("useStoreSettings: falling back to defaults", err);
      cached = DEFAULT_STORE_SETTINGS;
      return DEFAULT_STORE_SETTINGS;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Reads the store-wide configuration document from `/api/store-settings`.
 * Returns the package defaults until the request resolves so callers can
 * render synchronously without flashes.
 */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(
    cached ?? DEFAULT_STORE_SETTINGS,
  );

  useEffect(() => {
    let active = true;
    loadStoreSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
