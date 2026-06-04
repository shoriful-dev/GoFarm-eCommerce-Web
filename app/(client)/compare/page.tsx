"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Scale,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Container from "@/components/Container";
import AddToCartButton from "@/components/AddToCartButton";
import { client } from "@/sanity/lib/client";
import { image } from "@/sanity/image";
import { useCompareStore } from "@/stores/compareStore";
import type { Product } from "@/sanity.types";

const MAX_COMPARE = 4;

type EnrichedProduct = Omit<Product, "brand" | "categories" | "variant"> & {
  brand?: { _id?: string; title?: string } | null;
  categories?: Array<{ _id?: string; title?: string }> | undefined;
  variant?: { _id?: string; title?: string } | null;
};

const ENRICH_QUERY = `*[_type == "product" && _id in $ids]{
  _id, name, slug, price, discount, images, stock, status, baseWeight,
  description, isFeatured, hasWeights, hasVariants, averageRating, totalReviews,
  "brand": brand->{ _id, title },
  "categories": categories[]->{ _id, title },
  "variant": variant->{ _id, title }
}`;

const SEARCH_QUERY = `*[_type == "product" && name match $q && !(_id in $excludeIds)] | order(name asc)[0...8]{
  _id, name, slug, price, discount, images, stock, status,
  "brand": brand->{ title },
  averageRating, totalReviews
}`;

export default function ComparePage() {
  const { compareProducts, addToCompare, removeFromCompare, clearCompare } =
    useCompareStore();

  const [mounted, setMounted] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EnrichedProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (compareProducts.length === 0) {
      setEnriched([]);
      setLoading(false);
      return;
    }
    const ids = compareProducts.map((p) => p._id);

    // Always preserve order + drop removed items locally without refetching.
    setEnriched((prev) => {
      const map = new Map(prev.map((d) => [d._id, d] as const));
      return ids
        .map((id) => map.get(id))
        .filter((x): x is EnrichedProduct => Boolean(x));
    });

    // Only fetch ids we don't have data for yet.
    const haveIds = new Set(enriched.map((e) => e._id));
    const missing = ids.filter((id) => !haveIds.has(id));
    if (missing.length === 0) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    client
      .fetch<EnrichedProduct[]>(ENRICH_QUERY, { ids: missing })
      .then((data) => {
        if (!active) return;
        const fetched = new Map(data.map((d) => [d._id, d] as const));
        setEnriched((prev) => {
          const merged = new Map(prev.map((d) => [d._id, d] as const));
          for (const [id, d] of fetched) merged.set(id, d);
          // Re-order to match current compare order.
          return ids
            .map((id) => merged.get(id))
            .filter((x): x is EnrichedProduct => Boolean(x));
        });
      })
      .catch((err) => console.error("Compare enrich failed:", err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, compareProducts]);

  useEffect(() => {
    if (!searchOpen) return;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const data = await client.fetch<EnrichedProduct[]>(SEARCH_QUERY, {
          q: `${searchQuery}*`,
          excludeIds: compareProducts.map((p) => p._id),
        });
        setSearchResults(data ?? []);
      } catch (err) {
        console.error("Compare search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery, searchOpen, compareProducts]);

  const products = enriched;
  const count = products.length;
  // Always render exactly MAX_COMPARE columns on the right; empty ones become
  // "Add product" slots. This keeps the table proportionally sized for a full
  // comparison view from the start.
  const emptySlots = Math.max(0, MAX_COMPARE - count);
  const rightSlots = MAX_COMPARE;

  const rows = useMemo(() => buildAttributeRows(), []);

  if (!mounted) {
    return (
      <Container className="py-10">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </Container>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <Container className="py-6 sm:py-8">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"
          >
            <Link href="/" className="hover:text-gofarm-green">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">Compare</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <Scale className="w-6 h-6 text-gofarm-green" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Compare Products
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {count === 0
                  ? `Add up to ${MAX_COMPARE} products to compare side by side.`
                  : `Comparing ${count} of ${MAX_COMPARE} products`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gofarm-green hover:text-gofarm-green transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Shop
              </Link>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!loading && count === 0 && (
          <EmptyState onSearch={() => setSearchOpen(true)} />
        )}

        {/* Loading skeleton — only on initial load (no products enriched yet). */}
        {loading && compareProducts.length > 0 && enriched.length === 0 && (
          <CompareSkeleton slots={rightSlots} />
        )}

        {/* Comparison table */}
        {!(loading && enriched.length === 0) && count > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] lg:min-w-0 table-fixed">
                <colgroup>
                  <col className="w-32 sm:w-40 md:w-44 lg:w-48" />
                  {Array.from({ length: rightSlots }).map((_, i) => (
                    <col key={i} style={{ width: `${100 / rightSlots}%` }} />
                  ))}
                </colgroup>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className={
                        row.emphasis
                          ? "bg-gofarm-light-green/5"
                          : "hover:bg-gray-50/40"
                      }
                    >
                      <th
                        scope="row"
                        className={`text-left align-top sticky left-0 z-10 px-3 sm:px-5 py-4 border-r border-gray-200 ${
                          row.emphasis ? "bg-gofarm-light-green/15" : "bg-white"
                        }`}
                      >
                        <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
                          {row.section}
                        </span>
                        <span className="block text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                          {row.label}
                        </span>
                      </th>

                      {products.map((p) => (
                        <td
                          key={p._id}
                          className="align-top px-3 sm:px-4 py-4 min-w-[180px] border-l border-gray-200 relative"
                        >
                          {row.key === "image" && (
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={() => removeFromCompare(p._id)}
                              className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/95 backdrop-blur border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {row.render(p)}
                        </td>
                      ))}

                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <td
                          key={`empty-${i}`}
                          className="align-top px-3 sm:px-4 py-4 min-w-[180px] border-l border-gray-200"
                        >
                          {row.key === "image" ? (
                            <AddSlotCell
                              onClick={() => setSearchOpen(true)}
                              remaining={emptySlots}
                            />
                          ) : (
                            <span className="block text-gray-300 text-xs">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add product drawer */}
        <AnimatePresence>
          {searchOpen && (
            <AddProductDrawer
              query={searchQuery}
              setQuery={setSearchQuery}
              results={searchResults}
              searching={searching}
              onAdd={(p) => {
                addToCompare(p as Product);
                if (count + 1 >= MAX_COMPARE) {
                  setSearchOpen(false);
                }
                setSearchQuery("");
                setSearchResults([]);
              }}
              onClose={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              remaining={emptySlots}
            />
          )}
        </AnimatePresence>

        {/* Confirm clear dialog */}
        <AnimatePresence>
          {confirmClearOpen && (
            <ConfirmClearDialog
              count={count}
              onCancel={() => setConfirmClearOpen(false)}
              onConfirm={() => {
                clearCompare();
                setConfirmClearOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
}

// ---------- Cells / helpers ----------

const formatPrice = (n: number) => `$${n.toFixed(2)}`;

const ImageCell = ({ p }: { p: EnrichedProduct }) => {
  const imgSrc = p.images?.[0] ? image(p.images[0]).size(500, 500).url() : null;
  return (
    <div className="relative aspect-square w-full max-w-[220px] mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
      {imgSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imgSrc}
          alt={p.name ?? "Product"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <Scale className="w-8 h-8" />
        </div>
      )}
      {p.status && (
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
            p.status === "new"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : p.status === "hot"
                ? "bg-orange-50 text-orange-600 border-orange-200"
                : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {p.status}
        </span>
      )}
    </div>
  );
};

const NameCell = ({ p }: { p: EnrichedProduct }) => (
  <div>
    {p.brand?.title && (
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gofarm-green mb-1">
        {p.brand.title}
      </p>
    )}
    <Link
      href={`/product/${p.slug?.current ?? ""}`}
      className="text-sm sm:text-base font-bold text-gray-900 hover:text-gofarm-green transition-colors line-clamp-2"
    >
      {p.name}
    </Link>
  </div>
);

const RatingCell = ({ p }: { p: EnrichedProduct }) => {
  const r = p.averageRating ?? 0;
  const t = p.totalReviews ?? 0;
  if (!r) return <span className="text-gray-400 text-sm">No reviews yet</span>;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-gray-900">{r.toFixed(1)}</span>
      {t > 0 && <span className="text-gray-400 text-xs">({t})</span>}
    </div>
  );
};

const PriceCell = ({ p }: { p: EnrichedProduct }) => {
  const hasDiscount = (p.discount ?? 0) > 0;
  const finalPrice = hasDiscount
    ? (p.price ?? 0) * (1 - (p.discount ?? 0) / 100)
    : (p.price ?? 0);
  return (
    <div className="space-y-0.5">
      <div className="text-base sm:text-lg font-bold text-gofarm-green">
        {formatPrice(finalPrice)}
      </div>
      {hasDiscount && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(p.price ?? 0)}
          </span>
          <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
            -{p.discount}%
          </span>
        </div>
      )}
    </div>
  );
};

const StockCell = ({ p }: { p: EnrichedProduct }) =>
  (p.stock ?? 0) > 0 ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm">
      <Check className="w-4 h-4" /> In stock ({p.stock})
    </span>
  ) : (
    <span className="text-red-600 font-semibold text-sm">Out of stock</span>
  );

const DescriptionCell = ({ p }: { p: EnrichedProduct }) =>
  p.description ? (
    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-4">
      {p.description}
    </p>
  ) : (
    <span className="text-gray-400 text-sm">—</span>
  );

const CategoriesCell = ({ p }: { p: EnrichedProduct }) => {
  const cats = p.categories ?? [];
  if (cats.length === 0)
    return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {cats.slice(0, 3).map((c) => (
        <span
          key={c._id ?? c.title}
          className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] capitalize"
        >
          {c.title}
        </span>
      ))}
    </div>
  );
};

const BoolCell = ({ value }: { value: boolean | undefined }) =>
  value ? (
    <Check className="w-4 h-4 text-emerald-600" />
  ) : (
    <Minus className="w-4 h-4 text-gray-300" />
  );

const CartCell = ({ p }: { p: EnrichedProduct }) => (
  <div className="-my-2">
    <AddToCartButton product={p as Product} />
  </div>
);

const AddSlotCell = ({
  onClick,
  remaining,
}: {
  onClick: () => void;
  remaining: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative aspect-square w-full max-w-[220px] mx-auto rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-gofarm-green hover:bg-gofarm-light-green/5 transition-colors flex flex-col items-center justify-center gap-2 px-3 text-center"
  >
    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gofarm-light-green/15 text-gofarm-green group-hover:bg-gofarm-green group-hover:text-white transition-colors">
      <Plus className="w-6 h-6" />
    </span>
    <span className="text-xs sm:text-sm font-bold text-gray-900">
      Add Product
    </span>
    <span className="text-[10px] sm:text-[11px] text-gray-500">
      {remaining} {remaining === 1 ? "slot" : "slots"} left
    </span>
  </button>
);

// ---------- Row definitions ----------

interface CompareRow {
  key: string;
  section: string;
  label: string;
  emphasis?: boolean;
  render: (p: EnrichedProduct) => React.ReactNode;
}

const ConfirmClearDialog = ({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <motion.div
      key="confirm-clear"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center px-3 sm:px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="Clear compare list"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-3">
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Clear compare list?
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              This will remove all {count}{" "}
              {count === 1 ? "product" : "products"} from your comparison. This
              action can&apos;t be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-5 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/40">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const buildAttributeRows = (): CompareRow[] => [
  {
    key: "image",
    section: "Compare",
    label: "Image",
    emphasis: true,
    render: (p) => <ImageCell p={p} />,
  },
  {
    key: "name",
    section: "Identity",
    label: "Name",
    render: (p) => <NameCell p={p} />,
  },
  {
    key: "price",
    section: "Pricing",
    label: "Price",
    render: (p) => <PriceCell p={p} />,
  },
  {
    key: "rating",
    section: "Quality",
    label: "Rating",
    render: (p) => <RatingCell p={p} />,
  },
  {
    key: "stock",
    section: "Inventory",
    label: "Availability",
    render: (p) => <StockCell p={p} />,
  },
  {
    key: "description",
    section: "About",
    label: "Description",
    render: (p) => <DescriptionCell p={p} />,
  },
  {
    key: "categories",
    section: "Catalog",
    label: "Categories",
    render: (p) => <CategoriesCell p={p} />,
  },
  {
    key: "weight",
    section: "Specs",
    label: "Base Weight",
    render: (p) =>
      p.baseWeight ? (
        <span className="text-sm">{p.baseWeight}g</span>
      ) : (
        <span className="text-gray-400 text-sm">—</span>
      ),
  },
  {
    key: "variants",
    section: "Options",
    label: "Has Variants",
    render: (p) => <BoolCell value={p.hasVariants} />,
  },
  {
    key: "featured",
    section: "Highlight",
    label: "Featured",
    render: (p) => <BoolCell value={p.isFeatured} />,
  },
  {
    key: "cta",
    section: "Action",
    label: "Add to Cart",
    emphasis: true,
    render: (p) => <CartCell p={p} />,
  },
];

// ---------- Empty state ----------

const EmptyState = ({ onSearch }: { onSearch: () => void }) => (
  <div className="bg-white border border-gray-200 rounded-2xl px-6 py-12 sm:py-16 flex flex-col items-center text-center">
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gofarm-light-green/20 to-gofarm-light-orange/20 flex items-center justify-center">
        <Scale className="w-12 h-12 text-gofarm-green" />
      </div>
      <span className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-gofarm-light-orange/30 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-gofarm-orange" />
      </span>
    </div>
    <h2 className="mt-6 text-xl sm:text-2xl font-bold text-gray-900">
      Nothing to compare yet
    </h2>
    <p className="mt-2 text-sm text-gray-500 max-w-md">
      Add up to {MAX_COMPARE} products from the shop to compare features,
      prices, and ratings side by side.
    </p>
    <div className="mt-6 flex flex-wrap items-center gap-3 justify-center">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gofarm-green text-white text-sm font-semibold hover:bg-gofarm-green/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Browse Shop
      </Link>
      <button
        type="button"
        onClick={onSearch}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gofarm-green text-gofarm-green text-sm font-semibold hover:bg-gofarm-light-green/10 transition-colors"
      >
        <Search className="w-4 h-4" />
        Search to Add
      </button>
    </div>
  </div>
);

// ---------- Skeleton ----------

const CompareSkeleton = ({ slots }: { slots: number }) => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full table-fixed">
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, r) => (
            <tr key={r}>
              <th className="text-left align-top sticky left-0 bg-white px-5 py-4 w-44">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mt-1.5" />
              </th>
              {Array.from({ length: slots }).map((_, c) => (
                <td key={c} className="align-top px-4 py-4 min-w-[180px]">
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---------- Add-product drawer ----------

const AddProductDrawer = ({
  query,
  setQuery,
  results,
  searching,
  onAdd,
  onClose,
  remaining,
}: {
  query: string;
  setQuery: (v: string) => void;
  results: EnrichedProduct[];
  searching: boolean;
  onAdd: (p: EnrichedProduct) => void;
  onClose: () => void;
  remaining: number;
}) => (
  <motion.div
    key="add-product-drawer"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[110] flex"
  >
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
    />
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.28 }}
      className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
    >
      <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Add Product</h3>
            <p className="text-xs text-gray-500">
              {remaining} {remaining === 1 ? "slot" : "slots"} remaining
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:text-gofarm-green hover:border-gofarm-green/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gofarm-green focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <ul className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                <div className="w-14 h-14 bg-gray-200 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : query.trim().length < 2 ? (
          <p className="text-center text-sm text-gray-500 py-12 px-5">
            Type at least 2 characters to search.
          </p>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12 px-5">
            No products match{" "}
            <span className="font-semibold">&ldquo;{query}&rdquo;</span>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {results.map((p) => {
              const imgSrc = p.images?.[0]
                ? image(p.images[0]).size(120, 120).url()
                : null;
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gofarm-light-green/5 transition-colors text-left"
                  >
                    <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      {imgSrc && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imgSrc}
                          alt={p.name ?? "Product"}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {p.name}
                      </p>
                      {p.brand?.title && (
                        <p className="text-[11px] text-gray-500 truncate">
                          {p.brand.title}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gofarm-green tabular-nums">
                      {formatPrice(p.price ?? 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  </motion.div>
);
