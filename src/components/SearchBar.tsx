'use client';
import { Search } from 'lucide-react';
import { useState } from 'react';

const SearchBar = () => {
  const [isMac] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      navigator.platform.toUpperCase().includes('MAC')
  );

  return (
    <div className="flex flex-1">
      <button
        className="group flex items-center w-full gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gofarm-light-green rounded-lg px-3 py-2 transition-all duration-200 min-w-50 md:min-w-60"
        aria-label={`Open search (${isMac ? 'Cmd' : 'Ctrl'}+K)`}
      >
        <Search className="w-4 h-4 text-gray-400 group-hover:text-gofarm-green transition-colors duration-200 shrink-0" />

        <span className="sm:text-xs md:text-md text-gray-500 group-hover:text-gray-700 transition-colors duration-200 flex-1 text-left">
          Search <span className="hidden md:inline-block">products...</span>
        </span>

        <div className="flex items-center gap-1 bg-white border border-gray-200 group-hover:border-gray-300 px-2 py-1 rounded text-xs text-gray-500 font-mono shrink-0 transition-colors duration-200">
          <span>{isMac ? '⌘' : 'Ctrl'}</span>
          <span>K</span>
        </div>
      </button>
    </div>
  );
};

export default SearchBar;
