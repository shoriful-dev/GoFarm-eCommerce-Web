"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LayoutGrid, Loader2 } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

interface CategoryItem {
  _id: string;
  title?: string;
  slug?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image?: any;
}

const AllCategoriesDropdown = () => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureLoaded = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
        setLoaded(true);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    ensureLoaded();
  };

  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href="/category"
        className="inline-flex items-center gap-1.5 hover:text-gofarm-light-green hoverEffect"
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        <LayoutGrid className="w-4 h-4" />
        All Categories
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </Link>

      {open && (
        <div
          className="absolute left-0 top-full pt-3 z-50 w-72"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gofarm-light-gray overflow-hidden">
            <div className="px-5 py-3 border-b border-gofarm-light-gray bg-gofarm-light-gray/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gofarm-black">
                Browse by category
              </h3>
              <Link
                href="/category"
                className="text-xs font-medium text-gofarm-green hover:underline"
              >
                See all
              </Link>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {loading && categories.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-gofarm-green" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gofarm-gray text-center py-8">
                  No categories available.
                </p>
              ) : (
                <div className="flex flex-col">
                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/category/${cat.slug ?? ""}`}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gofarm-light-green/10 transition-colors"
                    >
                      <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-gofarm-light-gray/40 border border-gofarm-light-gray group-hover:border-gofarm-light-green/50 flex items-center justify-center">
                        {cat.image ? (
                          <Image
                            src={urlFor(cat.image)
                              .width(96)
                              .height(96)
                              .fit("crop")
                              .url()}
                            alt={cat.title ?? "Category"}
                            fill
                            sizes="44px"
                            className="object-contain p-1.5 group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-gofarm-gray" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gofarm-black group-hover:text-gofarm-green truncate capitalize flex-1">
                        {cat.title}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCategoriesDropdown;
