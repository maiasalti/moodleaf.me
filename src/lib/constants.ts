import { SliderDimension, SliderValues, MoodPreset, Book, TraitKey } from "./types";

export const SLIDER_DIMENSIONS: SliderDimension[] = [
  // Main 3 (always visible)
  {
    key: "pacing",
    label: "Pace",
    lowLabel: "Leisurely",
    highLabel: "Rapid",
    description: "How quickly the story feels like it moves forward. Low = scenes linger, savoring detail and atmosphere. High = events unfold quickly with page-turning momentum. Independent of book length.",
  },
  {
    key: "prose_density",
    label: "Prose Density",
    lowLabel: "Transparent",
    highLabel: "Lush",
    description: "How much the reading experience is driven by the language itself. Low = plain, get-the-job-done writing where you read for what happens next. High = lyrical, stylized prose where sentences themselves are a source of pleasure.",
  },
  {
    key: "characterization",
    label: "Characterization",
    lowLabel: "Archetypal",
    highLabel: "Deeply nuanced",
    description: "The psychological dimensionality of the central characters. Low = characters serve as clear symbols or roles with limited nuance. High = characters feel internally complex, contradictory, and developmentally rich.",
  },
  // Optional 5
  {
    key: "emotional_impact",
    label: "Emotional Impact",
    lowLabel: "Cool",
    highLabel: "Overwhelming",
    description: "The intensity of emotion the book provokes — regardless of whether it's sadness, joy, anxiety, or something else. Low = emotion is present but muted. High = readers feel shaken, moved, or emotionally drained.",
  },
  {
    key: "plot_complexity",
    label: "Plot Complexity",
    lowLabel: "Straightforward",
    highLabel: "Intricate",
    description: "How structurally complicated the story is. Low = one main storyline, few reversals, easy to summarize. High = multiple plot threads, timelines, nested structures, or frequent twists that reward careful tracking.",
  },
  {
    key: "humor",
    label: "Humor",
    lowLabel: "Earnest",
    highLabel: "Comedic",
    description: "How often the text deliberately produces amusement. Low = humor is rare and the tone stays mostly serious. High = humor is frequent and central to the reading experience, whether through jokes, satire, or witty narration.",
  },
  {
    key: "darkness",
    label: "Darkness",
    lowLabel: "Safe",
    highLabel: "Disturbing",
    description: "How dark the overall emotional atmosphere and subject matter feels. Low = comforting, gentle, low-disturbance tone. High = bleak, grim, or psychologically unsettling. Rate it by aftertaste: did you feel soothed or haunted?",
  },
  {
    key: "intellectual_challenge",
    label: "Intellectual Challenge",
    lowLabel: "Effortless",
    highLabel: "Demanding",
    description: "The cognitive work the book asks of you to track meaning. Low = easy to follow while tired or distracted. High = requires sustained attention, with dense allusions, experimentation, or philosophical depth where rereading is rewarding.",
  },
];

export const MAIN_TRAIT_KEYS: TraitKey[] = ["pacing", "prose_density", "characterization"];
export const OPTIONAL_TRAIT_KEYS: TraitKey[] = ["emotional_impact", "plot_complexity", "humor", "darkness", "intellectual_challenge"];

export const DEFAULT_SLIDER_VALUES: SliderValues = {
  pacing: 5,
  prose_density: 5,
  characterization: 5,
  emotional_impact: 5,
  plot_complexity: 5,
  humor: 5,
  darkness: 5,
  intellectual_challenge: 5,
};

export const TRAIT_KEYS = SLIDER_DIMENSIONS.map((d) => d.key);

// AI baseline counts as this many "votes" when blending with community ratings
export const COMMUNITY_RATING_PRIOR_WEIGHT = 3;

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
      pacing: 8, prose_density: 3, characterization: 4,
      emotional_impact: 3, plot_complexity: 4, humor: 6,
      darkness: 2, intellectual_challenge: 2,
    },
  },
  {
    name: "Dark academia",
    icon: "\u{1F56F}\u{FE0F}",
    values: {
      pacing: 3, prose_density: 8, characterization: 8,
      emotional_impact: 7, plot_complexity: 7, humor: 2,
      darkness: 6, intellectual_challenge: 8,
    },
  },
  {
    name: "Emotional gut-punch",
    icon: "\u{1F494}",
    values: {
      pacing: 4, prose_density: 7, characterization: 9,
      emotional_impact: 10, plot_complexity: 5, humor: 2,
      darkness: 7, intellectual_challenge: 5,
    },
  },
  {
    name: "Light & fast",
    icon: "\u{26A1}",
    values: {
      pacing: 9, prose_density: 3, characterization: 4,
      emotional_impact: 3, plot_complexity: 3, humor: 7,
      darkness: 2, intellectual_challenge: 2,
    },
  },
  {
    name: "Cozy escape",
    icon: "\u{2615}",
    values: {
      pacing: 4, prose_density: 5, characterization: 7,
      emotional_impact: 5, plot_complexity: 4, humor: 5,
      darkness: 1, intellectual_challenge: 3,
    },
  },
  {
    name: "Epic adventure",
    icon: "\u{2694}\u{FE0F}",
    values: {
      pacing: 8, prose_density: 5, characterization: 6,
      emotional_impact: 6, plot_complexity: 8, humor: 3,
      darkness: 5, intellectual_challenge: 5,
    },
  },
];

export const PAGE_COUNT_RANGES = [
  { key: "short", label: "Short (< 250)", min: 0, max: 249 },
  { key: "medium", label: "Medium (250–450)", min: 250, max: 450 },
  { key: "long", label: "Long (450+)", min: 451, max: Infinity },
] as const;

export function extractTraitValues(book: Book): SliderValues {
  const values: Partial<SliderValues> = {};
  for (const key of TRAIT_KEYS) {
    values[key as TraitKey] = Math.round(book[key as TraitKey]);
  }
  return values as SliderValues;
}

export function averageTraits(books: Book[]): SliderValues {
  if (books.length === 0) return { ...DEFAULT_SLIDER_VALUES };
  const sums: Partial<SliderValues> = {};
  for (const key of TRAIT_KEYS) {
    sums[key as TraitKey] = 0;
  }
  for (const book of books) {
    for (const key of TRAIT_KEYS) {
      sums[key as TraitKey] = (sums[key as TraitKey] || 0) + book[key as TraitKey];
    }
  }
  const result: Partial<SliderValues> = {};
  for (const key of TRAIT_KEYS) {
    result[key as TraitKey] = Math.round((sums[key as TraitKey] || 0) / books.length);
  }
  return result as SliderValues;
}

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
