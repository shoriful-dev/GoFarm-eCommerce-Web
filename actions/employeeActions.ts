'use server';

import { client, writeClient } from '@/sanity/lib/client';
import { getAuthUserId } from '@/lib/auth/server';

async function getAdminEmail() {
  const firebaseUid = await getAuthUserId();
  if (!firebaseUid) return 'System';
  try {
    const user = await client.fetch<{ email: string } | null>(
      `*[_type == "user" && firebaseUid == $firebaseUid][0]{ email }`,
      { firebaseUid }
    );
    return user?.email || 'System';
  } catch (err) {
    return 'System';
  }
}

export async function getAllUsers() {
  try {
    return await client.fetch(`
      *[_type == "user"] {
        _id,
        email,
        firstName,
        lastName,
        isEmployee,
        employeeRole,
        employeeStatus,
        createdAt
      }
    `);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

export async function getAllEmployees() {
  try {
    return await client.fetch(`
      *[_type == "user" && isEmployee == true] {
        _id,
        email,
        firstName,
        lastName,
        role,
        isEmployee,
        employeeRole,
        employeeStatus,
        status,
        performance,
        assignedAt,
        assignedBy,
        createdAt
      }
    `);
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    return [];
  }
}

export async function assignEmployeeRole(userId: string, role: string) {
  try {
    const adminEmail = await getAdminEmail();
    const result = await writeClient
      .patch(userId)
      .set({
        isEmployee: true,
        employeeRole: role,
        role: role,
        employeeStatus: 'active',
        status: 'active',
        assignedAt: new Date().toISOString(),
        assignedBy: adminEmail,
        performance: {
          ordersProcessed: 0,
          ordersConfirmed: 0,
          ordersPacked: 0,
          ordersDelivered: 0,
        },
      })
      .commit();

    return { success: true, message: 'Employee role assigned successfully', data: result };
  } catch (error: any) {
    console.error('Error in assignEmployeeRole:', error);
    return { success: false, message: error.message || 'Failed to assign role' };
  }
}

export async function removeEmployeeRole(userId: string) {
  try {
    const result = await writeClient
      .patch(userId)
      .set({
        isEmployee: false,
        employeeRole: null,
        role: 'user',
        employeeStatus: null,
        status: null,
      })
      .commit();

    return { success: true, message: 'Employee role removed successfully', data: result };
  } catch (error: any) {
    console.error('Error in removeEmployeeRole:', error);
    return { success: false, message: error.message || 'Failed to remove employee role' };
  }
}

export async function updateEmployeeStatus(userId: string, status: string, reason?: string) {
  try {
    const patchData: any = {
      employeeStatus: status,
      status: status,
    };

    if (reason) {
      patchData.suspensionReason = reason;
    }

    const result = await writeClient.patch(userId).set(patchData).commit();

    return {
      success: true,
      message: `Employee status updated to ${status} successfully`,
      data: result,
    };
  } catch (error: any) {
    console.error('Error in updateEmployeeStatus:', error);
    return { success: false, message: error.message || 'Failed to update employee status' };
  }
}

export async function getCurrentEmployee() {
  try {
    const firebaseUid = await getAuthUserId();
    if (!firebaseUid) return null;
    return await client.fetch(`
      *[_type == "user" && firebaseUid == $firebaseUid && isEmployee == true][0] {
        _id,
        email,
        firstName,
        lastName,
        role,
        isEmployee,
        employeeRole,
        employeeStatus,
        status,
        performance,
        assignedAt,
        assignedBy,
        createdAt
      }
    `, { firebaseUid });
  } catch (error) {
    console.error('Error in getCurrentEmployee:', error);
    return null;
  }
}
