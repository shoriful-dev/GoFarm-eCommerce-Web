import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { adminAuth } from "@/lib/firebase-admin";

interface CouponValidationRequest {
  code: string;
  subtotal: number;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usageLimitPerUser: number;
  timesUsed: number;
  startDate: string;
  expiryDate?: string;
  isActive: boolean;
  applicableProducts?: Array<{ _ref: string }>;
  applicableCategories?: Array<{ _ref: string }>;
  excludedProducts?: Array<{ _ref: string }>;
  firstOrderOnly: boolean;
  userRestrictions?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    let userUid: string | null = null;
    let userEmail: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userUid = decodedToken.uid;
        userEmail = decodedToken.email || null;
      } catch (error) {
        // Continue without auth for guest checkout
      }
    }

    const body: CouponValidationRequest = await req.json();
    const { code, subtotal, cartItems } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Fetch coupon from Sanity
    const coupon: Coupon | null = await client.fetch(
      `*[_type == "coupon" && code == $code][0]{
        _id,
        code,
        discountType,
        discountValue,
        minimumOrderAmount,
        maxDiscountAmount,
        usageLimit,
        usageLimitPerUser,
        timesUsed,
        startDate,
        expiryDate,
        isActive,
        applicableProducts[]->{ _id },
        applicableCategories[]->{ _id },
        excludedProducts[]->{ _id },
        firstOrderOnly,
        userRestrictions
      }`,
      { code: code.toUpperCase().trim() }
    );

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Validation checks
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, message: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(coupon.startDate);

    if (startDate > now) {
      return NextResponse.json(
        { success: false, message: "This coupon is not yet active" },
        { status: 400 }
      );
    }

    if (coupon.expiryDate) {
      const expiryDate = new Date(coupon.expiryDate);
      if (expiryDate < now) {
        return NextResponse.json(
          { success: false, message: "This coupon has expired" },
          { status: 400 }
        );
      }
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, message: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check per-user usage limit (if user is authenticated)
    if (userUid && coupon.usageLimitPerUser > 0) {
      const userUsageCount = await client.fetch(
        `count(*[_type == "order" && firebaseUid == $userUid && coupon.code == $code])`,
        { userUid, code: coupon.code }
      );

      if (userUsageCount >= coupon.usageLimitPerUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You have already used this coupon the maximum number of times",
          },
          { status: 400 }
        );
      }
    }

    // Check user restrictions
    if (coupon.userRestrictions && coupon.userRestrictions.length > 0) {
      if (!userUid && !userEmail) {
        return NextResponse.json(
          { success: false, message: "This coupon requires authentication" },
          { status: 401 }
        );
      }

      const isAllowed =
        (userEmail && coupon.userRestrictions.includes(userEmail)) ||
        (userUid && coupon.userRestrictions.includes(userUid));

      if (!isAllowed) {
        return NextResponse.json(
          {
            success: false,
            message: "This coupon is not available for your account",
          },
          { status: 403 }
        );
      }
    }

    // Check first order only restriction
    if (coupon.firstOrderOnly && userUid) {
      const orderCount = await client.fetch(
        `count(*[_type == "order" && firebaseUid == $userUid])`,
        { userUid }
      );

      if (orderCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "This coupon is only valid for first-time orders",
          },
          { status: 400 }
        );
      }
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount > 0 && subtotal < coupon.minimumOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of $${coupon.minimumOrderAmount.toFixed(
            2
          )} required`,
        },
        { status: 400 }
      );
    }

    // Check product/category restrictions
    // Only check if specific products or categories are defined
    // If not defined, coupon applies to entire order
    if (cartItems && cartItems.length > 0) {
      const productIds = cartItems.map((item) => item.productId);

      // Fetch product details with categories
      const products = await client.fetch(
        `*[_type == "product" && _id in $productIds]{
          _id,
          categories[]->{ _id }
        }`,
        { productIds }
      );

      // Check excluded products (always check if defined)
      if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const excludedIds = coupon.excludedProducts.map((p: any) => p._id);
        const hasExcluded = productIds.some((id) => excludedIds.includes(id));

        if (hasExcluded) {
          return NextResponse.json(
            {
              success: false,
              message: "Some items in your cart are excluded from this coupon",
            },
            { status: 400 }
          );
        }
      }

      // Only check applicable products if specifically defined
      // If empty/undefined, applies to all products
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const applicableIds = coupon.applicableProducts.map((p: any) => p._id);
        const hasApplicable = productIds.some((id) =>
          applicableIds.includes(id)
        );

        if (!hasApplicable) {
          return NextResponse.json(
            {
              success: false,
              message: "This coupon is not applicable to items in your cart",
            },
            { status: 400 }
          );
        }
      }

      // Only check applicable categories if specifically defined
      // If empty/undefined, applies to all categories
      if (
        coupon.applicableCategories &&
        coupon.applicableCategories.length > 0
      ) {
        const applicableCategoryIds = coupon.applicableCategories.map(
          (c: any) => c._id
        );
        const productCategoryIds = products.flatMap((p: any) =>
          p.categories ? p.categories.map((c: any) => c._id) : []
        );

        const hasApplicableCategory = productCategoryIds.some((id: string) =>
          applicableCategoryIds.includes(id)
        );

        if (!hasApplicableCategory) {
          return NextResponse.json(
            {
              success: false,
              message: "This coupon is not applicable to items in your cart",
            },
            { status: 400 }
          );
        }
      }
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;

      // Apply max discount limit if specified
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
      message: `Coupon applied! You saved $${discountAmount.toFixed(2)}`,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
