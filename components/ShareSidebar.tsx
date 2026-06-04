"use client";

import { Product } from "@/sanity.types";
import {
  Mail,
  Link as LinkIcon,
  MessageCircle,
  Send,
} from "lucide-react";
import { FaTwitter, FaFacebook, FaLinkedin } from "react-icons/fa";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "./ui/sheet";
import { image } from "@/sanity/image";
import PriceView from "./PriceView";
import { toast } from "sonner";
import { useShareStore } from "@/stores/shareStore";

export default function ShareSidebar() {
  const { isOpen, product, closeShare } = useShareStore();

  if (!product) return null;

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${product.slug?.current}`
      : "";

  const productTitle = product.name || "Check out this product";
  const productImage = product.images?.[0]
    ? image(product.images[0]).size(600, 600).url()
    : "";

  const shareOptions = [
    {
      name: "Copy Link",
      icon: LinkIcon,
      color: "bg-gray-600 hover:bg-gray-700",
      action: () => {
        navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      },
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600 hover:bg-green-700",
      action: () => {
        const text = `Check out ${productTitle}!\n${productUrl}`;
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank"
        );
      },
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            productUrl
          )}`,
          "_blank",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      color: "bg-sky-500 hover:bg-sky-600",
      action: () => {
        const text = `Check out ${productTitle}!`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(productUrl)}`,
          "_blank",
          "width=600,height=400"
        );
      },
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            productUrl
          )}`,
          "_blank",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-red-600 hover:bg-red-700",
      action: () => {
        const subject = `Check out: ${productTitle}`;
        const body = `I found this product and thought you might like it!\n\n${productTitle}\n${productUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;
      },
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => {
        const text = `Check out ${productTitle}!`;
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            productUrl
          )}&text=${encodeURIComponent(text)}`,
          "_blank"
        );
      },
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeShare()}>
      <SheetContent className="w-full sm:w-96 sm:max-w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Share Product</SheetTitle>
        </SheetHeader>

        {/* Product Preview */}
        <div className="p-4 border rounded-lg bg-gray-50 mt-4">
          <div className="flex gap-3">
            {productImage && (
              <img
                src={productImage}
                alt={productTitle}
                className="w-20 h-20 object-cover rounded-lg border"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">
                {productTitle}
              </h3>
              <PriceView
                price={product.price}
                discount={product.discount}
                className="text-sm font-bold"
              />
              {product.stock === 0 ? (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Out of Stock
                </p>
              ) : (product.stock as number) <= 10 ? (
                <p className="text-xs text-gofarm-orange font-medium mt-1">
                  Only {product.stock} left
                </p>
              ) : (
                <p className="text-xs text-green-600 font-medium mt-1">
                  In Stock
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Share this product with your friends and family
          </p>
          <div className="space-y-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-white ${option.color} transition-all duration-200 transform hover:scale-105`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product URL */}
        <SheetFooter className="border-t pt-4">
          <div className="w-full">
            <p className="text-xs text-gray-500 mb-2">Product URL</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gofarm-green"
              />
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(productUrl);
                  toast.success("Link copied!");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
