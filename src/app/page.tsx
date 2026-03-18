"use client";

import { useEffect, useState, useCallback } from "react";
import { Book, SliderValues, TraitKey, BookWithScore } from "@/lib/types";
import { DEFAULT_SLIDER_VALUES } from "@/lib/constants";
import { rankBooks } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import Hero from "@/components/Hero";
import SliderPanel from "@/components/SliderPanel";
import ResultsGrid from "@/components/ResultsGrid";
import Footer from "@/components/Footer";

export default function Home() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [results, setResults] = useState<BookWithScore[]>([]);
  const [sliderValues, setSliderValues] =
    useState<SliderValues>(DEFAULT_SLIDER_VALUES);
  const [lockedDimensions, setLockedDimensions] = useState<Set<TraitKey>>(
    new Set()
  );
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
      setAllBooks(data as Book[]);
      setLoading(false);
    }
    fetchBooks();
  }, []);

  const updateResults = useCallback(
    (values: SliderValues, locked: Set<TraitKey>, books: Book[]) => {
      if (books.length === 0) return;
      const ranked = rankBooks(books, values, locked, 10);
      setResults(ranked);
    },
    []
  );

  useEffect(() => {
    updateResults(sliderValues, lockedDimensions, allBooks);
  }, [sliderValues, lockedDimensions, allBooks, updateResults]);

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
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <SliderPanel
        values={sliderValues}
        lockedDimensions={lockedDimensions}
        onChange={handleSliderChange}
        onToggleLock={handleToggleLock}
        onReset={handleReset}
      />
      <ResultsGrid books={results} loading={loading} />
      <Footer />
    </div>
  );
}
