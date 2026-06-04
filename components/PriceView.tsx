import { twMerge } from "tailwind-merge";
import PriceFormatter from "./PriceFormatter";
import { cn } from "@/lib/utils";

interface Props {
  price: number | undefined;
  discount: number | undefined;
  className?: string;
}

const PriceView = ({ price, discount, className }: Props) => {
  // The incoming price is the base/original price
  const originalPrice = price || 0;

  // Calculate the discounted price if discount exists
  const discountAmount =
    discount && originalPrice ? (discount * originalPrice) / 100 : 0;
  const currentPrice = originalPrice - discountAmount;

  return (
    <div className="flex items-center justify-between gap-5">
      <div className="flex items-center gap-2">
        {/* Current/Payable Price (after discount) */}
        <PriceFormatter
          amount={currentPrice}
          className={cn("text-gofarm-green font-semibold", className)}
        />

        {/* Original Price (before discount) - only show if there's a discount */}
        {discount && discountAmount > 0 && (
          <div className="flex items-center gap-1">
            <PriceFormatter
              amount={originalPrice}
              className={twMerge(
                "line-through text-xs font-normal text-zinc-500",
                className
              )}
            />
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              -{discount}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceView;
