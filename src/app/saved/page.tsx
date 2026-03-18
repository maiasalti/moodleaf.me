"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { unsaveBook } from "@/lib/saved-books";
import { Book, BookWithScore } from "@/lib/types";
import BookCard from "@/components/BookCard";
import Link from "next/link";

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<BookWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchSavedBooks() {
      const { data, error } = await supabase!
        .from("saved_books")
        .select("book_id, books(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved books:", error);
        setLoading(false);
        return;
      }

      const savedBooks = (data ?? [])
        .map((row: any) => ({
          ...(row.books as Book),
          matchPercentage: 0,
        }))
        .filter(Boolean) as BookWithScore[];

      setBooks(savedBooks);
      setLoading(false);
    }

    fetchSavedBooks();
  }, [user, authLoading]);

  const handleRemove = async (bookId: string) => {
    if (!user) return;
    await unsaveBook(user.id, bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center px-6 pt-24">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
        <div className="mt-8 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white/60">
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
          Your saved books
        </h1>
        <p className="mt-2 text-center text-sm text-stone-400">
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </section>
    </div>
  );
}
