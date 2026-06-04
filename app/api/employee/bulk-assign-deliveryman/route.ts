import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/firebase-admin-auth";
import { backendClient } from "@/sanity/lib/backendClient";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const firebaseUid = await getAuthUserId();

    if (!firebaseUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a warehouse employee
    const employee = await backendClient.fetch(
      `*[_type == "user" && firebaseUid == $firebaseUid && isEmployee == true && (employeeRole == "warehouse" || employeeRole == "incharge")][0]`,
      { firebaseUid },
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Only warehouse employees can assign deliverymen" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { orderIds, deliverymanId, deliverymanName, deliverymanEmail } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      console.error("Invalid order IDs:", orderIds);
      return NextResponse.json(
        { error: "Order IDs are required" },
        { status: 400 },
      );
    }

    if (!deliverymanId || !deliverymanName) {
      console.error("Missing deliveryman info:", {
        deliverymanId,
        deliverymanName,
        hasId: !!deliverymanId,
        hasName: !!deliverymanName,
      });
      return NextResponse.json(
        {
          error: "Deliveryman information is required",
          debug: {
            hasId: !!deliverymanId,
            hasName: !!deliverymanName,
            idValue: deliverymanId,
            nameValue: deliverymanName,
          },
        },
        { status: 400 },
      );
    }

    // Update all orders in a transaction
    const transaction = backendClient.transaction();
    const assignedAt = new Date().toISOString();

    orderIds.forEach((orderId) => {
      transaction.patch(orderId, (patch) =>
        patch.set({
          assignedDeliverymanId: deliverymanId,
          assignedDeliverymanName: deliverymanName,
          assignedDeliverymanEmail: deliverymanEmail,
          status: "ready_for_delivery",
          assignedAt: assignedAt,
        }),
      );
    });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${orderIds.length} order${
        orderIds.length !== 1 ? "s" : ""
      } to ${deliverymanName}`,
      assignedCount: orderIds.length,
    });
  } catch (error) {
    console.error("Error bulk assigning deliveryman:", error);
    return NextResponse.json(
      { error: "Failed to assign deliveryman" },
      { status: 500 },
    );
  }
}
