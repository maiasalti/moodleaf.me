"use client";

import { useEffect, useState, useCallback } from "react";
import { Book, SliderValues, TraitKey, BookWithScore, ReadingListWithBooks, CommunityAggregate } from "@/lib/types";
import { DEFAULT_SLIDER_VALUES, GENRES, categorizeBook, PAGE_COUNT_RANGES, extractTraitValues, TRAIT_KEYS, OPTIONAL_TRAIT_KEYS } from "@/lib/constants";
import { rankBooks } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getSavedBookIds, saveBook, unsaveBook } from "@/lib/saved-books";
import { getUserLists, createList, addBookToList, removeBookFromList } from "@/lib/reading-lists";
import { getReadBookIds, logBookAsRead, unlogBook, getBookCommunityAggregates, blendTraits, getUserRating, upsertRating } from "@/lib/community-ratings";
import { useAnimatedSliders } from "@/lib/use-animated-sliders";
import Hero from "@/components/Hero";
import SliderPanel from "@/components/SliderPanel";
import GenreFilter from "@/components/GenreFilter";
import PageCountFilter from "@/components/PageCountFilter";
import ResultsGrid from "@/components/ResultsGrid";
import AuthModal from "@/components/AuthModal";
import BookDetailModal from "@/components/BookDetailModal";
import RatingModal from "@/components/RatingModal";
import SearchBar from "@/components/SearchBar";
import BookSearchSelect from "@/components/BookSearchSelect";
import Footer from "@/components/Footer";

const RESULTS_PER_PAGE = 12;

const BOOK_LIST_COLUMNS =
  "id, title, author, cover_image_url, page_count, average_rating, isbn, categories, pacing, prose_density, characterization, emotional_impact, plot_complexity, humor, darkness, intellectual_challenge";

export default function Home() {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [results, setResults] = useState<BookWithScore[]>([]);
  const [sliderValues, setSliderValues] =
    useState<SliderValues>(DEFAULT_SLIDER_VALUES);
  const [lockedDimensions, setLockedDimensions] = useState<Set<TraitKey>>(
    new Set()
  );
  // Traits not counted in matching. All 8 cards stay visible; the optional five start excluded.
  const [dismissedTraits, setDismissedTraits] = useState<Set<TraitKey>>(() => new Set(OPTIONAL_TRAIT_KEYS));
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

  // Book search select ("I just finished X")
  const [showBookSearch, setShowBookSearch] = useState(false);

  // Reading lists
  const [readingLists, setReadingLists] = useState<ReadingListWithBooks[]>([]);

  // Community ratings
  const [readBookIds, setReadBookIds] = useState<Set<string>>(new Set());
  const [communityAggregates, setCommunityAggregates] = useState<Map<string, CommunityAggregate>>(new Map());
  const [selectedBookRating, setSelectedBookRating] = useState<SliderValues | null>(null);
  const [ratingModalBook, setRatingModalBook] = useState<BookWithScore | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      if (!supabase) {
        console.warn("Supabase not configured — no books loaded.");
        setLoading(false);
        return;
      }
      // Supabase caps each response at 1000 rows, so page through the table in parallel.
      // Descriptions are left out (they're most of the payload) and fetched when a book is opened.
      const client = supabase;
      const { count, error: countError } = await client
        .from("books")
        .select("id", { count: "exact", head: true });
      if (countError || count == null) {
        console.error("Error counting books:", countError);
        setLoading(false);
        return;
      }
      const PAGE_SIZE = 1000;
      const pages = await Promise.all(
        Array.from({ length: Math.ceil(count / PAGE_SIZE) }, (_, i) =>
          client
            .from("books")
            .select(BOOK_LIST_COLUMNS)
            .order("id")
            .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
        )
      );
      const failed = pages.find((p) => p.error);
      if (failed) {
        console.error("Error fetching books:", failed.error);
        setLoading(false);
        return;
      }
      const books = pages.flatMap((p) => p.data ?? []).map((b) => ({ ...b, description: null })) as Book[];

      // Fetch community aggregates and blend
      const aggregates = await getBookCommunityAggregates(books.map((b) => b.id));
      setCommunityAggregates(aggregates);
      const blendedBooks = books.map((book) => {
        const agg = aggregates.get(book.id);
        return agg ? blendTraits(book, agg.means, agg.count) : book;
      });

      setAllBooks(blendedBooks);
      setLoading(false);
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

  const activeTraits: TraitKey[] = TRAIT_KEYS.filter((k) => !dismissedTraits.has(k));

  const updateResults = useCallback(
    (values: SliderValues, locked: Set<TraitKey>, genres: Set<string>, books: Book[], query: string, pageRanges: Set<string>, traits: TraitKey[]) => {
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

      const ranked = rankBooks(filtered, values, locked, genres, undefined, traits);
      setResults(ranked);
    },
    []
  );

  useEffect(() => {
    updateResults(sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery, selectedPageRanges, activeTraits);
    setVisibleCount(RESULTS_PER_PAGE);
  }, [sliderValues, lockedDimensions, selectedGenres, allBooks, searchQuery, selectedPageRanges, dismissedTraits, updateResults]);

  const includeTrait = (key: TraitKey) =>
    setDismissedTraits((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const handleSliderChange = (key: TraitKey, value: number) => {
    setSliderValues((prev) => ({ ...prev, [key]: value }));
    // Moving an excluded slider means the reader cares about it, so count it
    includeTrait(key);
  };

  const handleToggleLock = (key: TraitKey) => {
    includeTrait(key);
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
    setDismissedTraits(new Set(OPTIONAL_TRAIT_KEYS));
  };

  const handleToggleTrait = (key: TraitKey) => {
    if (!dismissedTraits.has(key)) {
      // An excluded trait can't be a must-match
      setLockedDimensions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    setDismissedTraits((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
      // Open the rating popup
      const book = results.find((b) => b.id === bookId);
      if (book) {
        setRatingModalBook(book);
      }
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

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <div className="mx-auto w-full max-w-6xl space-y-3 px-6 pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="md:flex-1">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>
      <SliderPanel
        values={sliderValues}
        lockedDimensions={lockedDimensions}
        dismissedTraits={dismissedTraits}
        onChange={handleSliderChange}
        onToggleLock={handleToggleLock}
        onToggleTrait={handleToggleTrait}
        onReset={handleReset}
        onMatchBook={() => setShowBookSearch(true)}
      />
      {showBookSearch && (
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6 pt-3">
          <div className="w-full max-w-md">
            <BookSearchSelect
              books={allBooks}
              onSelect={handleBookSearchSelect}
              onClose={() => setShowBookSearch(false)}
            />
          </div>
        </div>
      )}
      <ResultsGrid
        books={results}
        loading={loading}
        visibleCount={visibleCount}
        savedBookIds={savedBookIds}
        readBookIds={readBookIds}
        onToggleSave={handleToggleSave}
        onToggleRead={handleToggleRead}
        onShowMore={handleShowMore}
        onBookClick={async (book) => {
          setSelectedBook(book);
          setSelectedBookRating(null);
          if (book.description == null && supabase) {
            supabase
              .from("books")
              .select("description")
              .eq("id", book.id)
              .maybeSingle()
              .then(({ data }) => {
                const description = data?.description ?? "";
                setSelectedBook((cur) => (cur?.id === book.id ? { ...cur, description } : cur));
                setAllBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, description } : b)));
              });
          }
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
      {ratingModalBook && (
        <RatingModal
          book={ratingModalBook}
          userRating={null}
          onSubmit={handleSubmitRating}
          onClose={() => setRatingModalBook(null)}
        />
      )}
    </div>
  );
}
