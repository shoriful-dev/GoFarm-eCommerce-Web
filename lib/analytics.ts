// Centralized analytics service for Firebase event tracking

import { analytics, getAnalyticsAsync } from "../lib/firebase";
import {
  logEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from "firebase/analytics";

// ---------------------------------------------------------------------------
//  GA4 reserved event params (subset)
//  Keeping these typed so call sites get help producing valid Realtime data.
// ---------------------------------------------------------------------------

export type GA4Item = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
};

// ---------------------------------------------------------------------------
//  Legacy event-param shapes (kept for back-compat with existing call sites).
//  Internally normalised into GA4 shape below.
// ---------------------------------------------------------------------------

type AddToCartParams = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  userId?: string;
  currency?: string;
  category?: string;
};

type RemoveFromCartParams = AddToCartParams;

type OrderPlacedParams = {
  orderId: string;
  amount: number;
  status: string;
  userId?: string;
};

type OrderStatusUpdateParams = {
  orderId: string;
  status: string;
  userId?: string;
};

type UserRegistrationParams = {
  userId: string;
  email: string;
};

type UserLoginParams = UserRegistrationParams;

type ProductViewParams = {
  productId: string;
  name: string;
  userId?: string;
  price?: number;
  currency?: string;
  category?: string;
};

// ---------------------------------------------------------------------------
//  User identity (call from AnalyticsProvider on auth changes)
// ---------------------------------------------------------------------------

export async function setAnalyticsUser(
  uid: string,
  properties: Record<string, string | number | boolean | undefined> = {},
) {
  const a = (await getAnalyticsAsync()) ?? analytics;
  if (!a) return;
  try {
    setUserId(a, uid);
    if (Object.keys(properties).length > 0) {
      setUserProperties(a, properties as Record<string, string>);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics] setAnalyticsUser failed", err);
    }
  }
}

export async function clearAnalyticsUser() {
  const a = (await getAnalyticsAsync()) ?? analytics;
  if (!a) return;
  try {
    setUserId(a, null);
  } catch {
    /* no-op */
  }
}

// ---------------------------------------------------------------------------
//  Low-level event helper
// ---------------------------------------------------------------------------

/**
 * Safely fire a Firebase Analytics / GA4 event.
 * No-op when the SDK isn't initialised (server, ad-blocked, opted out).
 *
 * Prefer the typed helpers below — they ensure GA4 reserved params are used
 * so the Firebase Realtime / Monetisation reports auto-populate.
 */
export function trackEvent(
  eventName: string,
  eventParams: Record<
    string,
    string | number | boolean | undefined | unknown[] | Record<string, unknown>
  > = {},
) {
  if (typeof window !== "undefined" && analytics) {
    try {
      logEvent(analytics as Analytics, eventName, eventParams);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Analytics] logEvent(${eventName}) failed`, err);
      }
    }
  } else if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development"
  ) {
    // Analytics not yet ready — queue via the async getter and replay.
    getAnalyticsAsync().then((a) => {
      if (a) {
        try {
          logEvent(a, eventName, eventParams);
        } catch {
          /* no-op */
        }
      } else {
        console.log(`[Analytics:dev] ${eventName}`, eventParams);
      }
    });
  }
}

// ---------------------------------------------------------------------------
//  Internal: normalise legacy params → GA4 items[]
// ---------------------------------------------------------------------------

function toGA4Item(p: {
  productId: string;
  name: string;
  price?: number;
  quantity?: number;
  category?: string;
  currency?: string;
}): GA4Item {
  return {
    item_id: p.productId,
    item_name: p.name,
    item_category: p.category,
    price: p.price,
    quantity: p.quantity,
    currency: p.currency,
  };
}

// E-commerce specific events
export function trackAddToCart(params: AddToCartParams) {
  const item = toGA4Item(params);
  trackEvent("add_to_cart", {
    currency: params.currency ?? "USD",
    value: (params.price ?? 0) * (params.quantity ?? 1),
    items: [item],
    user_id: params.userId,
  });
}

export function trackRemoveFromCart(params: RemoveFromCartParams) {
  const item = toGA4Item(params);
  trackEvent("remove_from_cart", {
    currency: params.currency ?? "USD",
    value: (params.price ?? 0) * (params.quantity ?? 1),
    items: [item],
    user_id: params.userId,
  });
}

export function trackOrderPlaced(params: OrderPlacedParams) {
  // Legacy event kept for any existing reports; the canonical GA4 event for
  // revenue is `purchase` (fired from trackPurchase / server webhook).
  trackEvent("order_placed", {
    transaction_id: params.orderId,
    value: params.amount,
    status: params.status,
    user_id: params.userId,
  });
}

export function trackOrderStatusUpdate(params: OrderStatusUpdateParams) {
  trackEvent("order_status_update", {
    transaction_id: params.orderId,
    status: params.status,
    user_id: params.userId,
  });
}

export function trackUserRegistration(params: UserRegistrationParams) {
  // GA4 reserved name is `sign_up`. Keep both for back-compat.
  trackEvent("sign_up", { method: "email", user_id: params.userId });
}

export function trackUserLogin(params: UserLoginParams) {
  // GA4 reserved name is `login`.
  trackEvent("login", { method: "email", user_id: params.userId });
}

export function trackProductView(params: ProductViewParams) {
  // GA4 reserved name is `view_item`.
  const item = toGA4Item(params);
  trackEvent("view_item", {
    currency: params.currency ?? "USD",
    value: params.price ?? 0,
    items: [item],
    user_id: params.userId,
  });
}

// Additional e-commerce tracking functions
export function trackCartView(userId?: string) {
  trackEvent("view_cart", { user_id: userId });
}

export function trackCheckoutStarted(params: {
  userId?: string;
  cartValue: number;
  itemCount: number;
  items?: GA4Item[];
  currency?: string;
  coupon?: string;
}) {
  trackEvent("begin_checkout", {
    currency: params.currency ?? "USD",
    value: params.cartValue,
    items: params.items ?? [],
    coupon: params.coupon,
    user_id: params.userId,
    item_count: params.itemCount,
  });
}

export function trackSearchPerformed(params: {
  searchTerm: string;
  userId?: string;
  resultCount?: number;
}) {
  trackEvent("search", params);
}

export function trackCategoryView(params: {
  categoryId: string;
  categoryName: string;
  userId?: string;
}) {
  trackEvent("view_category", params);
}

export function trackWishlistAdd(params: {
  productId: string;
  name: string;
  userId?: string;
}) {
  trackEvent("add_to_wishlist", params);
}

export function trackWishlistRemove(params: {
  productId: string;
  name: string;
  userId?: string;
}) {
  trackEvent("remove_from_wishlist", params);
}

export function trackPageView(params: {
  pagePath: string;
  pageTitle?: string;
  userId?: string;
}) {
  trackEvent("page_view", params);
}

// Advanced e-commerce tracking
export function trackPurchase(params: {
  orderId: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: Array<{
    productId: string;
    name: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
  userId?: string;
}) {
  trackEvent("purchase", {
    transaction_id: params.orderId,
    value: params.value,
    currency: params.currency ?? "USD",
    tax: params.tax,
    shipping: params.shipping,
    coupon: params.coupon,
    items: params.items.map(toGA4Item),
    user_id: params.userId,
  });
}

export function trackBestSellingProducts(params: {
  products: Array<{
    productId: string;
    name: string;
    category?: string;
    salesCount: number;
    revenue: number;
  }>;
  timeframe: string; // e.g., "weekly", "monthly"
}) {
  trackEvent("best_selling_products", params);
}

export function trackOrderDetails(params: {
  orderId: string;
  orderNumber: string;
  status: string;
  value: number;
  itemCount: number;
  paymentMethod: string;
  shippingMethod?: string;
  userId?: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}) {
  trackEvent("order_details", params);
}

export function trackOrderFullfillment(params: {
  orderId: string;
  status: string;
  previousStatus: string;
  value: number;
  fulfillmentTime?: number; // in hours/days
  userId?: string;
}) {
  trackEvent("order_fulfillment", params);
}

export function trackInventoryAction(params: {
  productId: string;
  name: string;
  action: "restock" | "low_stock" | "out_of_stock";
  currentStock: number;
  previousStock?: number;
}) {
  trackEvent("inventory_action", params);
}

/**
 * Track customer lifetime analytics
 */
export function trackCustomerLifetime(
  userId: string,
  totalSpent: number,
  orderCount: number,
  avgOrderValue: number,
) {
  if (typeof window !== "undefined" && analytics) {
    logEvent(analytics, "customer_lifetime_value", {
      user_id: userId,
      total_spent: totalSpent,
      order_count: orderCount,
      average_order_value: avgOrderValue,
      ltv_segment:
        totalSpent > 1000
          ? "high_value"
          : totalSpent > 500
            ? "medium_value"
            : "low_value",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track product search events
 */
export function trackProductSearch(
  searchTerm: string,
  resultsCount: number,
  category?: string,
  filters?: Record<string, string | number | boolean>,
) {
  if (typeof window !== "undefined" && analytics) {
    logEvent(analytics, "search", {
      search_term: searchTerm,
      results_count: resultsCount,
      category: category || "all",
      filters: JSON.stringify(filters || {}),
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track category view events with enhanced data
 */
export function trackCategoryViewEnhanced(
  categoryName: string,
  categoryId: string,
  productCount: number,
) {
  if (typeof window !== "undefined" && analytics) {
    logEvent(analytics, "view_item_list", {
      item_list_id: categoryId,
      item_list_name: categoryName,
      items_count: productCount,
      list_type: "category",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track enhanced user registration events
 */
export function trackUserRegistrationEnhanced(
  userId: string,
  registrationMethod: "email" | "google" | "facebook" | "other",
) {
  if (typeof window !== "undefined" && analytics) {
    logEvent(analytics, "sign_up", {
      method: registrationMethod,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track enhanced user login events
 */
export function trackUserLoginEnhanced(
  userId: string,
  loginMethod: "email" | "google" | "facebook" | "other",
) {
  if (typeof window !== "undefined" && analytics) {
    logEvent(analytics, "login", {
      method: loginMethod,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Add more as needed for your analytics needs
