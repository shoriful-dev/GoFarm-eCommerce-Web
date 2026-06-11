import { ReactNode } from "react";
import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { Toaster } from "sonner";
import AuthInitializer from "@/components/AuthInitializer";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import ShareSidebar from "@/components/ShareSidebar";
import PurchaseFloatingButton from "@/components/PurchaseFloatingButton";
import CartAddedModal from "@/components/CartAddedModal";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gofarm.reactbd.com"),
  title: {
    template: "%s | gofarm - Premium Online Shopping",
    default: "gofarm - Your Trusted Online Shopping Destination",
  },
  description:
    "Discover amazing products at gofarm, your trusted online shopping destination for quality items and exceptional customer service. Shop electronics, fashion, home goods and more with fast delivery.",
  keywords: [
    "online shopping",
    "e-commerce",
    "buy online",
    "shop online",
    "electronics",
    "fashion",
    "home goods",
    "deals",
    "discounts",
    "gofarm",
  ],
  authors: [{ name: "gofarm" }],
  creator: "gofarm",
  publisher: "gofarm",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gofarm.reactbd.com",
    siteName: "gofarm",
    title: "gofarm - Your Trusted Online Shopping Destination",
    description:
      "Discover amazing products at gofarm, your trusted online shopping destination for quality items and exceptional customer service.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "gofarm Online Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "gofarm - Your Trusted Online Shopping Destination",
    description:
      "Discover amazing products at gofarm, your trusted online shopping destination for quality items and exceptional customer service.",
    images: ["/og-image.jpg"],
    creator: "@gofarm",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    // Add other verification codes as needed
  },
  alternates: {
    canonical: "https://gofarm.reactbd.com",
  },
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body className={`${jost.variable} antialiased`}>
        <AuthInitializer />
        <AnalyticsProvider />
        <ShareSidebar />
        {children}
        <PurchaseFloatingButton />
        <CartAddedModal />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1f2937",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
            },
            className: "sonner-toast",
          }}
        />
      </body>
    </html>
  );
};

export default RootLayout;
