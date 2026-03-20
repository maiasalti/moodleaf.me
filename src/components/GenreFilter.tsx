"use client";

import { useState, useRef, useEffect } from "react";

interface GenreFilterProps {
  genres: string[];
  selected: Set<string>;
  onChange: (genres: Set<string>) => void;
}

export default function GenreFilter({
  genres,
  selected,
  onChange,
}: GenreFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (genre: string) => {
    const next = new Set(selected);
    if (next.has(genre)) next.delete(genre);
    else next.add(genre);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const label =
    selected.size === 0
      ? "All genres"
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} genres`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-stone-200 bg-[var(--color-surface)]/60 px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition-colors hover:border-stone-300 hover:bg-[var(--color-surface)]/80"
      >
        <span>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-56 rounded-xl border border-stone-200 bg-[var(--color-surface-elevated)] p-2 shadow-lg backdrop-blur-md">
          {selected.size > 0 && (
            <button
              onClick={clearAll}
              className="mb-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
            >
              Clear all
            </button>
          )}
          {genres.map((genre) => (
            <label
              key={genre}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-green-50"
            >
              <input
                type="checkbox"
                checked={selected.has(genre)}
                onChange={() => toggle(genre)}
                className="h-4 w-4 rounded border-stone-300 text-green-700 accent-green-700"
              />
              {genre}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
