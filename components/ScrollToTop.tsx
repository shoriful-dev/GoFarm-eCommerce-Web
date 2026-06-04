"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gofarm-green/20 hover:border-gofarm-green overflow-hidden group"
          aria-label="Scroll to top"
        >
          <span className="absolute inset-0 bg-linear-to-b from-gofarm-light-green to-gofarm-green -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
          <ArrowUp className="relative z-10 h-5 w-5 text-gofarm-black transition-colors duration-500 group-hover:text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
