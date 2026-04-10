"use client";

import { SliderValues } from "@/lib/types";
import { extractTraitValues } from "@/lib/constants";
import type { BookWithScore } from "@/lib/types";
import TraitRatingForm from "./TraitRatingForm";

interface RatingModalProps {
  book: BookWithScore;
  userRating: SliderValues | null;
  onSubmit: (bookId: string, values: SliderValues) => void;
  onClose: () => void;
}

export default function RatingModal({
  book,
  userRating,
  onSubmit,
  onClose,
}: RatingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)]/80 text-stone-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface)] hover:text-stone-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Book header */}
        <div className="mb-5 flex items-center gap-3 pr-8">
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-100 to-stone-200 px-1">
                <span className="text-center text-[6px] font-semibold text-green-900/60">
                  {book.title}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold leading-snug text-green-900">
              {book.title}
            </h2>
            <p className="text-sm text-stone-500">{book.author}</p>
          </div>
        </div>

        <h3 className="mb-4 text-sm font-medium text-green-800">
          How would you rate this book?
        </h3>

        <TraitRatingForm
          initialValues={userRating ?? extractTraitValues(book)}
          isUpdate={!!userRating}
          onSubmit={(values) => {
            onSubmit(book.id, values);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
