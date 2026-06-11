'use server';

import { writeClient } from '@/sanity/lib/client';
import { getAuthUserId } from '@/lib/auth/server';

export async function requestOrderCancellation(orderId: string, reason: string) {
  try {
    const firebaseUid = await getAuthUserId();
    if (!firebaseUid) {
      return { success: false, message: 'Unauthorized' };
    }

    const result = await writeClient
      .patch(orderId)
      .set({
        cancellationRequested: true,
        cancellationRequestedAt: new Date().toISOString(),
        cancellationRequestReason: reason || 'Cancelled by customer',
      })
      .commit();

    return {
      success: true,
      message: 'Cancellation request submitted successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Error in requestOrderCancellation:', error);
    return { success: false, message: error.message || 'Failed to request cancellation' };
  }
}
