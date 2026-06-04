import { client } from "@/sanity/lib/client";

/**
 * Default values used as a fallback when the storeSettings document hasn't
 * been published yet. These should mirror the schema's `initialValue`s.
 */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  currency: "USD",
  currencySymbol: "$",
  freeShippingThreshold: 100,
  shippingFlatRate: 10,
  taxRate: 0,
  lowStockThreshold: 5,
  loyaltyPointsPerDollar: 1,
  loyaltyPointValue: 0.01,
  supportEmail: null,
  supportPhone: null,
};

export interface StoreSettings {
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  shippingFlatRate: number;
  /** Decimal tax rate, 0..1 (e.g. 0.05 = 5%). */
  taxRate: number;
  lowStockThreshold: number;
  loyaltyPointsPerDollar: number;
  loyaltyPointValue: number;
  supportEmail: string | null;
  supportPhone: string | null;
}

export const STORE_SETTINGS_QUERY = /* groq */ `
  *[_type == "storeSettings"][0]{
    currency,
    currencySymbol,
    freeShippingThreshold,
    shippingFlatRate,
    taxRate,
    lowStockThreshold,
    loyaltyPointsPerDollar,
    loyaltyPointValue,
    supportEmail,
    supportPhone
  }
`;

/**
 * Fetch the singleton `storeSettings` document, falling back to the
 * package-level defaults when fields are missing or the document doesn't
 * exist yet. Use this from server components / route handlers.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const raw = await client.fetch<Partial<StoreSettings> | null>(
      STORE_SETTINGS_QUERY,
    );
    return mergeWithDefaults(raw);
  } catch (err) {
    console.error("getStoreSettings failed, using defaults:", err);
    return DEFAULT_STORE_SETTINGS;
  }
}

function mergeWithDefaults(raw: Partial<StoreSettings> | null): StoreSettings {
  if (!raw) return DEFAULT_STORE_SETTINGS;
  return {
    currency: raw.currency ?? DEFAULT_STORE_SETTINGS.currency,
    currencySymbol: raw.currencySymbol ?? DEFAULT_STORE_SETTINGS.currencySymbol,
    freeShippingThreshold:
      typeof raw.freeShippingThreshold === "number"
        ? raw.freeShippingThreshold
        : DEFAULT_STORE_SETTINGS.freeShippingThreshold,
    shippingFlatRate:
      typeof raw.shippingFlatRate === "number"
        ? raw.shippingFlatRate
        : DEFAULT_STORE_SETTINGS.shippingFlatRate,
    taxRate:
      typeof raw.taxRate === "number"
        ? raw.taxRate
        : DEFAULT_STORE_SETTINGS.taxRate,
    lowStockThreshold:
      typeof raw.lowStockThreshold === "number"
        ? raw.lowStockThreshold
        : DEFAULT_STORE_SETTINGS.lowStockThreshold,
    loyaltyPointsPerDollar:
      typeof raw.loyaltyPointsPerDollar === "number"
        ? raw.loyaltyPointsPerDollar
        : DEFAULT_STORE_SETTINGS.loyaltyPointsPerDollar,
    loyaltyPointValue:
      typeof raw.loyaltyPointValue === "number"
        ? raw.loyaltyPointValue
        : DEFAULT_STORE_SETTINGS.loyaltyPointValue,
    supportEmail: raw.supportEmail ?? null,
    supportPhone: raw.supportPhone ?? null,
  };
}

/**
 * Compute the shipping fee given a subtotal and the active settings.
 */
export function computeShipping(
  subtotalAfterCoupon: number,
  settings: StoreSettings,
): number {
  if (subtotalAfterCoupon >= settings.freeShippingThreshold) return 0;
  return settings.shippingFlatRate;
}

/**
 * Compute the tax amount given a subtotal and the active settings.
 */
export function computeTax(
  subtotalAfterCoupon: number,
  settings: StoreSettings,
): number {
  return subtotalAfterCoupon * settings.taxRate;
}
