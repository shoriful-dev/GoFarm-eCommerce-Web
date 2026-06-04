import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const orderId = formData.get("value_a") as string;
    const tranId = formData.get("tran_id") as string;
    const status = formData.get("status") as string;
    const failedReason = formData.get("error") as string;

    // Redirect to orders page with failed message
    if (orderId) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/user/orders/${orderId}?payment=failed&reason=${encodeURIComponent(
          failedReason || "Payment failed"
        )}`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=failed`
    );
  } catch (error) {
    console.error("SSLCommerz fail handler error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=error`
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("value_a");

  if (orderId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=failed`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=failed`
  );
}
