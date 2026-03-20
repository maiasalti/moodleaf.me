"use client";

import { BookWithScore } from "@/lib/types";
import BookCard from "./BookCard";

interface ResultsGridProps {
  books: BookWithScore[];
  loading: boolean;
  visibleCount: number;
  savedBookIds?: Set<string>;
  hiddenCount?: number;
  showHidden?: boolean;
  onToggleSave?: (bookId: string) => void;
  onHide?: (bookId: string) => void;
  onToggleShowHidden?: () => void;
  onShowMore?: () => void;
  onBookClick?: (book: BookWithScore) => void;
}

export default function ResultsGrid({
  books,
  loading,
  visibleCount,
  savedBookIds,
  hiddenCount = 0,
  showHidden = false,
  onToggleSave,
  onHide,
  onToggleShowHidden,
  onShowMore,
  onBookClick,
}: ResultsGridProps) {
  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-surface)]/60">
              <div className="aspect-[2/3] w-full rounded-t-2xl bg-stone-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-16 rounded bg-stone-200" />
                <div className="h-5 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-200" />
                <div className="h-12 w-full rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
        <p className="text-stone-400">No books match your current filters. Try adjusting your sliders or unlocking a dimension.</p>
      </section>
    );
  }

  const visible = books.slice(0, visibleCount);
  const hasMore = books.length > visibleCount;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-center gap-3">
        <h2 className="text-center font-serif text-2xl font-semibold text-green-900">
          Your recommendations
        </h2>
        {hiddenCount > 0 && onToggleShowHidden && (
          <button
            onClick={onToggleShowHidden}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-200"
          >
            {hiddenCount} hidden · {showHidden ? "Hide" : "Show"}
          </button>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            saved={savedBookIds?.has(book.id)}
            onToggleSave={onToggleSave}
            onHide={onHide}
            onClick={() => onBookClick?.(book)}
          />
        ))}
      </div>
      {hasMore && onShowMore && (
        <div className="mt-10 text-center">
          <button
            onClick={onShowMore}
            className="rounded-full border border-stone-300 bg-[var(--color-surface)]/70 px-8 py-3 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-green-700 hover:bg-green-50 hover:text-green-800"
          >
            Show more ({books.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
