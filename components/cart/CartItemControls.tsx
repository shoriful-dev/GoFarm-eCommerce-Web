"use client";

import { Button } from "@/components/ui/button";
import QuantityButtons from "@/components/QuantityButtons";
import { Trash2 } from "lucide-react";
import useCartStore from "@/store";
import { Product } from "@/sanity.types";
import { toast } from "sonner";

interface CartItemControlsProps {
  product: Product;
}

export function CartItemControls({ product }: CartItemControlsProps) {
  const { deleteCartProduct } = useCartStore();

  const handleRemove = () => {
    deleteCartProduct(product._id);
    toast.success("Item removed from cart");
  };

  return (
    <div className="flex items-center gap-4">
      <QuantityButtons product={product} />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
