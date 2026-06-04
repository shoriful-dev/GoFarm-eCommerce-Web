"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Lock, Menu, Sparkles, X } from "lucide-react";
import Container from "@/components/Container";

const PURCHASE_URL =
  process.env.NEXT_PUBLIC_PURCHASE_CODE_URL || "https://reactbd.com";

const PREMIUM_BULLETS = [
  "Three-column product mega menu with live previews",
  "Cached category + product fetch with hover-swap art",
  "Quick links: recent, recommended, promotions, new arrivals",
];

/**
 * Header "Products" trigger.
 *
 * In the open-source build the actual mega menu (live category browser,
 * preview imagery, quick-link rails) is gated behind the premium release.
 * Clicking the pill opens a compact premium-feature card that links out
 * to the purchase URL configured via NEXT_PUBLIC_PURCHASE_CODE_URL.
 */
const ProductsMegaMenu = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [panelTop, setPanelTop] = useState<number>(0);

  // Anchor the fixed panel just below the trigger, even on scroll/resize.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setPanelTop(rect.bottom + 8);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [open]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-gofarm-light-gray bg-white text-sm font-semibold text-gofarm-black hover:border-gofarm-light-green hover:text-gofarm-green hoverEffect"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        Products
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Products mega menu — premium feature"
          className="fixed left-0 right-0 z-50 bg-white border-t border-gofarm-light-gray shadow-2xl"
          style={{ top: panelTop }}
        >
          <Container className="py-8 md:py-10">
            <div className="mx-auto max-w-3xl">
              <div className="relative overflow-hidden rounded-2xl border border-gofarm-light-green/30 bg-white shadow-md">
                {/* Top accent */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-gofarm-green via-gofarm-light-green to-gofarm-orange"
                />

                <div className="grid md:grid-cols-[auto_1fr] gap-6 p-6 md:p-8">
                  {/* Icon column */}
                  <div className="flex md:flex-col items-center md:items-start gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gofarm-green/10 text-gofarm-green">
                      <Crown className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-gofarm-orange/30 bg-gofarm-light-orange px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gofarm-orange">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Premium
                    </div>
                  </div>

                  {/* Content column */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gofarm-black leading-tight">
                      The Products mega menu is a premium feature
                    </h2>
                    <p className="mt-2 text-sm md:text-base text-gofarm-gray leading-relaxed">
                      The full category browser ships with the GoFarm
                      premium build. In the meantime, browse the public shop or
                      grab the production code to unlock it on your own
                      deployment.
                    </p>

                    <ul className="mt-4 space-y-2">
                      {PREMIUM_BULLETS.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-gofarm-black"
                        >
                          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gofarm-green/15 text-gofarm-green">
                            <Sparkles
                              className="h-2.5 w-2.5"
                              aria-hidden="true"
                            />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={PURCHASE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gofarm-orange px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-orange focus:ring-offset-2"
                      >
                        Get the premium code
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href="/shop"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gofarm-light-gray bg-white px-5 py-2.5 text-sm font-semibold text-gofarm-black transition-colors hover:border-gofarm-green hover:text-gofarm-green focus:outline-none focus:ring-2 focus:ring-gofarm-green focus:ring-offset-2"
                      >
                        Browse the shop
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};

export default ProductsMegaMenu;
