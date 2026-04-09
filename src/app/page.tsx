"use client";

import { useEffect, useState, useCallback } from "react";
import { Book, SliderValues, TraitKey, BookWithScore, ReadingListWithBooks, CommunityAggregate } from "@/lib/types";
import { DEFAULT_SLIDER_VALUES, GENRES, categorizeBook, PAGE_COUNT_RANGES, extractTraitValues } from "@/lib/constants";
import { ONBOARDING_TITLES } from "@/lib/onboarding-books";
import { rankBooks } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getSavedBookIds, saveBook, unsaveBook } from "@/lib/saved-books";
import { getUserLists, createList, addBookToList, removeBookFromList } from "@/lib/reading-lists";
import { getReadBookIds, logBookAsRead, unlogBook, getBookCommunityAggregates, blendTraits, getUserRating, upsertRating } from "@/lib/community-ratings";
import { useAnimatedSliders } from "@/lib/use-animated-sliders";
import { useHiddenBooks } from "@/lib/use-hidden-books";
import { useSavedMoods } from "@/lib/use-saved-moods";
import Hero from "@/components/Hero";
import SliderPanel from "@/components/SliderPanel";
import GenreFilter from "@/components/GenreFilter";
import PageCountFilter from "@/components/PageCountFilter";
import ResultsGrid from "@/components/ResultsGrid";
import AuthModal from "@/components/AuthModal";
import BookDetailModal from "@/components/BookDetailModal";
import SearchBar from "@/components/SearchBar";
import MoodPresets from "@/components/MoodPresets";
import SaveMoodButton from "@/components/SaveMoodButton";
import BookSearchSelect from "@/components/BookSearchSelect";
import OnboardingModal from "@/components/OnboardingModal";
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
  const [selectedPageRanges, setSelectedPageRanges] = useState<Set<string>>(new Set());
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);
  const [selectedBook, setSelectedBook] = useState<BookWithScore | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Animated sliders
  const { setSliderValuesAnimated } = useAnimatedSliders(sliderValues, setSliderValues);

  // Hidden books
  const { hiddenIds, hideBook } = useHiddenBooks();
  const [showHidden, setShowHidden] = useState(false);

  // Saved moods
  const { savedMoods, saveMood, deleteMood } = useSavedMoods();

  // Book search select ("I just finished X")
  const [showBookSearch, setShowBookSearch] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingBooks, setOnboardingBooks] = useState<Book[]>([]);

  // Reading lists
  const [readingLists, setReadingLists] = useState<ReadingListWithBooks[]>([]);

  // Community ratings
  const [readBookIds, setReadBookIds] = useState<Set<string>>(new Set());
  const [communityAggregates, setCommunityAggregates] = useState<Map<string, CommunityAggregate>>(new Map());
  const [selectedBookRating, setSelectedBookRating] = useState<SliderValues | null>(null);

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

      // Fetch community aggregates and blend
      const aggregates = await getBookCommunityAggregates(books.map((b) => b.id));
      setCommunityAggregates(aggregates);
      const blendedBooks = books.map((book) => {
        const agg = aggregates.get(book.id);
        return agg ? blendTraits(book, agg.means, agg.count) : book;
      });

      setAllBooks(blendedBooks);
      setLoading(false);

      // Onboarding: check if first visit
      if (!localStorage.getItem("moodleaf-onboarded")) {
        const titleSet = new Set(ONBOARDING_TITLES.map((t) => t.toLowerCase()));
        const matched = books.filter((b) => titleSet.has(b.title.toLowerCase()));
        if (matched.length >= 3) {
          setOnboardingBooks(matched);
          setShowOnboarding(true);
        }
      }
    }
    fetchBooks();
  }, []);

  useEffect(() => {
    if (user) {
      getSavedBookIds(user.id).then(setSavedBookIds);
      getUserLists(user.id).then(setReadingLists);
      getReadBookIds(user.id).then(setReadBookIds);
    } else {
      setSavedBookIds(new Set());
      setReadingLists([]);
      setReadBookIds(new Set());
    }
  }, [user]);

  const updateResults = useCallback(
    (values: SliderValues, locked: Set<TraitKey>, genres: Set<string>, books: Book[], query: string, pageRanges: Set<string>) => {
      if (books.length === 0) return;

      let filtered = books;

      // Search filter
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        );
      }

      // Page count filter
      if (pageRanges.size > 0) {
        const ranges = PAGE_COUNT_RANGES.filter((r) => pageRanges.has(r.key));
        filtered = filtered.filter((b) => {
          if (!b.page_count) return false;
          return ranges.some((r) => b.page_count! >= r.min && b.page_count! <= r.max);
        });
      }

      const ranked = rankBooks(filtered, values, locked, genres);
      setResults(ranked);
    },
    []
  );

  useEffect(() => {
    updateResults(sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery, selectedPageRanges);
    setVisibleCount(RESULTS_PER_PAGE);
  }, [sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery, selectedPageRanges, updateResults]);

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
    setSelectedPageRanges(new Set());
    setSearchQuery("");
  };

  const handlePresetSelect = (values: SliderValues) => {
    setSliderValuesAnimated(values);
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

  // More like this
  const handleMoreLikeThis = (values: SliderValues) => {
    setSliderValuesAnimated(values);
    setLockedDimensions(new Set());
    setSelectedGenres(new Set());
  };

  // "I just finished X"
  const handleBookSearchSelect = (book: Book) => {
    const traits = extractTraitValues(book);
    setSliderValuesAnimated(traits);
    setShowBookSearch(false);
  };

  // Onboarding
  const handleOnboardingComplete = (values: SliderValues) => {
    setSliderValuesAnimated(values);
    localStorage.setItem("moodleaf-onboarded", "true");
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem("moodleaf-onboarded", "true");
    setShowOnboarding(false);
  };

  // Read toggle
  const handleToggleRead = async (bookId: string) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    const isRead = readBookIds.has(bookId);
    if (isRead) {
      await unlogBook(user.id, bookId);
      setReadBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
      setSelectedBookRating(null);
    } else {
      await logBookAsRead(user.id, bookId);
      setReadBookIds((prev) => new Set(prev).add(bookId));
    }
  };

  // Rating submit
  const handleSubmitRating = async (bookId: string, values: SliderValues) => {
    if (!user) return;
    await upsertRating(user.id, bookId, values);
    setSelectedBookRating(values);
  };

  // Reading lists handlers
  const handleAddToList = async (listId: string, bookId: string) => {
    const success = await addBookToList(listId, bookId);
    if (success) {
      // Refetch lists to get updated book data
      if (user) getUserLists(user.id).then(setReadingLists);
    }
  };

  const handleRemoveFromList = async (listId: string, bookId: string) => {
    const success = await removeBookFromList(listId, bookId);
    if (success) {
      setReadingLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, books: l.books.filter((b) => b.id !== bookId) }
            : l
        )
      );
    }
  };

  const handleCreateList = async (name: string) => {
    if (!user) return;
    const list = await createList(user.id, name);
    if (list) {
      setReadingLists((prev) => [{ ...list, books: [] }, ...prev]);
    }
  };

  // Filter hidden books from display
  const displayResults = showHidden
    ? results
    : results.filter((b) => !hiddenIds.has(b.id));
  const hiddenCount = results.length - results.filter((b) => !hiddenIds.has(b.id)).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 pb-4">
        <SearchBar onSearch={setSearchQuery} />
        <div className="flex flex-wrap items-center gap-3">
          <GenreFilter
            genres={[...GENRES]}
            selected={selectedGenres}
            onChange={setSelectedGenres}
          />
          <PageCountFilter
            selected={selectedPageRanges}
            onChange={setSelectedPageRanges}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MoodPresets
            onSelect={handlePresetSelect}
            savedMoods={savedMoods}
            onDeleteMood={deleteMood}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SaveMoodButton values={sliderValues} onSave={saveMood} />
          {!showBookSearch ? (
            <button
              onClick={() => setShowBookSearch(true)}
              className="rounded-full border border-stone-200 bg-[var(--color-surface)]/70 px-4 py-2 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-green-700 hover:bg-green-50 hover:text-green-800"
            >
              Match a book
            </button>
          ) : (
            <div className="w-full max-w-md">
              <BookSearchSelect
                books={allBooks}
                onSelect={handleBookSearchSelect}
                onClose={() => setShowBookSearch(false)}
              />
            </div>
          )}
        </div>
      </div>
      <SliderPanel
        values={sliderValues}
        lockedDimensions={lockedDimensions}
        onChange={handleSliderChange}
        onToggleLock={handleToggleLock}
        onReset={handleReset}
      />
      <ResultsGrid
        books={displayResults}
        loading={loading}
        visibleCount={visibleCount}
        savedBookIds={savedBookIds}
        hiddenCount={hiddenCount}
        showHidden={showHidden}
        onToggleSave={handleToggleSave}
        onHide={hideBook}
        onToggleShowHidden={() => setShowHidden((prev) => !prev)}
        onShowMore={handleShowMore}
        onBookClick={async (book) => {
          setSelectedBook(book);
          setSelectedBookRating(null);
          if (user && readBookIds.has(book.id)) {
            const rating = await getUserRating(user.id, book.id);
            setSelectedBookRating(rating);
          }
        }}
      />
      <Footer />
      {showAuthPrompt && <AuthModal onClose={() => setShowAuthPrompt(false)} />}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          saved={savedBookIds.has(selectedBook.id)}
          isRead={readBookIds.has(selectedBook.id)}
          userRating={selectedBookRating}
          communityCount={communityAggregates.get(selectedBook.id)?.count ?? 0}
          onToggleSave={handleToggleSave}
          onToggleRead={handleToggleRead}
          onSubmitRating={handleSubmitRating}
          onClose={() => { setSelectedBook(null); setSelectedBookRating(null); }}
          onMoreLikeThis={handleMoreLikeThis}
          readingLists={user ? readingLists : undefined}
          onAddToList={user ? handleAddToList : undefined}
          onRemoveFromList={user ? handleRemoveFromList : undefined}
          onCreateList={user ? handleCreateList : undefined}
        />
      )}
      {showOnboarding && onboardingBooks.length >= 3 && (
        <OnboardingModal
          books={onboardingBooks}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
