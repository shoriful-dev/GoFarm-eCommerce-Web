'use server';

import { client, writeClient } from '@/sanity/lib/client';
import { getAuthUserId } from '@/lib/auth/server';

// helper to get employee email/name for history tracking
async function getEmployeeInfo() {
  const firebaseUid = await getAuthUserId();
  if (!firebaseUid) return { email: 'System', name: 'System', role: 'system' };

  try {
    const emp = await client.fetch<{
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    } | null>(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]{ email, firstName, lastName, role }`,
      { firebaseUid }
    );
    if (emp) {
      return {
        email: emp.email,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        role: emp.role || 'employee',
      };
    }
  } catch (err) {
    console.error('Error fetching employee info:', err);
  }
  return { email: 'System', name: 'System', role: 'system' };
}

export async function getOrdersForEmployee() {
  try {
    return await client.fetch(`*[_type == "order"] | order(orderDate desc)`);
  } catch (error) {
    console.error('Error in getOrdersForEmployee:', error);
    return [];
  }
}

export async function confirmAddress(orderId: string, addressNotes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        addressConfirmedBy: info.name,
        addressConfirmedAt: new Date().toISOString(),
        status: 'address_confirmed',
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'address_confirmed',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: addressNotes || 'Address confirmed by call center',
        },
      ])
      .commit();

    return { success: true, message: 'Address confirmed successfully', data: result };
  } catch (error: any) {
    console.error('Error in confirmAddress:', error);
    return { success: false, message: error.message || 'Failed to confirm address' };
  }
}

export async function confirmOrder(orderId: string, orderNotes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        orderConfirmedBy: info.name,
        orderConfirmedAt: new Date().toISOString(),
        status: 'order_confirmed',
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'order_confirmed',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: orderNotes || 'Order confirmed by call center',
        },
      ])
      .commit();

    return { success: true, message: 'Order confirmed successfully', data: result };
  } catch (error: any) {
    console.error('Error in confirmOrder:', error);
    return { success: false, message: error.message || 'Failed to confirm order' };
  }
}

export async function updateShippingAddress(orderId: string, editableAddress: any) {
  try {
    const result = await writeClient
      .patch(orderId)
      .set({
        shippingAddress: {
          fullName: editableAddress.fullName,
          address: editableAddress.address,
          city: editableAddress.city,
          state: editableAddress.state,
          postalCode: editableAddress.postalCode,
          country: editableAddress.country,
          phone: editableAddress.phone,
        },
      })
      .commit();

    return { success: true, message: 'Address updated successfully', data: result };
  } catch (error: any) {
    console.error('Error in updateShippingAddress:', error);
    return { success: false, message: error.message || 'Failed to update address' };
  }
}

export async function markAsPacked(orderId: string, packingNotes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        packedBy: info.name,
        packedAt: new Date().toISOString(),
        packingNotes: packingNotes,
        status: 'packed',
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'packed',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: packingNotes || 'Order packed',
        },
      ])
      .commit();

    return { success: true, message: 'Order marked as packed', data: result };
  } catch (error: any) {
    console.error('Error in markAsPacked:', error);
    return { success: false, message: error.message || 'Failed to mark as packed' };
  }
}

export async function assignDeliveryman(orderId: string, selectedDeliverymanId: string) {
  try {
    const info = await getEmployeeInfo();
    const deliveryman = await client.fetch<{ firstName: string; lastName: string } | null>(
      `*[_type == "user" && _id == $id][0]{ firstName, lastName }`,
      { id: selectedDeliverymanId }
    );

    const deliverymanName = deliveryman
      ? `${deliveryman.firstName} ${deliveryman.lastName}`.trim()
      : 'Deliveryman';

    const result = await writeClient
      .patch(orderId)
      .set({
        assignedDeliverymanId: selectedDeliverymanId,
        assignedDeliverymanName: deliverymanName,
        status: 'ready_for_delivery',
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'ready_for_delivery',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: `Assigned to deliveryman: ${deliverymanName}`,
        },
      ])
      .commit();

    return { success: true, message: 'Deliveryman assigned successfully', data: result };
  } catch (error: any) {
    console.error('Error in assignDeliveryman:', error);
    return { success: false, message: error.message || 'Failed to assign deliveryman' };
  }
}

export async function startDelivery(orderId: string, notes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        status: 'out_for_delivery',
        dispatchedAt: new Date().toISOString(),
        dispatchedBy: info.name,
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'out_for_delivery',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: notes || 'Delivery started',
        },
      ])
      .commit();

    return { success: true, message: 'Delivery started', data: result };
  } catch (error: any) {
    console.error('Error in startDelivery:', error);
    return { success: false, message: error.message || 'Failed to start delivery' };
  }
}

export async function markAsDelivered(orderId: string, notes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        deliveredBy: info.name,
        deliveryNotes: notes,
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'delivered',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: notes || 'Delivered successfully',
        },
      ])
      .commit();

    return { success: true, message: 'Order marked as delivered', data: result };
  } catch (error: any) {
    console.error('Error in markAsDelivered:', error);
    return { success: false, message: error.message || 'Failed to mark as delivered' };
  }
}

export async function rescheduleDelivery(orderId: string, rescheduleDate: string, rescheduleReason: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        status: 'rescheduled',
        rescheduledDate: rescheduleDate,
        rescheduledReason: rescheduleReason,
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'rescheduled',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: `Rescheduled to ${rescheduleDate}. Reason: ${rescheduleReason}`,
        },
      ])
      .commit();

    return { success: true, message: 'Delivery rescheduled successfully', data: result };
  } catch (error: any) {
    console.error('Error in rescheduleDelivery:', error);
    return { success: false, message: error.message || 'Failed to reschedule delivery' };
  }
}

export async function markDeliveryFailed(orderId: string, failureReason: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        status: 'failed_delivery',
        deliveryNotes: failureReason,
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'failed_delivery',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: `Delivery failed. Reason: ${failureReason}`,
        },
      ])
      .commit();

    return { success: true, message: 'Delivery marked as failed', data: result };
  } catch (error: any) {
    console.error('Error in markDeliveryFailed:', error);
    return { success: false, message: error.message || 'Failed to mark delivery as failed' };
  }
}

export async function collectCash(orderId: string, amount: number) {
  try {
    const result = await writeClient
      .patch(orderId)
      .set({
        cashCollected: true,
        cashCollectedAmount: amount,
        cashCollectedAt: new Date().toISOString(),
        paymentStatus: 'paid',
      })
      .commit();

    return { success: true, message: 'Cash collected successfully', data: result };
  } catch (error: any) {
    console.error('Error in collectCash:', error);
    return { success: false, message: error.message || 'Failed to collect cash' };
  }
}

export async function getActiveAccountsEmployees() {
  try {
    return await client.fetch(`
      *[_type == "user" && isEmployee == true && employeeRole == "accounts" && employeeStatus == "active"] {
        _id,
        firstName,
        lastName,
        email
      }
    `);
  } catch (error) {
    console.error('Error in getActiveAccountsEmployees:', error);
    return [];
  }
}

export async function submitCashToAccounts(orderId: string, accountsEmployeeId: string, submissionNotes: string) {
  try {
    const info = await getEmployeeInfo();
    const accountsEmp = await client.fetch<{ firstName: string; lastName: string } | null>(
      `*[_type == "user" && _id == $id][0]{ firstName, lastName }`,
      { id: accountsEmployeeId }
    );

    const accountsEmpName = accountsEmp
      ? `${accountsEmp.firstName} ${accountsEmp.lastName}`.trim()
      : 'Accounts';

    const result = await writeClient
      .patch(orderId)
      .set({
        cashSubmittedToAccounts: true,
        cashSubmittedBy: info.name,
        cashSubmittedAt: new Date().toISOString(),
        cashSubmissionNotes: submissionNotes,
        assignedAccountsEmployeeId: accountsEmployeeId,
        assignedAccountsEmployeeName: accountsEmpName,
        cashSubmissionStatus: 'pending',
      })
      .commit();

    return { success: true, message: 'Cash submitted to accounts', data: result };
  } catch (error: any) {
    console.error('Error in submitCashToAccounts:', error);
    return { success: false, message: error.message || 'Failed to submit cash to accounts' };
  }
}

export async function receivePaymentFromDeliveryman(orderId: string, notes: string) {
  try {
    const info = await getEmployeeInfo();
    const result = await writeClient
      .patch(orderId)
      .set({
        paymentReceivedBy: info.name,
        paymentReceivedAt: new Date().toISOString(),
        cashSubmissionStatus: 'confirmed',
        status: 'completed',
      })
      .insert('after', 'statusHistory[-1]', [
        {
          _key: Math.random().toString(36).substring(2, 9),
          status: 'completed',
          changedBy: info.email,
          changedByRole: info.role,
          changedAt: new Date().toISOString(),
          notes: notes || 'Payment received and order completed',
        },
      ])
      .commit();

    return { success: true, message: 'Payment marked as received and order completed', data: result };
  } catch (error: any) {
    console.error('Error in receivePaymentFromDeliveryman:', error);
    return { success: false, message: error.message || 'Failed to receive payment' };
  }
}

export async function rejectCashSubmission(orderId: string, rejectionReason: string) {
  try {
    const result = await writeClient
      .patch(orderId)
      .set({
        cashSubmissionStatus: 'rejected',
        cashSubmissionRejectionReason: rejectionReason,
        cashSubmittedToAccounts: false,
      })
      .commit();

    return { success: true, message: 'Cash submission rejected', data: result };
  } catch (error: any) {
    console.error('Error in rejectCashSubmission:', error);
    return { success: false, message: error.message || 'Failed to reject cash submission' };
  }
}

export async function getOrdersForAccounts() {
  try {
    // Fetch orders that are paid via Stripe/online or submitted to accounts for review
    return await client.fetch(`
      *[_type == "order" && (stripePaymentIntentId != null || cashSubmittedToAccounts == true || paymentReceivedBy != null)] | order(orderDate desc)
    `);
  } catch (error) {
    console.error('Error in getOrdersForAccounts:', error);
    return [];
  }
}

export async function getAccountsPaymentStats() {
  try {
    const orders = await client.fetch<any[]>(`
      *[_type == "order"] {
        paymentMethod,
        paymentStatus,
        totalPrice,
        cashCollectedAmount
      }
    `);

    let totalCodRevenue = 0;
    let codPaidRevenue = 0;
    let codPendingRevenue = 0;
    let cardRevenue = 0;
    let totalCodOrders = 0;
    let codPaidOrders = 0;
    let codPendingOrders = 0;
    let cardOrders = 0;

    for (const order of orders) {
      if (order.paymentMethod === 'cash_on_delivery') {
        totalCodOrders++;
        totalCodRevenue += order.totalPrice;
        if (order.paymentStatus === 'paid') {
          codPaidOrders++;
          codPaidRevenue += order.cashCollectedAmount || order.totalPrice;
        } else {
          codPendingOrders++;
          codPendingRevenue += order.totalPrice;
        }
      } else if (order.paymentMethod === 'stripe' || order.paymentMethod === 'card' || order.paymentMethod === 'sslcommerz') {
        if (order.paymentStatus === 'paid') {
          cardOrders++;
          cardRevenue += order.totalPrice;
        }
      }
    }

    return {
      totalCodRevenue,
      codPaidRevenue,
      codPendingRevenue,
      cardRevenue,
      totalCodOrders,
      codPaidOrders,
      codPendingOrders,
      cardOrders,
    };
  } catch (error) {
    console.error('Error in getAccountsPaymentStats:', error);
    return {
      totalCodRevenue: 0,
      codPaidRevenue: 0,
      codPendingRevenue: 0,
      cardRevenue: 0,
      totalCodOrders: 0,
      codPaidOrders: 0,
      codPendingOrders: 0,
      cardOrders: 0,
    };
  }
}
