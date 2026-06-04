import { sanityFetch } from "../lib/live";

// User Queries
export const USER_BY_FIREBASE_ID_QUERY = `
  *[_type == "user" && firebaseUid == $firebaseUid][0] {
    _id,
    _type,
    firebaseUid,
    email,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    profileImage {
      asset -> {
        _id,
        url
      }
    },
    addresses[] -> {
      _id,
      name,
      address,
      city,
      state,
      zip,
      default,
      createdAt
    },
    preferences,
    wishlist[] -> {
      _id,
      name,
      slug,
      image {
        asset -> {
          _id,
          url
        }
      },
      price,
      currency
    },
    cart[] {
      product -> {
        _id,
        name,
        slug,
        image {
          asset -> {
            _id,
            url
          }
        },
        price,
        currency,
        inStock,
        stockQuantity
      },
      quantity,
      size,
      color,
      addedAt
    },
    orders[] -> {
      _id,
      orderNumber,
      totalPrice,
      currency,
      status,
      orderDate
    },
    loyaltyPoints,
    rewardPoints,
    totalSpent,
    lastLogin,
    isActive,
    createdAt,
    updatedAt
  }
`;

export const USER_ADDRESSES_QUERY = `
  *[_type == "address" && user._ref == $userId] | order(default desc, createdAt desc) {
    _id,
    name,
    address,
    city,
    state,
    zip,
    default,
    createdAt
  }
`;

export const USER_CART_QUERY = `
  *[_type == "user" && firebaseUid == $firebaseUid][0] {
    cart[] {
      product -> {
        _id,
        name,
        slug,
        image {
          asset -> {
            _id,
            url
          }
        },
        price,
        currency,
        inStock,
        stockQuantity,
        categories[] -> {
          name
        }
      },
      quantity,
      size,
      color,
      addedAt
    }
  }
`;

export const USER_WISHLIST_QUERY = `
  *[_type == "user" && firebaseUid == $firebaseUid][0] {
    wishlist[] -> {
      _id,
      name,
      slug,
      image {
        asset -> {
          _id,
          url
        }
      },
      price,
      currency,
      inStock,
      categories[] -> {
        name
      }
    }
  }
`;

export const USER_ORDERS_QUERY = `
  *[_type == "order" && firebaseUid == $firebaseUid] | order(orderDate desc) {
    _id,
    orderNumber,
    products[] {
      product -> {
        _id,
        name,
        image {
          asset -> {
            _id,
            url
          }
        },
        price,
        currency
      },
      quantity
    },
    totalPrice,
    currency,
    productDiscount,
    amountDiscount,
    businessDiscount,
    address,
    status,
    orderDate,
    invoice
  }
`;

export const ORDER_BY_ID_QUERY = `
  *[_type == "order" && _id == $orderId][0] {
    _id,
    orderNumber,
    firebaseUid,
    clerkUserId,
    customerName,
    email,
    products[] {
      product -> {
        _id,
        name,
        slug,
        images,
        price,
        discount,
        stock,
        brand -> {
          _id,
          title
        },
        categories[] -> {
          _id,
          title
        }
      },
      quantity
    },
    subtotal,
    tax,
    shipping,
    totalPrice,
    currency,
    productDiscount,
    amountDiscount,
    businessDiscount,
    coupon {
      code,
      discountType,
      discountValue,
      discountAmount
    },
    address,
    status,
    paymentStatus,
    paymentMethod,
    orderDate,
    invoice,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    paymentCompletedAt,
    addressConfirmedBy,
    addressConfirmedAt,
    orderConfirmedBy,
    orderConfirmedAt,
    packedBy,
    packedAt,
    assignedDeliverymanName,
    dispatchedAt,
    cashCollectedAt,
    paymentReceivedAt,
    deliveredBy,
    deliveredAt
  }
`;

// User Functions
export const getUserByClerkId = async (firebaseUid: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_BY_FIREBASE_ID_QUERY,
      params: { firebaseUid },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error);
    return null;
  }
};

export const getUserAddresses = async (userId: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_ADDRESSES_QUERY,
      params: { userId },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any) ?? [];
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return [];
  }
};

export const getUserCart = async (firebaseUid: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_CART_QUERY,
      params: { firebaseUid },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.cart ?? [];
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return [];
  }
};

export const getUserWishlist = async (firebaseUid: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_WISHLIST_QUERY,
      params: { firebaseUid },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.wishlist ?? [];
  } catch (error) {
    console.error("Error fetching user wishlist:", error);
    return [];
  }
};

export const getUserOrders = async (firebaseUid: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_ORDERS_QUERY,
      params: { firebaseUid },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any) ?? [];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
};

/**
 * Loose order shape returned by `getOrderById`. The full GROQ result
 * isn't surfaced by typegen yet (the projection is dynamic), so we
 * widen to a record and let consumers narrow the fields they read.
 * Replace this with the generated type once `pnpm typegen` produces
 * `ORDER_BY_ID_QUERY_RESULT`.
 */
export type OrderByIdResult = Record<string, unknown> & {
  _id?: string;
  firebaseUid?: string;
  orderNumber?: string;
  customerName?: string;
};

export const getOrderById = async (
  orderId: string,
): Promise<OrderByIdResult | null> => {
  try {
    const { data } = await sanityFetch({
      query: ORDER_BY_ID_QUERY,
      params: { orderId },
    });
    return (data as OrderByIdResult | null) ?? null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
};

// User Notifications Queries
export const USER_NOTIFICATIONS_QUERY = `
  *[_type == "user" && firebaseUid == $firebaseUid][0] {
    notifications[] {
      id,
      title,
      message,
      type,
      read,
      priority,
      sentAt,
      readAt,
      sentBy,
      actionUrl
    }
  }
`;

export const getUserNotifications = async (firebaseUid: string) => {
  try {
    const { data } = await sanityFetch({
      query: USER_NOTIFICATIONS_QUERY,
      params: { firebaseUid },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.notifications || [];
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return [];
  }
};

export const MARK_NOTIFICATION_READ_QUERY = `
  *[_type == "user" && clerkUserId == $clerkUserId][0] {
    _id,
    notifications
  }
`;

export const markNotificationAsRead = async (
  clerkUserId: string,
  notificationId: string,
) => {
  try {
    const user = await sanityFetch({
      query: MARK_NOTIFICATION_READ_QUERY,
      params: { clerkUserId },
    });

    if (!user.data) {
      throw new Error("User not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedNotifications = (user.data as any).notifications.map(
      (notification: any) => {
        if (notification.id === notificationId) {
          return {
            ...notification,
            read: true,
            readAt: new Date().toISOString(),
          };
        }
        return notification;
      },
    );

    const { writeClient } = await import("../lib/client");

    await writeClient
      .patch((user.data as any)._id)
      .set({ notifications: updatedNotifications })
      .commit();

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
};

export const deleteUserNotification = async (
  clerkUserId: string,
  notificationId: string,
) => {
  try {
    const user = await sanityFetch({
      query: MARK_NOTIFICATION_READ_QUERY,
      params: { clerkUserId },
    });

    if (!user.data) {
      throw new Error("User not found");
    }

    const updatedNotifications = (user.data as any).notifications.filter(
      (notification: any) => notification.id !== notificationId,
    );

    const { writeClient } = await import("../lib/client");

    await writeClient
      .patch((user.data as any)._id)
      .set({ notifications: updatedNotifications })
      .commit();

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
};
