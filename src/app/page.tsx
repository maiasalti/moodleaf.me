"use client";

import { useEffect, useState, useCallback } from "react";
import { Book, SliderValues, TraitKey, BookWithScore } from "@/lib/types";
import { DEFAULT_SLIDER_VALUES, GENRES, categorizeBook } from "@/lib/constants";
import { rankBooks } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getSavedBookIds, saveBook, unsaveBook } from "@/lib/saved-books";
import Hero from "@/components/Hero";
import SliderPanel from "@/components/SliderPanel";
import GenreFilter from "@/components/GenreFilter";
import ResultsGrid from "@/components/ResultsGrid";
import AuthModal from "@/components/AuthModal";
import BookDetailModal from "@/components/BookDetailModal";
import SearchBar from "@/components/SearchBar";
import MoodPresets from "@/components/MoodPresets";
import Footer from "@/components/Footer";

const RESULTS_PER_PAGE = 10;

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
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);
  const [selectedBook, setSelectedBook] = useState<BookWithScore | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      setAllBooks(data as Book[]);
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
    (values: SliderValues, locked: Set<TraitKey>, genres: Set<string>, books: Book[], query: string) => {
      if (books.length === 0) return;

      let filtered = books;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        );
      }

      const ranked = rankBooks(filtered, values, locked, genres);
      setResults(ranked);
    },
    []
  );

  useEffect(() => {
    updateResults(sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery);
    setVisibleCount(RESULTS_PER_PAGE);
  }, [sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery, updateResults]);

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
    setSearchQuery("");
  };

  const handlePresetSelect = (values: SliderValues) => {
    setSliderValues(values);
    setLockedDimensions(new Set());
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

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + RESULTS_PER_PAGE);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 pb-4">
        <SearchBar onSearch={setSearchQuery} />
        <GenreFilter
          genres={[...GENRES]}
          selected={selectedGenres}
          onChange={setSelectedGenres}
        />
        <MoodPresets onSelect={handlePresetSelect} />
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
        visibleCount={visibleCount}
        savedBookIds={savedBookIds}
        onToggleSave={handleToggleSave}
        onShowMore={handleShowMore}
        onBookClick={setSelectedBook}
      />
      <Footer />
      {showAuthPrompt && <AuthModal onClose={() => setShowAuthPrompt(false)} />}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          saved={savedBookIds.has(selectedBook.id)}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
