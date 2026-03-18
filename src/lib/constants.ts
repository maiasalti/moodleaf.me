import { SliderDimension, SliderValues, MoodPreset } from "./types";

export const SLIDER_DIMENSIONS: SliderDimension[] = [
  {
    key: "pacing",
    label: "Pacing",
    lowLabel: "Slow burn",
    highLabel: "Page-turner",
  },
  {
    key: "character_depth",
    label: "Character Depth",
    lowLabel: "Plot-driven",
    highLabel: "Character-driven",
  },
  {
    key: "emotional_weight",
    label: "Emotional Weight",
    lowLabel: "Light / humorous",
    highLabel: "Emotionally heavy",
  },
  {
    key: "plot_complexity",
    label: "Plot Complexity",
    lowLabel: "Straightforward",
    highLabel: "Intricate",
  },
  {
    key: "prose_style",
    label: "Prose Style",
    lowLabel: "Sparse / direct",
    highLabel: "Lush / literary",
  },
  {
    key: "mood",
    label: "Mood",
    lowLabel: "Dark / gritty",
    highLabel: "Hopeful / warm",
  },
  {
    key: "spice_level",
    label: "Spice Level",
    lowLabel: "Clean",
    highLabel: "Steamy",
  },
  {
    key: "world_building",
    label: "World Building",
    lowLabel: "Grounded",
    highLabel: "Expansive",
  },
];

export const DEFAULT_SLIDER_VALUES: SliderValues = {
  pacing: 5,
  character_depth: 5,
  emotional_weight: 5,
  plot_complexity: 5,
  prose_style: 5,
  mood: 5,
  spice_level: 5,
  world_building: 5,
};

export const TRAIT_KEYS = SLIDER_DIMENSIONS.map((d) => d.key);

export const GENRES = [
  "Literary Fiction",
  "Contemporary Fiction",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Mystery/Thriller",
  "Historical Fiction",
  "Young Adult",
  "Horror/Gothic",
  "Nonfiction/Memoir",
] as const;

export const MOOD_PRESETS: MoodPreset[] = [
  {
    name: "Beach read",
    icon: "\u{1F3D6}\u{FE0F}",
    values: {
      pacing: 8, character_depth: 4, emotional_weight: 3,
      plot_complexity: 4, prose_style: 3, mood: 8,
      spice_level: 5, world_building: 3,
    },
  },
  {
    name: "Dark academia",
    icon: "\u{1F56F}\u{FE0F}",
    values: {
      pacing: 3, character_depth: 8, emotional_weight: 7,
      plot_complexity: 7, prose_style: 8, mood: 3,
      spice_level: 3, world_building: 5,
    },
  },
  {
    name: "Emotional gut-punch",
    icon: "\u{1F494}",
    values: {
      pacing: 4, character_depth: 9, emotional_weight: 10,
      plot_complexity: 5, prose_style: 7, mood: 4,
      spice_level: 2, world_building: 3,
    },
  },
  {
    name: "Light & fast",
    icon: "\u{26A1}",
    values: {
      pacing: 9, character_depth: 4, emotional_weight: 2,
      plot_complexity: 3, prose_style: 3, mood: 9,
      spice_level: 3, world_building: 3,
    },
  },
  {
    name: "Cozy escape",
    icon: "\u{2615}",
    values: {
      pacing: 4, character_depth: 7, emotional_weight: 4,
      plot_complexity: 4, prose_style: 5, mood: 9,
      spice_level: 2, world_building: 5,
    },
  },
  {
    name: "Epic adventure",
    icon: "\u{2694}\u{FE0F}",
    values: {
      pacing: 8, character_depth: 6, emotional_weight: 5,
      plot_complexity: 8, prose_style: 5, mood: 7,
      spice_level: 2, world_building: 9,
    },
  },
];

// Map messy Google Books categories to our clean genres
const GENRE_KEYWORDS: Record<string, string[]> = {
  "Fantasy": ["fantasy", "magic", "wizards", "dragons", "paranormal"],
  "Romance": ["romance", "love stories", "love", "courtship"],
  "Sci-Fi": ["science fiction", "sci-fi", "dystopia", "space", "futuristic"],
  "Mystery/Thriller": ["mystery", "thriller", "suspense", "detective", "crime"],
  "Historical Fiction": ["historical fiction", "history", "war fiction"],
  "Horror/Gothic": ["horror", "gothic", "ghost", "occult", "supernatural"],
  "Young Adult": ["young adult", "juvenile", "teen", "children"],
  "Nonfiction/Memoir": ["biography", "autobiography", "memoir", "self-help", "nonfiction", "true crime", "psychology", "science", "business"],
  "Literary Fiction": ["literary", "fiction / literary", "literary fiction"],
  "Contemporary Fiction": ["fiction / general", "domestic fiction", "humorous fiction"],
};

export function categorizeBook(categories: string[] | null): string | null {
  if (!categories || categories.length === 0) return null;
  const joined = categories.join(" ").toLowerCase();
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((kw) => joined.includes(kw))) return genre;
  }
  if (joined.includes("fiction")) return "Literary Fiction";
  return null;
}
