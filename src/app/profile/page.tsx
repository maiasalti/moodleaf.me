"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Book, SliderValues, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS, categorizeBook, averageTraits } from "@/lib/constants";
import RadarChart from "@/components/RadarChart";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchSaved() {
      const { data, error } = await supabase!
        .from("saved_books")
        .select("book_id, books(*)")
        .eq("user_id", user!.id);

      if (error) {
        console.error("Error fetching saved books:", error);
        setLoading(false);
        return;
      }

      const books = (data ?? [])
        .map((row: any) => row.books as Book)
        .filter(Boolean);
      setSavedBooks(books);
      setLoading(false);
    }

    fetchSaved();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center px-6 pt-24">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-green-900">My Taste Profile</h1>
        <p className="mt-3 text-stone-500">Sign in to see your taste profile.</p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (savedBooks.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 pt-6 md:px-10">
          <Link href="/" className="font-serif text-xl font-bold text-green-900 transition-colors hover:text-green-700">
            Moodleaf
          </Link>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-green-900">My Taste Profile</h1>
          <p className="mt-3 text-stone-500">
            Save some books first to build your taste profile.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
          >
            Discover books
          </Link>
        </div>
      </div>
    );
  }

  const averaged = averageTraits(savedBooks);

  // Top genres
  const genreCounts: Record<string, number> = {};
  savedBooks.forEach((b) => {
    const g = categorizeBook(b.categories);
    if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Trait tendencies
  const tendencies = SLIDER_DIMENSIONS.map((dim) => {
    const val = averaged[dim.key as TraitKey];
    const direction = val >= 7 ? "high" : val <= 4 ? "low" : null;
    return {
      ...dim,
      value: val,
      direction,
      tendency: direction === "high" ? dim.highLabel : direction === "low" ? dim.lowLabel : null,
    };
  }).filter((t) => t.tendency);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" className="font-serif text-xl font-bold text-green-900 transition-colors hover:text-green-700">
          Moodleaf
        </Link>
      </header>

      <section className="mx-auto w-full max-w-2xl px-6 pt-12 pb-16">
        <h1 className="text-center font-serif text-3xl font-bold text-green-900">
          My Taste Profile
        </h1>
        <p className="mt-2 text-center text-sm text-stone-400">
          Based on your {savedBooks.length} saved book{savedBooks.length === 1 ? "" : "s"}
        </p>

        {/* Radar Chart */}
        <div className="mt-10">
          <RadarChart values={averaged} />
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm text-stone-400">Books saved</p>
            <p className="mt-1 font-serif text-2xl font-bold text-green-900">
              {savedBooks.length}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm text-stone-400">Top genre</p>
            <p className="mt-1 font-serif text-2xl font-bold text-green-900">
              {topGenres.length > 0 ? topGenres[0][0] : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm text-stone-400">Genres explored</p>
            <p className="mt-1 font-serif text-2xl font-bold text-green-900">
              {Object.keys(genreCounts).length}
            </p>
          </div>
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div className="mt-8">
            <h3 className="font-serif text-lg font-semibold text-green-900">
              Your top genres
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {topGenres.map(([genre, count]) => (
                <span
                  key={genre}
                  className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800"
                >
                  {genre} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trait tendencies */}
        {tendencies.length > 0 && (
          <div className="mt-8">
            <h3 className="font-serif text-lg font-semibold text-green-900">
              You tend toward...
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {tendencies.map((t) => (
                <div
                  key={t.key}
                  className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 shadow-sm"
                >
                  <span className="text-sm font-medium text-green-900">
                    {t.label}:
                  </span>
                  <span className="text-sm text-stone-600">{t.tendency}</span>
                  <span className="ml-auto font-mono text-sm text-stone-400">
                    {t.value}/10
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
