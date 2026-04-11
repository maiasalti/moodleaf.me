import { supabase } from "./supabase";
import { Book, SliderValues, TraitKey, CommunityAggregate, UserReadBook } from "./types";
import { TRAIT_KEYS, COMMUNITY_RATING_PRIOR_WEIGHT } from "./constants";

// --- Read log ---

export async function getReadBookIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase
    .from("user_read_books")
    .select("book_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.book_id));
}

export async function logBookAsRead(userId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("user_read_books")
    .insert({ user_id: userId, book_id: bookId });
  return !error;
}

export async function unlogBook(userId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  // Also remove rating if exists
  await supabase
    .from("user_book_ratings")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  const { error } = await supabase
    .from("user_read_books")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  return !error;
}

// --- Ratings ---

export async function getUserRating(userId: string, bookId: string): Promise<SliderValues | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_book_ratings")
    .select("pacing, prose_density, characterization, emotional_impact, plot_complexity, humor, darkness, intellectual_challenge")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .single();
  return data as SliderValues | null;
}

export async function upsertRating(userId: string, bookId: string, values: SliderValues): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("user_book_ratings")
    .upsert(
      {
        user_id: userId,
        book_id: bookId,
        ...values,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" }
    );
  return !error;
}

// --- Aggregation ---

export async function getBookCommunityAggregates(
  bookIds: string[]
): Promise<Map<string, CommunityAggregate>> {
  const map = new Map<string, CommunityAggregate>();
  if (!supabase || bookIds.length === 0) return map;

  // Fetch all ratings — table is small (only authenticated users' ratings).
  // Avoiding .in() because 400+ book IDs would exceed URL length limits.
  const { data } = await supabase
    .from("user_book_ratings")
    .select("book_id, pacing, prose_density, characterization, emotional_impact, plot_complexity, humor, darkness, intellectual_challenge");

  if (!data || data.length === 0) return map;

  // Group by book_id and compute averages
  const grouped = new Map<string, SliderValues[]>();
  for (const row of data) {
    const ratings = grouped.get(row.book_id) || [];
    ratings.push({
      pacing: row.pacing,
      prose_density: row.prose_density,
      characterization: row.characterization,
      emotional_impact: row.emotional_impact,
      plot_complexity: row.plot_complexity,
      humor: row.humor,
      darkness: row.darkness,
      intellectual_challenge: row.intellectual_challenge,
    });
    grouped.set(row.book_id, ratings);
  }

  for (const [bookId, ratings] of grouped) {
    const means = {} as SliderValues;
    for (const key of TRAIT_KEYS) {
      means[key] = ratings.reduce((sum, r) => sum + r[key], 0) / ratings.length;
    }
    map.set(bookId, { means, count: ratings.length });
  }

  return map;
}

// --- Blending ---

export function blendTraits(
  book: Book,
  communityMean: SliderValues | null,
  communityCount: number
): Book {
  if (!communityMean || communityCount === 0) return book;

  const blended = { ...book };
  const w = COMMUNITY_RATING_PRIOR_WEIGHT;

  for (const key of TRAIT_KEYS) {
    blended[key] = (book[key] * w + communityMean[key] * communityCount) / (w + communityCount);
  }

  return blended;
}

// --- User read books with ratings (for Read tab) ---

export async function getUserReadBooksWithRatings(userId: string): Promise<UserReadBook[]> {
  if (!supabase) return [];

  const { data: readData } = await supabase
    .from("user_read_books")
    .select("book_id, created_at, books(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!readData || readData.length === 0) return [];

  const { data: ratingsData } = await supabase
    .from("user_book_ratings")
    .select("book_id, pacing, prose_density, characterization, emotional_impact, plot_complexity, humor, darkness, intellectual_challenge")
    .eq("user_id", userId);

  const ratingsMap = new Map<string, SliderValues>();
  for (const r of ratingsData ?? []) {
    ratingsMap.set(r.book_id, {
      pacing: r.pacing,
      prose_density: r.prose_density,
      characterization: r.characterization,
      emotional_impact: r.emotional_impact,
      plot_complexity: r.plot_complexity,
      humor: r.humor,
      darkness: r.darkness,
      intellectual_challenge: r.intellectual_challenge,
    });
  }

  return readData
    .filter((row: any) => row.books)
    .map((row: any) => ({
      book: row.books as Book,
      rating: ratingsMap.get(row.book_id) ?? null,
      readAt: row.created_at,
    }));
}
