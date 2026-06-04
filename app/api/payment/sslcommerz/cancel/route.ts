import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const orderId = formData.get("value_a") as string;
    const tranId = formData.get("tran_id") as string;

    // Redirect to orders page with cancelled message
    if (orderId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=cancelled`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=cancelled`
    );
  } catch (error) {
    console.error("SSLCommerz cancel handler error:", error);
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
      `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders/${orderId}?payment=cancelled`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/orders?payment=cancelled`
  );
}
