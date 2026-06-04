import { create } from "zustand";
import type { Product } from "@/sanity.types";

export type CartAddedMode = "cart" | "compare";

export interface CartAddedItem {
  id: string;
  product: Product;
  quantity?: number;
  unitPrice?: number;
  selectionLabel?: string;
  mode?: CartAddedMode;
}

interface CartAddedModalState {
  open: boolean;
  item: CartAddedItem | null;
  show: (item: CartAddedItem) => void;
  close: () => void;
}

export const useCartAddedModalStore = create<CartAddedModalState>((set) => ({
  open: false,
  item: null,
  show: (item) => set({ open: true, item: { mode: "cart", ...item } }),
  close: () => set({ open: false }),
}));
