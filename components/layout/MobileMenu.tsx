"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import Sidebar from "./Sidebar";

const MobileMenu = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open menu"
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-gofarm-green hover:border-gofarm-green/40 hover:bg-gofarm-light-green/10 active:scale-95 transition-all"
      >
        <Menu className="w-5 h-5" strokeWidth={2.25} />
      </button>
      <div className="md:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </>
  );
};

export default MobileMenu;
