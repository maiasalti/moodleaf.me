import { Book, BookWithScore, SliderValues, TraitKey } from "./types";
import { TRAIT_KEYS } from "./constants";

function euclideanDistance(
  userValues: SliderValues,
  book: Book,
  lockedDimensions?: Set<TraitKey>
): number {
  let sum = 0;
  for (const key of TRAIT_KEYS) {
    const diff = userValues[key] - book[key];
    const weight = lockedDimensions?.has(key) ? 3 : 1;
    sum += weight * diff * diff;
  }
  return Math.sqrt(sum);
}

const MAX_DISTANCE_PER_DIM = 9; // max diff per dimension (1 to 10)

export function rankBooks(
  books: Book[],
  userValues: SliderValues,
  lockedDimensions?: Set<TraitKey>,
  limit: number = 10
): BookWithScore[] {
  const totalWeight = TRAIT_KEYS.reduce(
    (acc, key) => acc + (lockedDimensions?.has(key) ? 3 : 1),
    0
  );
  const maxDistance = Math.sqrt(
    totalWeight * MAX_DISTANCE_PER_DIM * MAX_DISTANCE_PER_DIM
  );

  return books
    .map((book) => {
      const distance = euclideanDistance(userValues, book, lockedDimensions);
      const matchPercentage = Math.round(
        Math.max(0, (1 - distance / maxDistance) * 100)
      );
      return { ...book, matchPercentage };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);
}
