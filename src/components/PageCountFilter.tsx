"use client";

import { PAGE_COUNT_RANGES } from "@/lib/constants";

interface PageCountFilterProps {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export default function PageCountFilter({ selected, onChange }: PageCountFilterProps) {
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <div className="flex items-center gap-2">
      {PAGE_COUNT_RANGES.map((range) => (
        <button
          key={range.key}
          onClick={() => toggle(range.key)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            selected.has(range.key)
              ? "bg-green-800 text-white"
              : "bg-[var(--color-surface)]/70 text-stone-500 hover:bg-green-50 hover:text-green-800"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
