import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/firebase-admin-auth";
import {
  createNotification,
  sendBulkNotifications,
  NotificationType,
  NotificationPriority,
} from "@/lib/notificationService";

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin (checks both env var and Sanity isAdmin field)
    const { isAdmin, user } = await checkAdminAccess();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const userName = user.displayName || "";

    const body = await req.json();

    const {
      title,
      message,
      type = "general",
      priority = "medium",
      actionUrl,
      recipients, // Array of Clerk user IDs
      sentBy,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // Send bulk notifications using the notification service
    const result = await sendBulkNotifications(recipients, {
      title,
      message,
      type: type as NotificationType,
      priority: priority as NotificationPriority,
      actionUrl,
      sentBy: sentBy || userName || user.email || "Admin",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications sent successfully",
      stats: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
