import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-settings";

// Cached publicly for 5 minutes — settings rarely change and the values
// are non-sensitive (currency, shipping threshold, tax rate, etc.).
export const revalidate = 300;

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
