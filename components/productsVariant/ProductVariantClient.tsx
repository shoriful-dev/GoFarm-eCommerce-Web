"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal,
  Grid3x3,
  LayoutGrid,
  ChevronDown,
  PackageX,
} from "lucide-react";
import ProductCard from "../ProductCard";
import ProductListCard from "../ProductListCard";
import NoProductAvailable from "../product/NoProductAvailable";
import { ALL_PRODUCTS_QUERY_RESULT } from "@/sanity.types";

interface Props {
  products: ALL_PRODUCTS_QUERY_RESULT;
  variantTitle: string;
}

type ViewMode = "grid" | "list";
type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "rating-desc";

const ProductVariantClient = ({ products, variantTitle }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Price ranges
  const priceRanges = [
    { label: "All Prices", value: "all", min: 0, max: Infinity },
    { label: "Under $10", value: "0-10", min: 0, max: 10 },
    { label: "$10 - $50", value: "10-50", min: 10, max: 50 },
    { label: "$50 - $100", value: "50-100", min: 50, max: 100 },
    { label: "$100 - $500", value: "100-500", min: 100, max: 500 },
    { label: "Over $500", value: "500-10000", min: 500, max: 10000 },
  ];

  // Sort and filter products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by price
    if (priceFilter !== "all") {
      const range = priceRanges.find((r) => r.value === priceFilter);
      if (range) {
        result = result.filter((product) => {
          const price = product.price || 0;
          return price >= range.min && price < range.max;
        });
      }
    }

    // Sort products
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "rating-desc":
          // Assuming you have rating data in products
          return 0; // Placeholder for rating sort
        default:
          return 0;
      }
    });

    return result;
  }, [products, sortBy, priceFilter]);

  return (
    <div className="space-y-6">
      {/* Filters & Controls Bar */}
      <div className="bg-gofarm-white rounded-xl shadow-md border border-gofarm-light-gray/30 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Section - Results Count */}
          <div className="flex items-center gap-3">
            <div className="bg-gofarm-light-orange px-4 py-2 rounded-lg">
              <span className="text-gofarm-green font-bold text-lg">
                {filteredAndSortedProducts.length}
              </span>
              <span className="text-gofarm-gray text-sm ml-2">
                {filteredAndSortedProducts.length === 1
                  ? "Product"
                  : "Products"}
              </span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gofarm-green text-white rounded-lg hover:bg-gofarm-light-green transition-colors"
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
          </div>

          {/* Right Section - View Mode & Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gofarm-light-gray/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-gofarm-white shadow-sm text-gofarm-green"
                    : "text-gofarm-gray hover:text-gofarm-green"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-gofarm-white shadow-sm text-gofarm-green"
                    : "text-gofarm-gray hover:text-gofarm-green"
                }`}
                aria-label="List view"
              >
                <Grid3x3 size={20} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-gofarm-white border border-gofarm-light-gray rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gofarm-black hover:border-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-green/20 focus:border-gofarm-green transition-all cursor-pointer"
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gofarm-gray pointer-events-none"
                size={18}
              />
            </div>

            {/* Price Filter - Desktop */}
            <div className="hidden lg:block relative">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none bg-gofarm-white border border-gofarm-light-gray rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gofarm-black hover:border-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-green/20 focus:border-gofarm-green transition-all cursor-pointer"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gofarm-gray pointer-events-none"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gofarm-light-gray">
                <label className="block text-sm font-semibold text-gofarm-black mb-2">
                  Price Range
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full appearance-none bg-gofarm-white border border-gofarm-light-gray rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gofarm-black focus:outline-none focus:ring-2 focus:ring-gofarm-green/20 focus:border-gofarm-green transition-all"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters */}
        {priceFilter !== "all" && (
          <div className="mt-4 pt-4 border-t border-gofarm-light-gray">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gofarm-gray">Active filters:</span>
              <button
                onClick={() => setPriceFilter("all")}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gofarm-light-orange text-gofarm-green rounded-full text-sm font-medium hover:bg-gofarm-orange/30 transition-colors"
              >
                {priceRanges.find((r) => r.value === priceFilter)?.label}
                <span className="text-gofarm-green">×</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Display */}
      {filteredAndSortedProducts.length > 0 ? (
        <motion.div
          layout
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
              : "flex flex-col gap-4"
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedProducts.map((product, index) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                {viewMode === "grid" ? (
                  <ProductCard product={product} />
                ) : (
                  <ProductListCard product={product} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gofarm-white rounded-xl shadow-md border border-gofarm-light-gray/30 p-12"
        >
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="bg-gofarm-light-gray/50 rounded-full p-6 mb-6">
              <PackageX className="w-16 h-16 text-gofarm-gray" />
            </div>
            <h3 className="text-2xl font-bold text-gofarm-black mb-3">
              No Products Found
            </h3>
            <p className="text-gofarm-gray mb-6">
              No products match your current filters. Try adjusting your price
              range or sort options.
            </p>
            {priceFilter !== "all" && (
              <button
                onClick={() => setPriceFilter("all")}
                className="px-6 py-3 bg-gofarm-green text-white font-semibold rounded-lg hover:bg-gofarm-light-green transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductVariantClient;
