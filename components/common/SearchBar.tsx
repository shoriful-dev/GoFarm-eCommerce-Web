"use client";
import { Loader2, Search, X, Star } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOutsideClick } from "@/hooks";

interface SearchProduct {
  _id: string;
  name?: string;
  slug?: { current?: string };
  images?: unknown[];
  price?: number;
  discount?: number;
  status?: "new" | "hot" | "sale";
  stock?: number;
  averageRating?: number;
  totalReviews?: number;
  brand?: { title?: string };
  category?: string;
}

const RECENT_KEY = "gofarm:recent-searches";
const MAX_RECENT = 6;

const loadRecent = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const saveRecent = (items: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

const STATUS_BADGE: Record<
  NonNullable<SearchProduct["status"]>,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-blue-50 text-blue-600 border-blue-200" },
  hot: {
    label: "Hot",
    className: "bg-orange-50 text-orange-600 border-orange-200",
  },
  sale: {
    label: "Sale",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

const SkeletonRow = () => (
  <li className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-14 h-14 shrink-0 rounded-md bg-gray-200" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="flex items-center gap-2">
        <div className="h-3 w-12 bg-gray-200 rounded" />
        <div className="h-3 w-10 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="h-4 w-14 bg-gray-200 rounded" />
  </li>
);

interface ProductRowProps {
  product: SearchProduct;
  onSelect: () => void;
}

const ProductRow = ({ product: p, onSelect }: ProductRowProps) => {
  const hasDiscount = (p.discount ?? 0) > 0 && (p.price ?? 0) > 0;
  const discountedPrice = hasDiscount
    ? (p.price ?? 0) * (1 - (p.discount ?? 0) / 100)
    : null;
  const rating = p.averageRating ? Math.round(p.averageRating * 10) / 10 : 0;
  const isOutOfStock = typeof p.stock === "number" && p.stock <= 0;
  const badge = p.status ? STATUS_BADGE[p.status] : null;

  return (
    <li>
      <Link
        href={`/product/${p.slug?.current ?? ""}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gofarm-light-green/5 transition-colors"
      >
        <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
          {p.images?.[0] ? (
            <Image
              src={urlFor(p.images[0] as Parameters<typeof urlFor>[0])
                .width(112)
                .height(112)
                .url()}
              alt={p.name ?? "Product"}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Search className="w-5 h-5" />
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white uppercase tracking-wide">
                Out
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1 min-w-0">
              {p.name}
            </h4>
            {badge && (
              <span
                className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            {p.brand?.title && (
              <span className="truncate max-w-[120px]">{p.brand.title}</span>
            )}
            {p.brand?.title && p.category && (
              <span className="text-gray-300">•</span>
            )}
            {p.category && (
              <span className="truncate max-w-[120px] capitalize">
                {p.category}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                {typeof p.totalReviews === "number" && p.totalReviews > 0 && (
                  <span className="text-gray-400">({p.totalReviews})</span>
                )}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
                -{p.discount}%
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {discountedPrice != null ? (
            <>
              <div className="text-sm font-bold text-gofarm-green leading-tight">
                {formatPrice(discountedPrice)}
              </div>
              <div className="text-[11px] text-gray-400 line-through leading-tight">
                {formatPrice(p.price ?? 0)}
              </div>
            </>
          ) : (
            <div className="text-sm font-bold text-gofarm-green">
              {typeof p.price === "number" ? formatPrice(p.price) : ""}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
};

const SearchBar = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [recommended, setRecommended] = useState<SearchProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));

  // Load recent searches on mount
  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Fetch recommended (top-rated) products once when first opened
  const fetchRecommended = useCallback(async () => {
    if (recommended.length > 0) return;
    try {
      const query = `*[_type == "product" && defined(slug.current)] {
        _id, name, slug, images, price, discount, status, stock,
        "brand": brand->{ title },
        "category": categories[0]->title,
        "averageRating": math::avg(*[_type == "review" && product._ref == ^._id && status == "approved"].rating),
        "totalReviews": count(*[_type == "review" && product._ref == ^._id && status == "approved"])
      } | order(coalesce(averageRating, 0) desc, coalesce(totalReviews, 0) desc)[0...8]`;
      const data = await client.fetch<SearchProduct[]>(query);
      setRecommended(data ?? []);
    } catch (err) {
      console.error("Error fetching recommended products:", err);
    }
  }, [recommended.length]);

  useEffect(() => {
    if (open) fetchRecommended();
  }, [open, fetchRecommended]);

  // Debounced search
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const query = `*[_type == "product" && (name match $q || description match $q)] | order(name asc)[0...10] {
          _id, name, slug, images, price, discount, status, stock,
          "brand": brand->{ title },
          "category": categories[0]->title,
          "averageRating": math::avg(*[_type == "review" && product._ref == ^._id && status == "approved"].rating),
          "totalReviews": count(*[_type == "review" && product._ref == ^._id && status == "approved"])
        }`;
        const data = await client.fetch<SearchProduct[]>(query, {
          q: `${search}*`,
        });
        setResults(data ?? []);
      } catch (err) {
        console.error("Error searching products:", err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  const pushRecent = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      const next = [
        t,
        ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase()),
      ].slice(0, MAX_RECENT);
      setRecent(next);
      saveRecent(next);
    },
    [recent],
  );

  const removeRecent = (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    saveRecent(next);
  };

  const resetRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    pushRecent(term);
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  const handleSelectRecent = (term: string) => {
    setSearch(term);
    inputRef.current?.focus();
  };

  const showSearchState = search.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative flex flex-1">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            placeholder="Search products..."
            className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-gofarm-green focus:ring-2 focus:ring-gofarm-green/20 rounded-lg pl-9 pr-9 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all min-w-[200px] md:min-w-60"
            aria-label="Search products"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 p-1 hover:bg-gray-100 rounded-md"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto">
            {showSearchState ? (
              <div className="py-3">
                <div className="px-4 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    {loading
                      ? "Searching..."
                      : `Search Results${
                          results.length > 0 ? ` (${results.length})` : ""
                        }`}
                  </h3>
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-gofarm-green" />
                  )}
                </div>
                {loading ? (
                  <ul className="divide-y divide-gray-100">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </ul>
                ) : results.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">
                    No products match{" "}
                    <span className="font-medium">&ldquo;{search}&rdquo;</span>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {results.map((p) => (
                      <ProductRow
                        key={p._id}
                        product={p}
                        onSelect={() => {
                          pushRecent(p.name ?? search);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <>
                {recent.length > 0 && (
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        Recent Search
                      </h3>
                      <button
                        type="button"
                        onClick={resetRecent}
                        className="text-xs font-semibold text-gofarm-green hover:underline"
                      >
                        Reset History
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((term) => (
                        <span
                          key={term}
                          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-gray-200 bg-white hover:border-gofarm-green/40 transition-colors text-sm text-gray-700"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectRecent(term)}
                            className="truncate max-w-[140px]"
                          >
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRecent(term)}
                            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            aria-label={`Remove ${term}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-4 pt-4 pb-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    Recommended
                  </h3>
                  {recommended.length === 0 ? (
                    <ul className="divide-y divide-gray-100 -mx-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </ul>
                  ) : (
                    <ul className="divide-y divide-gray-100 -mx-4">
                      {recommended.map((p) => (
                        <ProductRow
                          key={p._id}
                          product={p}
                          onSelect={() => {
                            pushRecent(p.name ?? "");
                            setOpen(false);
                          }}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
