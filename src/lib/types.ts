export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_image_url: string | null;
  page_count: number | null;
  average_rating: number | null;
  isbn: string | null;
  categories: string[] | null;
  pacing: number;
  prose_density: number;
  characterization: number;
  emotional_impact: number;
  plot_complexity: number;
  humor: number;
  darkness: number;
  intellectual_challenge: number;
}

export interface SliderDimension {
  key: TraitKey;
  label: string;
  lowLabel: string;
  highLabel: string;
}

export type TraitKey =
  | "pacing"
  | "prose_density"
  | "characterization"
  | "emotional_impact"
  | "plot_complexity"
  | "humor"
  | "darkness"
  | "intellectual_challenge";

export interface SliderValues {
  pacing: number;
  prose_density: number;
  characterization: number;
  emotional_impact: number;
  plot_complexity: number;
  humor: number;
  darkness: number;
  intellectual_challenge: number;
}

export interface TraitMatch {
  key: TraitKey;
  label: string;
  bookValue: number;
  userValue: number;
  difference: number;
}

export interface BookWithScore extends Book {
  matchPercentage: number;
  traitMatches: TraitMatch[];
}

export interface MoodPreset {
  name: string;
  icon: string;
  values: SliderValues;
}

export interface ReadingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ReadingListWithBooks extends ReadingList {
  books: Book[];
}

export interface CommunityAggregate {
  means: SliderValues;
  count: number;
}

export interface UserReadBook {
  book: Book;
  rating: SliderValues | null;
  readAt: string;
}
