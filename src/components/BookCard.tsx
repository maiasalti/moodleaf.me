"use client";

import { useState } from "react";
import { BookWithScore, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";
import MatchBadge from "./MatchBadge";

interface BookCardProps {
  book: BookWithScore;
  index: number;
}

function getTopTraits(book: BookWithScore, count: number = 3) {
  return SLIDER_DIMENSIONS.map((dim) => ({
    ...dim,
    value: book[dim.key as TraitKey] as number,
  }))
    .sort((a, b) => Math.abs(b.value - 5.5) - Math.abs(a.value - 5.5))
    .slice(0, count);
}

export default function BookCard({ book, index }: BookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const topTraits = getTopTraits(book);
  const description = book.description || "No description available.";
  const isLong = description.length > 150;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-stone-100">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-stone-100">
            <span className="px-4 text-center font-serif text-lg text-green-900/40">
              {book.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <MatchBadge percentage={book.matchPercentage} />

        <h3 className="font-serif text-lg font-semibold leading-snug text-green-900">
          {book.title}
        </h3>
        <p className="text-sm text-stone-500">{book.author}</p>

        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          {expanded || !isLong
            ? description
            : description.slice(0, 150) + "..."}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 font-medium text-green-700 hover:text-green-900"
            >
              {expanded ? "less" : "more"}
            </button>
          )}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {topTraits.map((trait) => (
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
