"use client";

import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 200);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="relative">
      <svg
        className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by title or author..."
        className="w-full rounded-xl border border-stone-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-stone-700 placeholder-stone-400 outline-none backdrop-blur-sm transition-colors focus:border-green-700 focus:ring-1 focus:ring-green-700"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); onSearch(""); }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
