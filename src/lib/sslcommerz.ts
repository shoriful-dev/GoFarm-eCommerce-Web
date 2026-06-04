import crypto from "crypto";

// SSLCommerz Configuration
export const SSLCOMMERZ_CONFIG = {
  storeId: process.env.SSLCOMMERZ_STORE_ID || "",
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
  isLive: process.env.SSLCOMMERZ_IS_LIVE === "true",
  apiUrl:
    process.env.SSLCOMMERZ_IS_LIVE === "true"
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com",
};

export interface SSLCommerzInitData {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  emi_option?: number;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_city: string;
  cus_state?: string;
  cus_postcode: string;
  cus_country: string;
  cus_phone: string;
  shipping_method?: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  num_of_item?: number;
  ship_name: string;
  ship_add1: string;
  ship_city: string;
  ship_state?: string;
  ship_postcode: string;
  ship_country: string;
  ship_phone?: string;
  value_a?: string; // Custom field for order ID
  value_b?: string; // Custom field for order number
  value_c?: string; // Custom field for user ID
  value_d?: string; // Custom field
}

export interface SSLCommerzValidationData {
  val_id: string;
  store_id: string;
  store_passwd: string;
  format?: string;
}

export interface SSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gw?: {
    visa?: string;
    master?: string;
    amex?: string;
    othercards?: string;
  };
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  redirectGatewayURLFailed?: string;
  GatewayPageURL?: string;
  storeBanner?: string;
  storeLogo?: string;
  desc?: string[];
  is_direct_pay_enable?: string;
}

export interface SSLCommerzValidationResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  risk_title: string;
  risk_level: string;
  APIConnect: string;
  validated_on: string;
  gw_version: string;
}

/**
 * Initialize SSLCommerz payment session
 */
export async function initSSLCommerzPayment(
  data: SSLCommerzInitData
): Promise<SSLCommerzResponse> {
  const formData = new URLSearchParams({
    store_id: SSLCOMMERZ_CONFIG.storeId,
    store_passwd: SSLCOMMERZ_CONFIG.storePassword,
    total_amount: data.total_amount.toString(),
    currency: data.currency,
    tran_id: data.tran_id,
    success_url: data.success_url,
    fail_url: data.fail_url,
    cancel_url: data.cancel_url,
    cus_name: data.cus_name,
    cus_email: data.cus_email,
    cus_add1: data.cus_add1,
    cus_city: data.cus_city,
    cus_postcode: data.cus_postcode,
    cus_country: data.cus_country,
    cus_phone: data.cus_phone,
    product_name: data.product_name,
    product_category: data.product_category,
    product_profile: data.product_profile,
    shipping_method: data.shipping_method || "NO",
    num_of_item: (data.num_of_item || 1).toString(),
    emi_option: (data.emi_option || 0).toString(),
    ship_name: data.ship_name,
    ship_add1: data.ship_add1,
    ship_city: data.ship_city,
    ship_postcode: data.ship_postcode,
    ship_country: data.ship_country,
  });

  // Add optional fields
  if (data.cus_state) formData.append("cus_state", data.cus_state);
  if (data.ship_state) formData.append("ship_state", data.ship_state);
  if (data.ship_phone) formData.append("ship_phone", data.ship_phone);
  if (data.ipn_url) formData.append("ipn_url", data.ipn_url);
  if (data.value_a) formData.append("value_a", data.value_a);
  if (data.value_b) formData.append("value_b", data.value_b);
  if (data.value_c) formData.append("value_c", data.value_c);
  if (data.value_d) formData.append("value_d", data.value_d);

  try {
    const response = await fetch(
      `${SSLCOMMERZ_CONFIG.apiUrl}/gwprocess/v4/api.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`SSLCommerz API error: ${response.statusText}`);
    }

    const result: SSLCommerzResponse = await response.json();

    if (result.status !== "SUCCESS") {
      console.error(
        "❌ SSLCommerz payment initialization failed:",
        result.failedreason
      );
      throw new Error(
        result.failedreason || "Failed to initialize SSLCommerz payment"
      );
    }

    return result;
  } catch (error) {
    console.error("❌ SSLCommerz initialization error:", error);
    throw error;
  }
}

/**
 * Validate SSLCommerz payment
 */
export async function validateSSLCommerzPayment(
  valId: string
): Promise<SSLCommerzValidationResponse> {
  const validationData: SSLCommerzValidationData = {
    val_id: valId,
    store_id: SSLCOMMERZ_CONFIG.storeId,
    store_passwd: SSLCOMMERZ_CONFIG.storePassword,
    format: "json",
  };

  try {
    const formData = new URLSearchParams({
      val_id: validationData.val_id,
      store_id: validationData.store_id,
      store_passwd: validationData.store_passwd,
      format: validationData.format || "json",
    });

    const validationUrl = `${SSLCOMMERZ_CONFIG.apiUrl}/validator/api/validationserverAPI.php`;

    const response = await fetch(validationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Validation failed. Response body:", errorText);
      throw new Error(
        `SSLCommerz validation error: ${response.statusText} - ${errorText}`
      );
    }

    const result: SSLCommerzValidationResponse = await response.json();

    if (result.status !== "VALID" && result.status !== "VALIDATED") {
      throw new Error("Payment validation failed");
    }

    return result;
  } catch (error) {
    console.error("SSLCommerz validation error:", error);
    throw error;
  }
}

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(orderId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `${orderId}-${timestamp}-${random}`;
}

/**
 * Verify IPN (Instant Payment Notification) hash
 */
export function verifyIPNHash(data: Record<string, string>): boolean {
  const { verify_sign, verify_key, ...rest } = data;

  if (!verify_sign || !verify_key) {
    return false;
  }

  // Sort keys and create hash string
  const sortedKeys = Object.keys(rest).sort();
  const hashString = sortedKeys.map((key) => `${key}=${rest[key]}`).join("&");

  // Generate MD5 hash
  const hash = crypto
    .createHash("md5")
    .update(hashString + SSLCOMMERZ_CONFIG.storePassword)
    .digest("hex");

  return hash === verify_sign;
}

export default {
  initSSLCommerzPayment,
  validateSSLCommerzPayment,
  generateTransactionId,
  verifyIPNHash,
  SSLCOMMERZ_CONFIG,
};
