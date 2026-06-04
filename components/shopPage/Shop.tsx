"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Filter,
  Grid3x3,
  List,
  Loader2,
  Search,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import Container from "../Container";
import ProductCard from "../ProductCard";
import ProductListCard from "../ProductListCard";
import NoProductAvailable from "../product/NoProductAvailable";
import { client } from "@/sanity/lib/client";
import type { BRANDS_QUERY_RESULT, Category, Product } from "@/sanity.types";

interface Props {
  categories: Category[];
  brands: BRANDS_QUERY_RESULT;
}

interface Counts {
  categories: Record<string, number>;
  brands: Record<string, number>;
  status: { new: number; hot: number; sale: number };
}

const PRODUCTS_PER_PAGE = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 1000;

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Biggest Discount", value: "discount" },
] as const;

const DISCOUNT_BUCKETS = [
  { label: "Up to 5%", value: "0-5" },
  { label: "5% - 10%", value: "5-10" },
  { label: "10% - 15%", value: "10-15" },
  { label: "15% - 25%", value: "15-25" },
  { label: "More than 25%", value: "25-100" },
];

const STATUS_OPTIONS = [
  { label: "New Arrivals", value: "new" },
  { label: "Hot Picks", value: "hot" },
  { label: "On Sale", value: "sale" },
];

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const buildSortClause = (sort: SortValue) => {
  switch (sort) {
    case "newest":
      return "_createdAt desc";
    case "price-asc":
      return "price asc";
    case "price-desc":
      return "price desc";
    case "rating":
      return "coalesce(averageRating, 0) desc, coalesce(totalReviews, 0) desc";
    case "discount":
      return "coalesce(discount, 0) desc";
    case "featured":
    default:
      return "isFeatured desc, name asc";
  }
};

const Shop = ({ categories, brands }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- URL-driven state ----
  const initialQ = searchParams?.get("q") ?? "";
  const initialCategory = searchParams?.get("category");
  const initialBrand = searchParams?.get("brand");
  const initialMinPrice = Number(searchParams?.get("minPrice") ?? PRICE_MIN);
  const initialMaxPrice = Number(searchParams?.get("maxPrice") ?? PRICE_MAX);
  const initialMinRating = Number(searchParams?.get("rating") ?? 0);
  const initialDiscount = searchParams?.get("discount") ?? null;
  const initialStatus = searchParams?.get("status") ?? null;
  const initialSort = (searchParams?.get("sort") ?? "featured") as SortValue;
  const initialView = (searchParams?.get("view") as "grid" | "list") ?? "grid";
  const initialPage = Number(searchParams?.get("page") ?? 1);

  const [q, setQ] = useState(initialQ);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory,
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    initialBrand,
  );
  const [minPrice, setMinPrice] = useState<number>(
    Number.isFinite(initialMinPrice) ? initialMinPrice : PRICE_MIN,
  );
  const [maxPrice, setMaxPrice] = useState<number>(
    Number.isFinite(initialMaxPrice) ? initialMaxPrice : PRICE_MAX,
  );
  const [minRating, setMinRating] = useState<number>(
    Number.isFinite(initialMinRating) ? initialMinRating : 0,
  );
  const [discountBucket, setDiscountBucket] = useState<string | null>(
    initialDiscount,
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(
    initialStatus,
  );
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [view, setView] = useState<"grid" | "list">(initialView);
  const [page, setPage] = useState<number>(initialPage > 0 ? initialPage : 1);

  // ---- Data state ----
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({
    categories: {},
    brands: {},
    status: { new: 0, hot: 0, sale: 0 },
  });

  // ---- UI state ----
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Two-stage render so we can run an enter/exit slide animation: keep the
  // drawer mounted (`mobileFilterRendered`) while toggling `mobileFilterAnimateIn`
  // a tick later to trigger the CSS transition.
  const [mobileFilterRendered, setMobileFilterRendered] = useState(false);
  const [mobileFilterAnimateIn, setMobileFilterAnimateIn] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  // Drive the mobile filter drawer enter/exit animation.
  useEffect(() => {
    if (showMobileFilters) {
      setMobileFilterRendered(true);
      // Wait one frame so the initial translated/opacity-0 state is committed
      // before flipping to the end state — that's what produces the slide-in.
      const id = requestAnimationFrame(() => setMobileFilterAnimateIn(true));
      return () => cancelAnimationFrame(id);
    }
    setMobileFilterAnimateIn(false);
    // Match the longest CSS transition duration below (300ms).
    const id = window.setTimeout(() => setMobileFilterRendered(false), 300);
    return () => window.clearTimeout(id);
  }, [showMobileFilters]);

  // Sync state -> URL (shallow replace)
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (minPrice !== PRICE_MIN) params.set("minPrice", String(minPrice));
    if (maxPrice !== PRICE_MAX) params.set("maxPrice", String(maxPrice));
    if (minRating > 0) params.set("rating", String(minRating));
    if (discountBucket) params.set("discount", discountBucket);
    if (statusFilter) params.set("status", statusFilter);
    if (sort !== "featured") params.set("sort", sort);
    if (view !== "grid") params.set("view", view);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    router.replace(query ? `/shop?${query}` : "/shop", { scroll: false });
  }, [
    q,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    discountBucket,
    statusFilter,
    sort,
    view,
    page,
    router,
  ]);

  // Reset page on filter changes (not on view/sort/page itself)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [
    q,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    discountBucket,
    statusFilter,
  ]);

  // Build GROQ filter expression for shared fragments
  const filterExpr = useMemo(() => {
    const conds: string[] = ["_type == 'product'"];
    if (selectedCategory)
      conds.push(
        `references(*[_type == "category" && slug.current == $selectedCategory]._id)`,
      );
    if (selectedBrand)
      conds.push(
        `references(*[_type == "brand" && slug.current == $selectedBrand]._id)`,
      );
    conds.push(`coalesce(price, 0) >= $minPrice`);
    conds.push(`coalesce(price, 0) <= $maxPrice`);
    if (minRating > 0) conds.push(`coalesce(averageRating, 0) >= $minRating`);
    if (discountBucket) {
      conds.push(`coalesce(discount, 0) > $discountMin`);
      conds.push(`coalesce(discount, 0) <= $discountMax`);
    }
    if (statusFilter) conds.push(`status == $statusFilter`);
    if (q) conds.push(`(name match $q || description match $q)`);
    return conds.join(" && ");
  }, [
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    discountBucket,
    statusFilter,
    q,
  ]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * PRODUCTS_PER_PAGE;
      const end = offset + PRODUCTS_PER_PAGE;
      const sortClause = buildSortClause(sort);

      let discountMin = 0;
      let discountMax = 100;
      if (discountBucket) {
        const [lo, hi] = discountBucket.split("-").map(Number);
        discountMin = lo;
        discountMax = hi;
      }

      const params: Record<string, unknown> = {
        selectedCategory,
        selectedBrand,
        minPrice,
        maxPrice,
        minRating,
        discountMin,
        discountMax,
        statusFilter,
        q: q ? `${q}*` : "",
        offset,
        end,
      };

      const productsQuery = `*[${filterExpr}] | order(${sortClause})[$offset...$end]{
        ..., "categories": categories[]->title
      }`;
      const countQuery = `count(*[${filterExpr}])`;
      const facetsQuery = `{
        "categories": *[_type == "category"]{
          "slug": slug.current,
          "count": count(*[_type == "product" && references(^._id)])
        },
        "brands": *[_type == "brand"]{
          "slug": slug.current,
          "count": count(*[_type == "product" && references(^._id)])
        },
        "status": {
          "new": count(*[_type == "product" && status == "new"]),
          "hot": count(*[_type == "product" && status == "hot"]),
          "sale": count(*[_type == "product" && status == "sale"])
        }
      }`;

      const [data, total, facets] = await Promise.all([
        client.fetch<Product[]>(productsQuery, params),
        client.fetch<number>(countQuery, params),
        client.fetch<{
          categories: { slug: string; count: number }[];
          brands: { slug: string; count: number }[];
          status: { new: number; hot: number; sale: number };
        }>(facetsQuery),
      ]);

      setProducts(data ?? []);
      setTotalCount(total ?? 0);
      setCounts({
        categories: Object.fromEntries(
          (facets?.categories ?? []).map((c) => [c.slug, c.count]),
        ),
        brands: Object.fromEntries(
          (facets?.brands ?? []).map((b) => [b.slug, b.count]),
        ),
        status: facets?.status ?? { new: 0, hot: 0, sale: 0 },
      });
    } catch (err) {
      console.error("Shop fetch failed:", err);
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    filterExpr,
    page,
    sort,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    discountBucket,
    statusFilter,
    q,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo = Math.min(page * PRODUCTS_PER_PAGE, totalCount);

  const filteredCategories = useMemo(
    () =>
      (categories ?? []).filter((c) =>
        (c.title ?? "").toLowerCase().includes(categorySearch.toLowerCase()),
      ),
    [categories, categorySearch],
  );

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (discountBucket ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (q ? 1 : 0);

  const clearAll = () => {
    setQ("");
    setCategorySearch("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setMinRating(0);
    setDiscountBucket(null);
    setStatusFilter(null);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---- Filter Panel (shared between desktop sidebar + mobile drawer) ----
  const FilterPanel = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-semibold text-gofarm-green hover:underline disabled:text-gray-400 disabled:no-underline"
          disabled={activeFilterCount === 0}
        >
          Clear All
        </button>
      </div>

      {/* Category */}
      <FilterSection title="Category" onReset={() => setSelectedCategory(null)}>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gofarm-green focus:bg-white"
          />
        </div>
        <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredCategories.map((cat) => {
            const slug = cat.slug?.current ?? "";
            const checked = selectedCategory === slug;
            const count = counts.categories[slug] ?? 0;
            return (
              <li key={cat._id}>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedCategory(checked ? null : slug)}
                    className="accent-gofarm-green w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm capitalize ${
                      checked
                        ? "text-gofarm-green font-semibold"
                        : "text-gray-700 group-hover:text-gray-900"
                    }`}
                  >
                    {cat.title}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    ({count})
                  </span>
                </label>
              </li>
            );
          })}
          {filteredCategories.length === 0 && (
            <li className="text-xs text-gray-400 py-2 text-center">
              No categories
            </li>
          )}
        </ul>
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price Range"
        onReset={() => {
          setMinPrice(PRICE_MIN);
          setMaxPrice(PRICE_MAX);
        }}
      >
        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          minValue={minPrice}
          maxValue={maxPrice}
          onChange={(lo, hi) => {
            setMinPrice(lo);
            setMaxPrice(hi);
          }}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating" onReset={() => setMinRating(0)}>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((r) => {
            const active = minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(active ? 0 : r)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
                aria-label={`${r} stars and up`}
              >
                <span>{r}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </button>
            );
          })}
        </div>
        {minRating > 0 && (
          <p className="text-[11px] text-gray-500 mt-2">
            Showing {minRating}★ &amp; up
          </p>
        )}
      </FilterSection>

      {/* Status */}
      <FilterSection title="Status" onReset={() => setStatusFilter(null)}>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = statusFilter === s.value;
            const count = counts.status[s.value as keyof typeof counts.status];
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(active ? null : s.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-gofarm-green border-gofarm-green text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gofarm-green hover:bg-gofarm-light-green/10"
                }`}
              >
                {s.label}
                {count > 0 && (
                  <span className={active ? "text-white/80" : "text-gray-400"}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Discount */}
      <FilterSection title="Discount" onReset={() => setDiscountBucket(null)}>
        <ul className="space-y-1.5">
          {DISCOUNT_BUCKETS.map((d) => {
            const checked = discountBucket === d.value;
            return (
              <li key={d.value}>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setDiscountBucket(checked ? null : d.value)}
                    className="accent-gofarm-green w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      checked
                        ? "text-gofarm-green font-semibold"
                        : "text-gray-700 group-hover:text-gray-900"
                    }`}
                  >
                    {d.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand" onReset={() => setSelectedBrand(null)}>
        <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {(brands ?? []).map((b) => {
            const slug = b.slug?.current ?? "";
            const checked = selectedBrand === slug;
            const count = counts.brands[slug] ?? 0;
            return (
              <li key={b._id}>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedBrand(checked ? null : slug)}
                    className="accent-gofarm-green w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm capitalize ${
                      checked
                        ? "text-gofarm-green font-semibold"
                        : "text-gray-700 group-hover:text-gray-900"
                    }`}
                  >
                    {b.title}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    ({count})
                  </span>
                </label>
              </li>
            );
          })}
          {(brands ?? []).length === 0 && (
            <li className="text-xs text-gray-400 py-2 text-center">
              No brands
            </li>
          )}
        </ul>
      </FilterSection>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <Container className="py-6">
        {/* Page header */}
        <div ref={topRef} className="mb-5 sm:mb-6">
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"
          >
            <span>Home</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">Shop</span>
            {selectedCategory && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gofarm-green font-medium capitalize">
                  {
                    categories?.find(
                      (c) => c.slug?.current === selectedCategory,
                    )?.title
                  }
                </span>
              </>
            )}
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Shop
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Browse our full catalog of fresh products
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gofarm-green focus:ring-2 focus:ring-gofarm-green/20"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-4 bg-white border border-gray-200 rounded-xl p-5">
              {FilterPanel}
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile filter button */}
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gofarm-green hover:text-gofarm-green"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-gofarm-green text-white text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* View toggle */}
                <div className="hidden sm:inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      view === "grid"
                        ? "bg-white text-gofarm-green shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      view === "list"
                        ? "bg-white text-gofarm-green shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 hidden xs:block sm:ml-2 truncate">
                  {loading ? (
                    "Loading..."
                  ) : totalCount === 0 ? (
                    "No results"
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-gray-900">
                        {showingFrom}–{showingTo}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-900">
                        {totalCount}
                      </span>{" "}
                      results
                    </>
                  )}
                </p>
              </div>

              {/* Sort */}
              <div ref={sortRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gofarm-green hover:text-gofarm-green"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sort:</span>
                  <span className="font-semibold text-gray-900">
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label ??
                      "Sort"}
                  </span>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                          sort === opt.value
                            ? "bg-gofarm-light-green/15 text-gofarm-green font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && !loading && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">
                  Active:
                </span>
                {q && <FilterChip label={`"${q}"`} onRemove={() => setQ("")} />}
                {selectedCategory && (
                  <FilterChip
                    label={
                      categories?.find(
                        (c) => c.slug?.current === selectedCategory,
                      )?.title ?? selectedCategory
                    }
                    onRemove={() => setSelectedCategory(null)}
                  />
                )}
                {selectedBrand && (
                  <FilterChip
                    label={
                      brands?.find((b) => b.slug?.current === selectedBrand)
                        ?.title ?? selectedBrand
                    }
                    onRemove={() => setSelectedBrand(null)}
                  />
                )}
                {(minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX) && (
                  <FilterChip
                    label={`$${minPrice} – $${maxPrice}`}
                    onRemove={() => {
                      setMinPrice(PRICE_MIN);
                      setMaxPrice(PRICE_MAX);
                    }}
                  />
                )}
                {minRating > 0 && (
                  <FilterChip
                    label={`${minRating}★ & up`}
                    onRemove={() => setMinRating(0)}
                  />
                )}
                {discountBucket && (
                  <FilterChip
                    label={
                      DISCOUNT_BUCKETS.find((d) => d.value === discountBucket)
                        ?.label ?? discountBucket
                    }
                    onRemove={() => setDiscountBucket(null)}
                  />
                )}
                {statusFilter && (
                  <FilterChip
                    label={
                      STATUS_OPTIONS.find((s) => s.value === statusFilter)
                        ?.label ?? statusFilter
                    }
                    onRemove={() => setStatusFilter(null)}
                  />
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 text-xs font-semibold text-gofarm-green hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Products */}
            {loading ? (
              <ProductsSkeleton view={view} />
            ) : products.length > 0 ? (
              <>
                {view === "grid" ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {products.map((p) => (
                      <ProductListCard key={p._id} product={p} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={goToPage}
                  />
                )}
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12">
                <NoProductAvailable className="bg-transparent" />
                {activeFilterCount > 0 && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gofarm-green text-white text-sm font-semibold hover:bg-gofarm-green/90"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </Container>

      {/* Mobile filter drawer */}
      {mobileFilterRendered && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className={`absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              mobileFilterAnimateIn ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setShowMobileFilters(false)}
            aria-hidden
          />
          <div
            className={`relative ml-auto w-[88%] max-w-sm h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
              mobileFilterAnimateIn ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:text-gofarm-green hover:border-gofarm-green/40"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {FilterPanel}
            </div>
            <div className="border-t border-gray-200 p-3 grid grid-cols-2 gap-2 bg-white">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="px-4 py-2.5 rounded-lg bg-gofarm-green text-white text-sm font-semibold hover:bg-gofarm-green/90"
              >
                Show {totalCount} {totalCount === 1 ? "result" : "results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;

// ---- Sub-components ----

interface FilterSectionProps {
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}
const FilterSection = ({ title, onReset, children }: FilterSectionProps) => (
  <div className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-semibold text-gray-400 hover:text-gofarm-green"
        >
          Reset
        </button>
      )}
    </div>
    {children}
  </div>
);

interface PriceRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (lo: number, hi: number) => void;
}
const PriceRangeSlider = ({
  min,
  max,
  minValue,
  maxValue,
  onChange,
}: PriceRangeSliderProps) => {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);

  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  const commit = (lo: number, hi: number) => {
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    onChange(Math.max(min, a), Math.min(max, b));
  };

  const handleMin = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalMin(v);
  };
  const handleMax = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalMax(v);
  };

  const minPct = ((localMin - min) / (max - min)) * 100;
  const maxPct = ((localMax - min) / (max - min)) * 100;

  return (
    <div>
      <div className="relative h-6 mb-3">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gofarm-green"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMin}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          onKeyUp={() => commit(localMin, localMax)}
          className="price-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMax}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          onKeyUp={() => commit(localMin, localMax)}
          className="price-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="Maximum price"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">
            Min
          </span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              $
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={localMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalMin(v);
                commit(v, localMax);
              }}
              className="w-full pl-6 pr-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gofarm-green focus:bg-white"
            />
          </div>
        </label>
        <label className="block">
          <span className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">
            Max
          </span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              $
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={localMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalMax(v);
                commit(localMin, v);
              }}
              className="w-full pl-6 pr-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gofarm-green focus:bg-white"
            />
          </div>
        </label>
      </div>
      <style jsx>{`
        .price-range {
          height: 100%;
        }
        .price-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid var(--color-gofarm-green, #16a34a);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
        .price-range::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid var(--color-gofarm-green, #16a34a);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
        .price-range::-webkit-slider-runnable-track {
          background: transparent;
        }
        .price-range::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

const FilterChip = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gofarm-light-green/15 border border-gofarm-green/20 text-xs font-medium text-gofarm-green capitalize">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="rounded-full hover:bg-gofarm-green/15 p-0.5"
      aria-label={`Remove ${label}`}
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

const ProductsSkeleton = ({ view }: { view: "grid" | "list" }) => {
  if (view === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 animate-pulse"
          >
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="h-8 w-32 bg-gray-200 rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-1/3 bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
            <div className="h-8 w-full bg-gray-200 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}
const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  const pages: (number | "...")[] = useMemo(() => {
    const out: (number | "...")[] = [];
    const push = (p: number | "...") => out.push(p);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return out;
    }
    push(1);
    if (page > 3) push("...");
    const lo = Math.max(2, page - 1);
    const hi = Math.min(totalPages - 1, page + 1);
    for (let i = lo; i <= hi; i++) push(i);
    if (page < totalPages - 2) push("...");
    push(totalPages);
    return out;
  }, [page, totalPages]);

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gofarm-green hover:text-gofarm-green disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="inline-flex items-center justify-center w-9 h-9 text-gray-400 text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border text-sm font-semibold transition-colors ${
              p === page
                ? "border-gofarm-green bg-gofarm-green text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gofarm-green hover:text-gofarm-green"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gofarm-green hover:text-gofarm-green disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

// Avoid unused-import lint
void Loader2;
