import { Book, BookWithScore, SliderValues, TraitKey, TraitMatch } from "./types";
import { TRAIT_KEYS, SLIDER_DIMENSIONS, categorizeBook } from "./constants";

const LOCK_TOLERANCE = 1.5; // locked dimensions must be within ±1.5

function passesLockFilter(
  book: Book,
  userValues: SliderValues,
  lockedDimensions?: Set<TraitKey>
): boolean {
  if (!lockedDimensions || lockedDimensions.size === 0) return true;
  for (const key of lockedDimensions) {
    if (Math.abs(userValues[key] - book[key]) > LOCK_TOLERANCE) return false;
  }
  return true;
}

function euclideanDistance(
  userValues: SliderValues,
  book: Book
): number {
  let sum = 0;
  for (const key of TRAIT_KEYS) {
    const diff = userValues[key] - book[key];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function getTraitMatches(userValues: SliderValues, book: Book): TraitMatch[] {
  return SLIDER_DIMENSIONS.map((dim) => ({
    key: dim.key,
    label: dim.label,
    bookValue: book[dim.key],
    userValue: userValues[dim.key],
    difference: Math.abs(userValues[dim.key] - book[dim.key]),
  }));
}

const MAX_DISTANCE = Math.sqrt(TRAIT_KEYS.length * 9 * 9);

export function rankBooks(
  books: Book[],
  userValues: SliderValues,
  lockedDimensions?: Set<TraitKey>,
  selectedGenres?: Set<string>,
  limit?: number
): BookWithScore[] {
  const eligible = books.filter((book) => {
    if (!passesLockFilter(book, userValues, lockedDimensions)) return false;
    if (selectedGenres && selectedGenres.size > 0) {
      const bookGenre = categorizeBook(book.categories);
      if (!bookGenre || !selectedGenres.has(bookGenre)) return false;
    }
    return true;
  });

  const ranked = eligible
    .map((book) => {
      const distance = euclideanDistance(userValues, book);
      const matchPercentage = Math.round(
        Math.max(0, (1 - distance / MAX_DISTANCE) * 100)
      );
      const traitMatches = getTraitMatches(userValues, book);
      return { ...book, matchPercentage, traitMatches };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return limit ? ranked.slice(0, limit) : ranked;
}
