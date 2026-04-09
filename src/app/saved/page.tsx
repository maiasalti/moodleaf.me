"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { unsaveBook } from "@/lib/saved-books";
import { getUserLists, deleteList, removeBookFromList } from "@/lib/reading-lists";
import { getUserReadBooksWithRatings } from "@/lib/community-ratings";
import { Book, BookWithScore, ReadingListWithBooks, UserReadBook } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";
import BookCard from "@/components/BookCard";
import Link from "next/link";

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<BookWithScore[]>([]);
  const [lists, setLists] = useState<ReadingListWithBooks[]>([]);
  const [readBooks, setReadBooks] = useState<UserReadBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "read">("saved");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const [savedResult, userLists, userReadBooks] = await Promise.all([
        supabase!
          .from("saved_books")
          .select("book_id, books(*)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        getUserLists(user!.id),
        getUserReadBooksWithRatings(user!.id),
      ]);

      if (savedResult.error) {
        console.error("Error fetching saved books:", savedResult.error);
      }

      const savedBooks = (savedResult.data ?? [])
        .map((row: any) => ({
          ...(row.books as Book),
          matchPercentage: 0,
        }))
        .filter(Boolean) as BookWithScore[];

      setBooks(savedBooks);
      setLists(userLists);
      setReadBooks(userReadBooks);
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading]);

  const handleRemove = async (bookId: string) => {
    if (!user) return;
    await unsaveBook(user.id, bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const handleRemoveFromList = async (listId: string, bookId: string) => {
    await removeBookFromList(listId, bookId);
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, books: l.books.filter((b) => b.id !== bookId) }
          : l
      )
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center px-6 pt-24">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
        <div className="mt-8 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-surface)]/60">
              <div className="aspect-[2/3] w-full rounded-t-2xl bg-stone-200" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-green-900">Saved books</h1>
        <p className="mt-3 text-stone-500">Sign in to see your saved books.</p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" className="font-serif text-xl font-bold text-green-900 transition-colors hover:text-green-700">
          Moodleaf
        </Link>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-16">
        <h1 className="text-center font-serif text-3xl font-bold text-green-900">
          Your library
        </h1>

        {/* Tab navigation */}
        <div className="mt-6 flex justify-center gap-6 border-b border-stone-200">
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "saved"
                ? "border-b-2 border-green-800 text-green-900"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Saved ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("read")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "read"
                ? "border-b-2 border-green-800 text-green-900"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Read ({readBooks.length})
          </button>
        </div>

        {/* Saved tab */}
        {activeTab === "saved" && (
          <>
            <p className="mt-6 text-center text-sm text-stone-400">
              {books.length === 0
                ? "You haven't saved any books yet. Go discover some!"
                : `${books.length} book${books.length === 1 ? "" : "s"} saved`}
            </p>

            {books.length === 0 ? (
              <div className="mt-10 text-center">
                <Link
                  href="/"
                  className="rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
                >
                  Discover books
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book, i) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={i}
                    saved={true}
                    onToggleSave={handleRemove}
                  />
                ))}
              </div>
            )}

            {/* Reading Lists */}
            {lists.length > 0 && (
              <div className="mt-16">
                <h2 className="text-center font-serif text-2xl font-semibold text-green-900">
                  Your reading lists
                </h2>
                <div className="mt-8 space-y-8">
                  {lists.map((list) => (
                    <div key={list.id}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-serif text-lg font-semibold text-green-900">
                          {list.name}
                          <span className="ml-2 text-sm font-normal text-stone-400">
                            ({list.books.length} book{list.books.length === 1 ? "" : "s"})
                          </span>
                        </h3>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          className="text-xs text-stone-400 transition-colors hover:text-red-500"
                        >
                          Delete list
                        </button>
                      </div>
                      {list.books.length === 0 ? (
                        <p className="text-sm text-stone-400">No books in this list yet.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {list.books.map((book, i) => (
                            <div key={book.id} className="group relative">
                              <BookCard
                                book={{ ...book, matchPercentage: 0, traitMatches: [] } as BookWithScore}
                                index={i}
                              />
                              <button
                                onClick={() => handleRemoveFromList(list.id, book.id)}
                                className="absolute top-2 right-2 hidden h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-red-600 group-hover:flex"
                                title="Remove from list"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Read tab */}
        {activeTab === "read" && (
          <>
            <p className="mt-6 text-center text-sm text-stone-400">
              {readBooks.length === 0
                ? "You haven't logged any books as read yet."
                : `${readBooks.length} book${readBooks.length === 1 ? "" : "s"} read`}
            </p>

            {readBooks.length === 0 ? (
              <div className="mt-10 text-center">
                <Link
                  href="/"
                  className="rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
                >
                  Find books to read
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {readBooks.map((entry) => (
                  <div
                    key={entry.book.id}
                    className="rounded-xl border border-stone-200 bg-[var(--color-surface)]/60 p-4 backdrop-blur-sm"
                  >
                    <div className="flex gap-4">
                      {/* Cover */}
                      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {entry.book.cover_image_url ? (
                          <img
                            src={entry.book.cover_image_url}
                            alt={entry.book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-100 to-stone-200 px-1">
                            <span className="text-center text-[8px] font-semibold text-green-900/60">
                              {entry.book.title}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-serif text-base font-semibold text-green-900">
                          {entry.book.title}
                        </h3>
                        <p className="text-sm text-stone-500">{entry.book.author}</p>
                        <p className="mt-1 text-xs text-stone-400">
                          Read {new Date(entry.readAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* User's ratings */}
                    {entry.rating ? (
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-stone-50 p-3 sm:grid-cols-4">
                        {SLIDER_DIMENSIONS.map((dim) => (
                          <div key={dim.key} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-stone-500">{dim.label}</span>
                            <span className="font-mono text-xs font-medium text-green-800">
                              {entry.rating![dim.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-stone-400 italic">
                        Not rated yet — open this book from the home page to add your ratings.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
