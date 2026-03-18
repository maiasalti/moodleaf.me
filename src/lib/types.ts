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
  character_depth: number;
  emotional_weight: number;
  plot_complexity: number;
  prose_style: number;
  mood: number;
  spice_level: number;
  world_building: number;
}

export interface SliderDimension {
  key: TraitKey;
  label: string;
  lowLabel: string;
  highLabel: string;
}

export type TraitKey =
  | "pacing"
  | "character_depth"
  | "emotional_weight"
  | "plot_complexity"
  | "prose_style"
  | "mood"
  | "spice_level"
  | "world_building";

export interface SliderValues {
  pacing: number;
  character_depth: number;
  emotional_weight: number;
  plot_complexity: number;
  prose_style: number;
  mood: number;
  spice_level: number;
  world_building: number;
}

export interface BookWithScore extends Book {
  matchPercentage: number;
}
