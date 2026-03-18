import { SliderDimension, SliderValues } from "./types";

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
  "YA",
  "Horror/Gothic",
  "Nonfiction/Memoir",
] as const;

// Map messy Google Books categories to our clean genres
const GENRE_KEYWORDS: Record<string, string[]> = {
  "Fantasy": ["fantasy", "magic", "wizards", "dragons", "paranormal"],
  "Romance": ["romance", "love stories", "love", "courtship"],
  "Sci-Fi": ["science fiction", "sci-fi", "dystopia", "space", "futuristic"],
  "Mystery/Thriller": ["mystery", "thriller", "suspense", "detective", "crime"],
  "Historical Fiction": ["historical fiction", "history", "war fiction"],
  "Horror/Gothic": ["horror", "gothic", "ghost", "occult", "supernatural"],
  "YA": ["young adult", "juvenile", "teen", "children"],
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
