import { cn } from "../../lib/utils";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";

interface Props {
  className?: string;
  variant?: "default" | "sm";
}

const Logo = ({ className, variant = "default" }: Props) => {
  // Small variant for footer
  if (variant === "sm") {
    return (
      <Link href={"/"}>
        <div
          className={cn(
            "flex items-center gap-1.5 group hoverEffect",
            className,
          )}
        >
          {/* Cart Icon with Creative Styling (smaller) */}
          <div className="relative">
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gofarm-orange rounded-full animate-pulse group-hover:bg-gofarm-light-green hoverEffect"></div>
            <ShoppingCart
              className="w-5 h-5 text-gofarm-green group-hover:text-gofarm-light-green hoverEffect transform group-hover:scale-110"
              strokeWidth={2.5}
            />
          </div>

          {/* Text Logo (smaller) */}
          <div className="flex items-center">
            <h1 className="text-sm font-black tracking-wider uppercase font-sans">
              <span className="text-gofarm-green group-hover:text-gofarm-light-green hoverEffect">
                Shop
              </span>
              <span className="bg-linear-to-r from-gofarm-light-green to-gofarm-orange bg-clip-text text-transparent group-hover:from-gofarm-green group-hover:to-gofarm-light-green hoverEffect">
                cart
              </span>
            </h1>

            {/* Decorative Elements (smaller) */}
            <div className="ml-0.5 flex flex-col gap-0.5">
              <div className="w-0.5 h-0.5 bg-gofarm-orange rounded-full group-hover:bg-gofarm-light-green hoverEffect"></div>
              <div className="w-0.5 h-0.5 bg-gofarm-light-green rounded-full group-hover:bg-gofarm-orange hoverEffect"></div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default full logo
  return (
    <Link href={"/"}>
      <Image
        src={"/logo.svg"}
        alt="logo"
        width={150}
        height={150}
        className={cn("w-auto h-6 sm:h-7 md:h-8", className)}
      />
    </Link>
  );
};

export default Logo;
