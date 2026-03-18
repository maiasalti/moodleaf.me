"use client";

import { useState } from "react";
import { BookWithScore, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";
import MatchBadge from "./MatchBadge";

interface BookCardProps {
  book: BookWithScore;
  index: number;
  saved?: boolean;
  onToggleSave?: (bookId: string) => void;
  onClick?: () => void;
}

function getWhyMatch(book: BookWithScore): string | null {
  if (!book.traitMatches) return null;
  const sorted = [...book.traitMatches].sort((a, b) => a.difference - b.difference);
  const strong = sorted.filter((t) => t.difference <= 1.5);
  if (strong.length === 0) return null;
  const top = strong.slice(0, 2).map((t) => t.label.toLowerCase());
  if (top.length === 2) return `Strong match on ${top[0]} and ${top[1]}`;
  return `Strong match on ${top[0]}`;
}

export default function BookCard({ book, index, saved, onToggleSave, onClick }: BookCardProps) {
  const [imgError, setImgError] = useState(false);
  const whyMatch = getWhyMatch(book);

  return (
    <div
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-100">
        {book.cover_image_url && !imgError ? (
          <img
            src={book.cover_image_url}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth < 50 || img.naturalHeight < 50) {
                setImgError(true);
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-100 to-stone-200 px-6">
            <span className="text-center font-serif text-xl font-semibold leading-tight text-green-900/70">
              {book.title}
            </span>
            <span className="text-center text-sm text-green-900/40">
              {book.author}
            </span>
          </div>
        )}
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(book.id); }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
            title={saved ? "Remove from saved" : "Save book"}
          >
            {saved ? (
              <svg className="h-4 w-4 text-green-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <MatchBadge percentage={book.matchPercentage} />

        <h3 className="font-serif text-lg font-semibold leading-snug text-green-900">
          {book.title}
        </h3>
        <p className="text-sm text-stone-500">{book.author}</p>

        {whyMatch && (
          <p className="text-xs font-medium text-green-700">{whyMatch}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {SLIDER_DIMENSIONS.map((dim) => ({
            ...dim,
            value: book[dim.key as TraitKey] as number,
          }))
            .sort((a, b) => Math.abs(b.value - 5.5) - Math.abs(a.value - 5.5))
            .slice(0, 3)
            .map((trait) => (
              <span
                key={trait.key}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
              >
                {trait.label}{" "}
                <span className="font-medium text-stone-700">
                  {trait.value}/10
                </span>
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
