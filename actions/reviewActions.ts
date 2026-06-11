'use server';

import { client } from '@/sanity/lib/client';
import { getAuthUserId } from '@/lib/auth/server';

interface ReviewEligibilityResponse {
  canReview: boolean;
  hasPurchased: boolean;
  hasAlreadyReviewed: boolean;
}

export async function canUserReviewProduct(productId: string): Promise<ReviewEligibilityResponse> {
  try {
    const firebaseUid = await getAuthUserId();
    if (!firebaseUid) {
      return {
        canReview: false,
        hasPurchased: false,
        hasAlreadyReviewed: false,
      };
    }

    // 1. Get Sanity User ID corresponding to Firebase UID
    const sanityUser = await client.fetch<{ _id: string } | null>(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]{ _id }`,
      { firebaseUid }
    );

    if (!sanityUser) {
      return {
        canReview: false,
        hasPurchased: false,
        hasAlreadyReviewed: false,
      };
    }

    // 2. Check if user already reviewed this product
    const existingReview = await client.fetch(
      `*[_type == "review" && product._ref == $productId && user._ref == $userId][0]`,
      { productId, userId: sanityUser._id }
    );

    const hasAlreadyReviewed = !!existingReview;

    // 3. Check if user purchased the product and order status is "delivered" or "completed" or similar
    const orders = await client.fetch<any[]>(
      `*[_type == "order" && firebaseUid == $firebaseUid]`,
      { firebaseUid }
    );

    let hasPurchased = false;
    for (const order of orders) {
      const containsProduct = order.products?.some(
        (p: any) => p.product?._ref === productId
      );
      // Considered purchased if order exists and payment is paid or status is completed/delivered
      if (
        containsProduct &&
        (order.paymentStatus === 'paid' ||
          order.status === 'delivered' ||
          order.status === 'completed')
      ) {
        hasPurchased = true;
        break;
      }
    }

    // A user can review if they purchased and haven't reviewed yet
    const canReview = hasPurchased && !hasAlreadyReviewed;

    return {
      canReview,
      hasPurchased,
      hasAlreadyReviewed,
    };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      canReview: false,
      hasPurchased: false,
      hasAlreadyReviewed: false,
    };
  }
}
