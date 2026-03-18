"use client";

import { useEffect, useState, useCallback } from "react";
import { Book, SliderValues, TraitKey, BookWithScore } from "@/lib/types";
import { DEFAULT_SLIDER_VALUES } from "@/lib/constants";
import { rankBooks } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getSavedBookIds, saveBook, unsaveBook } from "@/lib/saved-books";
import Hero from "@/components/Hero";
import SliderPanel from "@/components/SliderPanel";
import GenreFilter from "@/components/GenreFilter";
import ResultsGrid from "@/components/ResultsGrid";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

export default function Home() {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [results, setResults] = useState<BookWithScore[]>([]);
  const [sliderValues, setSliderValues] =
    useState<SliderValues>(DEFAULT_SLIDER_VALUES);
  const [lockedDimensions, setLockedDimensions] = useState<Set<TraitKey>>(
    new Set()
  );
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      if (!supabase) {
        console.warn("Supabase not configured — no books loaded.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from("books").select("*");
      if (error) {
        console.error("Error fetching books:", error);
        setLoading(false);
        return;
      }
      const books = data as Book[];
      setAllBooks(books);
      const genres = Array.from(
        new Set(books.flatMap((b) => b.categories ?? []))
      ).sort();
      setAllGenres(genres);
      setLoading(false);
    }
    fetchBooks();
  }, []);

  useEffect(() => {
    if (user) {
      getSavedBookIds(user.id).then(setSavedBookIds);
    } else {
      setSavedBookIds(new Set());
    }
  }, [user]);

  const updateResults = useCallback(
    (values: SliderValues, locked: Set<TraitKey>, genres: Set<string>, books: Book[]) => {
      if (books.length === 0) return;
      const ranked = rankBooks(books, values, locked, genres, 10);
      setResults(ranked);
    },
    []
  );

  useEffect(() => {
    updateResults(sliderValues, lockedDimensions, selectedGenres, allBooks);
  }, [sliderValues, lockedDimensions, selectedGenres, allBooks, updateResults]);

  const handleSliderChange = (key: TraitKey, value: number) => {
    setSliderValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleLock = (key: TraitKey) => {
    setLockedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleReset = () => {
    setSliderValues(DEFAULT_SLIDER_VALUES);
    setLockedDimensions(new Set());
    setSelectedGenres(new Set());
  };

  const handleToggleSave = async (bookId: string) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    const isSaved = savedBookIds.has(bookId);
    if (isSaved) {
      await unsaveBook(user.id, bookId);
      setSavedBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    } else {
      await saveBook(user.id, bookId);
      setSavedBookIds((prev) => new Set(prev).add(bookId));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <div className="mx-auto w-full max-w-2xl px-6 pb-4">
        <GenreFilter
          genres={allGenres}
          selected={selectedGenres}
          onChange={setSelectedGenres}
        />
      </div>
      <SliderPanel
        values={sliderValues}
        lockedDimensions={lockedDimensions}
        onChange={handleSliderChange}
        onToggleLock={handleToggleLock}
        onReset={handleReset}
      />
      <ResultsGrid
        books={results}
        loading={loading}
        savedBookIds={savedBookIds}
        onToggleSave={handleToggleSave}
      />
      <Footer />
      {showAuthPrompt && <AuthModal onClose={() => setShowAuthPrompt(false)} />}
    </div>
  );
}
