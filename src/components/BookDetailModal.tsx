"use client";

import { useState } from "react";
import { BookWithScore, SliderValues, ReadingListWithBooks } from "@/lib/types";
import { SLIDER_DIMENSIONS, categorizeBook, extractTraitValues } from "@/lib/constants";
import MatchBadge from "./MatchBadge";
import AddToListDropdown from "./AddToListDropdown";
import TraitRatingForm from "./TraitRatingForm";

interface BookDetailModalProps {
  book: BookWithScore;
  saved?: boolean;
  isRead?: boolean;
  userRating?: SliderValues | null;
  communityCount?: number;
  onToggleSave?: (bookId: string) => void;
  onToggleRead?: (bookId: string) => void;
  onSubmitRating?: (bookId: string, values: SliderValues) => void;
  onClose: () => void;
  onMoreLikeThis?: (values: SliderValues) => void;
  readingLists?: ReadingListWithBooks[];
  onAddToList?: (listId: string, bookId: string) => void;
  onRemoveFromList?: (listId: string, bookId: string) => void;
  onCreateList?: (name: string) => void;
}

function toPercent(value: number) {
  return ((value - 1) / 9) * 100;
}

function TraitBar({ label, bookValue, userValue }: { label: string; bookValue: number; userValue: number }) {
  const diff = Math.abs(bookValue - userValue);
  const color = diff <= 1.5 ? "bg-green-700" : diff <= 3 ? "bg-amber-500" : "bg-stone-400";

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-right text-sm text-stone-500">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-stone-200">
        <div
          className={`absolute top-0 left-0 h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${toPercent(bookValue)}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-900 shadow-sm"
          style={{ left: `${toPercent(userValue)}%` }}
          title={`Your preference: ${userValue}`}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-sm text-stone-600">{bookValue}</span>
    </div>
  );
}

export default function BookDetailModal({
  book,
  saved,
  isRead,
  userRating,
  communityCount,
  onToggleSave,
  onToggleRead,
  onSubmitRating,
  onClose,
  onMoreLikeThis,
  readingLists,
  onAddToList,
  onRemoveFromList,
  onCreateList,
}: BookDetailModalProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submittedRating, setSubmittedRating] = useState<SliderValues | null>(userRating ?? null);
  const genre = categorizeBook(book.categories);

  const handleShare = async () => {
    const text = `Moodleaf matched me ${book.matchPercentage}% with "${book.title}" by ${book.author}`;
    const url = typeof window !== "undefined" ? window.location.origin : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Moodleaf", text, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      const btn = document.getElementById("share-feedback");
      if (btn) {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Share"; }, 2000);
      }
    }
  };

  const handleMoreLikeThis = () => {
    if (!onMoreLikeThis) return;
    const traits = extractTraitValues(book);
    onMoreLikeThis(traits);
    onClose();
  };

  // Sort traits: best matches first
  const sortedTraits = [...(book.traitMatches || [])].sort((a, b) => a.difference - b.difference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)]/80 text-stone-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface)] hover:text-stone-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-stone-100 sm:w-48 sm:rounded-tl-2xl">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={`Cover of ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-100 to-stone-200 px-6">
                <span className="text-center font-serif text-xl font-semibold leading-tight text-green-900/70">
                  {book.title}
                </span>
                <span className="text-center text-sm text-green-900/40">{book.author}</span>
              </div>
            )}
          </div>

          {/* Header info */}
          <div className="flex flex-1 flex-col gap-3 p-6">
            <MatchBadge percentage={book.matchPercentage} />
            <h2 className="font-serif text-2xl font-semibold leading-snug text-green-900">{book.title}</h2>
            <p className="text-sm text-stone-500">{book.author}</p>

            <div className="flex flex-wrap gap-2">
              {genre && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  {genre}
                </span>
              )}
              {book.page_count && (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                  {book.page_count} pages
                </span>
              )}
              {book.average_rating && (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                  {book.average_rating.toFixed(1)} rating
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {onToggleSave && (
                <button
                  onClick={() => onToggleSave(book.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    saved
                      ? "bg-green-800 text-white hover:bg-green-900"
                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                  }`}
                >
                  {saved ? "Saved" : "Save"}
                </button>
              )}
              {onToggleRead && (
                <button
                  onClick={() => onToggleRead(book.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isRead
                      ? "bg-green-700 text-white hover:bg-green-800"
                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                  }`}
                >
                  {isRead ? "Read" : "Mark as read"}
                </button>
              )}
              <button
                id="share-feedback"
                onClick={handleShare}
                className="rounded-full bg-stone-200 px-4 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-300"
              >
                Share
              </button>
              {onMoreLikeThis && (
                <button
                  onClick={handleMoreLikeThis}
                  className="rounded-full bg-terracotta/10 px-4 py-1.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/20"
                >
                  More like this
                </button>
              )}
              {readingLists && onAddToList && onRemoveFromList && onCreateList && (
                <AddToListDropdown
                  bookId={book.id}
                  lists={readingLists}
                  onAddToList={onAddToList}
                  onRemoveFromList={onRemoveFromList}
                  onCreateList={onCreateList}
                />
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-stone-200 px-6 py-5">
          <p className="text-sm leading-relaxed text-stone-600">
            {book.description || "No description available."}
          </p>
        </div>

        {/* Trait bars */}
        <div className="border-t border-stone-200 px-6 py-5">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-green-900">Trait profile</h3>
            {(communityCount ?? 0) > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                {communityCount} community rating{communityCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {sortedTraits.map((trait) => (
              <TraitBar
                key={trait.key}
                label={trait.label}
                bookValue={trait.bookValue}
                userValue={trait.userValue}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400">
            Bar = book score. Dot = your preference. Green = close match.
          </p>
        </div>

        {/* Rating section — only visible when book is marked as read */}
        {isRead && onSubmitRating && (
          <div className="border-t border-stone-200 px-6 py-5">
            {!showRatingForm && !submittedRating ? (
              <button
                onClick={() => setShowRatingForm(true)}
                className="w-full rounded-lg border border-dashed border-green-700/40 px-4 py-3 text-sm font-medium text-green-800 transition-colors hover:bg-green-50"
              >
                Rate this book&apos;s traits
              </button>
            ) : showRatingForm ? (
              <>
                <h3 className="mb-4 font-serif text-lg font-semibold text-green-900">
                  {submittedRating ? "Update your rating" : "Rate this book"}
                </h3>
                <TraitRatingForm
                  initialValues={submittedRating ?? extractTraitValues(book)}
                  isUpdate={!!submittedRating}
                  onSubmit={(values) => {
                    onSubmitRating(book.id, values);
                    setSubmittedRating(values);
                    setShowRatingForm(false);
                  }}
                />
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold text-green-900">Your rating</h3>
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="text-xs text-green-700 hover:text-green-900"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {SLIDER_DIMENSIONS.map((dim) => (
                    <div key={dim.key} className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">{dim.label}</span>
                      <span className="font-mono text-xs font-medium text-stone-600">
                        {submittedRating![dim.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
