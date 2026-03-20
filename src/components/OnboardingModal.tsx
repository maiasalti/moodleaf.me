"use client";

import { useState } from "react";
import { Book, SliderValues } from "@/lib/types";
import { averageTraits } from "@/lib/constants";

interface OnboardingModalProps {
  books: Book[];
  onComplete: (values: SliderValues) => void;
  onSkip: () => void;
}

export default function OnboardingModal({ books, onComplete, onSkip }: OnboardingModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSetMood = () => {
    const picked = books.filter((b) => selected.has(b.id));
    if (picked.length < 3) return;
    const averaged = averageTraits(picked);
    onComplete(averaged);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-cream shadow-2xl">
        <div className="px-6 pt-6 pb-4 text-center">
          <h2 className="font-serif text-2xl font-bold text-green-900">
            Welcome to Moodleaf
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Pick 3 or more books you love, and we&apos;ll set your sliders to match your taste.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {books.map((book) => {
              const isSelected = selected.has(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => toggle(book.id)}
                  className={`group relative overflow-hidden rounded-xl transition-all ${
                    isSelected
                      ? "ring-2 ring-green-700 ring-offset-2"
                      : "hover:ring-1 hover:ring-stone-300"
                  }`}
                >
                  <div className="aspect-[2/3] w-full overflow-hidden bg-stone-100">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-100 to-stone-200 px-2">
                        <span className="text-center text-xs font-semibold leading-tight text-green-900/70">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-800/40">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                  <p className="mt-1 truncate px-1 text-xs text-stone-600">
                    {book.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
          <button
            onClick={onSkip}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            Skip
          </button>
          <button
            onClick={handleSetMood}
            disabled={selected.size < 3}
            className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-40"
          >
            Set my mood ({selected.size} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
