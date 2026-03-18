"use client";

import { BookWithScore } from "@/lib/types";
import BookCard from "./BookCard";

interface ResultsGridProps {
  books: BookWithScore[];
  loading: boolean;
  savedBookIds?: Set<string>;
  onToggleSave?: (bookId: string) => void;
}

export default function ResultsGrid({ books, loading, savedBookIds, onToggleSave }: ResultsGridProps) {
  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white/60">
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

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-green-900">
        Your recommendations
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            saved={savedBookIds?.has(book.id)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>
    </section>
  );
}
