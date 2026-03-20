"use client";

import { useState, useRef, useEffect } from "react";
import { Book } from "@/lib/types";

interface BookSearchSelectProps {
  books: Book[];
  onSelect: (book: Book) => void;
  onClose: () => void;
}

export default function BookSearchSelect({ books, onSelect, onClose }: BookSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Book[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!value.trim()) {
        setMatches([]);
        return;
      }
      const q = value.trim().toLowerCase();
      const filtered = books
        .filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        )
        .slice(0, 8);
      setMatches(filtered);
    }, 150);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search for a book you just finished..."
            className="w-full rounded-xl border border-stone-200 bg-[var(--color-surface)]/80 py-2.5 pl-10 pr-4 text-sm text-stone-700 placeholder-stone-400 outline-none backdrop-blur-sm transition-colors focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
        </div>
        <button
          onClick={onClose}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          Cancel
        </button>
      </div>

      {matches.length > 0 && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl border border-stone-200 bg-[var(--color-surface-elevated)] shadow-lg backdrop-blur-md">
          {matches.map((book) => (
            <button
              key={book.id}
              onClick={() => onSelect(book)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-green-50"
            >
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt=""
                  className="h-12 w-8 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-stone-200">
                  <span className="text-xs text-stone-400">?</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-green-900">
                  {book.title}
                </p>
                <p className="truncate text-xs text-stone-500">{book.author}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
