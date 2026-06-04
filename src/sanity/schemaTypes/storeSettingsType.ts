import { defineField, defineType } from "sanity";
import { Settings } from "lucide-react";

/**
 * Singleton document holding global store configuration that the storefront
 * reads at runtime: free-shipping threshold, flat shipping rate, tax rate,
 * currency, low-stock threshold, etc. Edit at /studio.
 *
 * Fetched via `*[_type == "storeSettings"][0]` (see GET /api/store-settings).
 */
export const storeSettingsType = defineType({
  name: "storeSettings",
  title: "Store Settings",
  type: "document",
  icon: Settings,
  fields: [
    defineField({
      name: "label",
      title: "Internal Label",
      type: "string",
      description:
        "Identifies this configuration document in the studio list. Only one document of this type should exist.",
      initialValue: "Default store settings",
      validation: (Rule) => Rule.required(),
    }),

    // -----------------------------------------------------------------
    // Money / shipping
    // -----------------------------------------------------------------
    defineField({
      name: "currency",
      title: "Currency code",
      type: "string",
      description: "ISO 4217 currency code (e.g. USD, BDT, EUR).",
      initialValue: "USD",
      validation: (Rule) => Rule.required().min(3).max(3).uppercase(),
    }),
    defineField({
      name: "currencySymbol",
      title: "Currency symbol",
      type: "string",
      description: "Symbol shown in prices (e.g. $, ৳, €).",
      initialValue: "$",
    }),
    defineField({
      name: "freeShippingThreshold",
      title: "Free shipping threshold",
      type: "number",
      description:
        "Order subtotal (after coupon) at which shipping becomes free.",
      initialValue: 100,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "shippingFlatRate",
      title: "Flat shipping rate",
      type: "number",
      description:
        "Shipping fee charged when the order is below the free-shipping threshold.",
      initialValue: 10,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "taxRate",
      title: "Tax rate",
      type: "number",
      description:
        "Decimal tax rate applied on subtotal-after-coupon (e.g. 0.05 for 5%).",
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0).max(1),
    }),

    // -----------------------------------------------------------------
    // Inventory
    // -----------------------------------------------------------------
    defineField({
      name: "lowStockThreshold",
      title: "Low-stock threshold",
      type: "number",
      description:
        "When a product's stock drops to this number or below, the storefront shows a low-stock badge.",
      initialValue: 5,
      validation: (Rule) => Rule.required().min(0).integer(),
    }),

    // -----------------------------------------------------------------
    // Loyalty / wallet
    // -----------------------------------------------------------------
    defineField({
      name: "loyaltyPointsPerDollar",
      title: "Loyalty points per currency unit",
      type: "number",
      description:
        "How many loyalty points the customer earns per 1 unit of currency spent.",
      initialValue: 1,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "loyaltyPointValue",
      title: "Loyalty point value",
      type: "number",
      description:
        "How much one loyalty point is worth (in currency units) when redeemed.",
      initialValue: 0.01,
      validation: (Rule) => Rule.min(0),
    }),

    // -----------------------------------------------------------------
    // Storefront copy
    // -----------------------------------------------------------------
    defineField({
      name: "supportEmail",
      title: "Support email",
      type: "string",
    }),
    defineField({
      name: "supportPhone",
      title: "Support phone",
      type: "string",
    }),
  ],
  preview: {
    select: {
      label: "label",
      currency: "currency",
      threshold: "freeShippingThreshold",
    },
    prepare({ label, currency, threshold }) {
      return {
        title: label || "Store Settings",
        subtitle:
          `Free shipping over ${currency || ""} ${threshold ?? ""}`.trim(),
      };
    },
  },
});
