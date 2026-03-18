import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { SEED_BOOKS } from "./book-list";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const AUDIT_PATH = path.resolve(__dirname, "../scoring-audit.md");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendAudit(text: string) {
  fs.appendFileSync(AUDIT_PATH, text + "\n");
}

async function bookIsComplete(title: string, author: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("books")
    .select("id, pacing, cover_image_url")
    .ilike("title", title)
    .ilike("author", author)
    .maybeSingle();

  if (error) {
    console.error(`  Error checking existence for "${title}":`, error.message);
    return false;
  }

  return data !== null && data.pacing !== null && data.cover_image_url !== null;
}

interface GoogleBooksMetadata {
  title: string;
  authors: string[];
  description: string;
  thumbnail: string | null;
  pageCount: number | null;
  averageRating: number | null;
  isbn: string | null;
  categories: string[];
}

async function fetchGoogleBooksMetadata(
  title: string,
  author: string
): Promise<GoogleBooksMetadata | null> {
  const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    console.warn(`  No Google Books result found for "${title}" by ${author}`);
    return null;
  }

  const volumeInfo = data.items[0].volumeInfo;

  let thumbnail: string | null = null;
  if (volumeInfo.imageLinks?.thumbnail) {
    thumbnail = volumeInfo.imageLinks.thumbnail
      .replace(/^http:/, "https:")
      .replace(/zoom=1/, "zoom=2");
  }

  const isbn =
    volumeInfo.industryIdentifiers?.[0]?.identifier ?? null;

  return {
    title: volumeInfo.title ?? title,
    authors: volumeInfo.authors ?? [author],
    description: volumeInfo.description ?? "",
    thumbnail,
    pageCount: volumeInfo.pageCount ?? null,
    averageRating: volumeInfo.averageRating ?? null,
    isbn,
    categories: volumeInfo.categories ?? [],
  };
}

interface TraitScoresWithRationale {
  scores: {
    pacing: number;
    character_depth: number;
    emotional_weight: number;
    plot_complexity: number;
    prose_style: number;
    mood: number;
    spice_level: number;
    world_building: number;
  };
  rationale: {
    pacing: string;
    character_depth: string;
    emotional_weight: string;
    plot_complexity: string;
    prose_style: string;
    mood: string;
    spice_level: string;
    world_building: string;
  };
}

async function fetchTraitScores(
  title: string,
  author: string,
  description: string,
  categories: string[]
): Promise<TraitScoresWithRationale> {
  const prompt = `You are a literary analyst scoring books on reader-experience dimensions.
Given the following book, rate it on each dimension from 1-10.
Be opinionated and precise — avoid clustering everything around 5.
Use the full range of the scale.

Book: ${title} by ${author}
Description: ${description}
Genre/Categories: ${categories.join(", ")}

Score this book on the following dimensions. For each, provide the numeric score AND a brief 1-sentence rationale explaining why.
Respond ONLY with valid JSON, no other text:

{
  "scores": {
    "pacing": <1=slow burn/contemplative, 10=relentless page-turner>,
    "character_depth": <1=plot-driven/action-focused, 10=deeply character-driven>,
    "emotional_weight": <1=light/cerebral/humorous, 10=emotionally heavy/devastating>,
    "plot_complexity": <1=linear/straightforward, 10=multi-threaded/intricate>,
    "prose_style": <1=sparse/direct/minimal, 10=lush/literary/ornate>,
    "mood": <1=dark/gritty/bleak, 10=hopeful/warm/uplifting>,
    "spice_level": <1=clean/no romance, 10=steamy/explicit romance>,
    "world_building": <1=grounded/real-world, 10=expansive/immersive world>
  },
  "rationale": {
    "pacing": "<why this score>",
    "character_depth": "<why this score>",
    "emotional_weight": "<why this score>",
    "plot_complexity": "<why this score>",
    "prose_style": "<why this score>",
    "mood": "<why this score>",
    "spice_level": "<why this score>",
    "world_building": "<why this score>"
  }
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const result: TraitScoresWithRationale = JSON.parse(cleaned);
  return result;
}

async function seedBook(book: { title: string; author: string; genre: string }) {
  const { title, author, genre } = book;

  console.log(`\nProcessing: "${title}" by ${author}`);

  // Step 1: Check if already seeded
  const exists = await bookIsComplete(title, author);
  if (exists) {
    console.log(`  Skipping — already in database.`);
    return;
  }

  // Step 2: Fetch Google Books metadata
  console.log(`  Fetching metadata from Google Books...`);
  let metadata: GoogleBooksMetadata | null = null;
  try {
    metadata = await fetchGoogleBooksMetadata(title, author);
  } catch (err: any) {
    console.error(`  Failed to fetch Google Books metadata:`, err.message);
  }

  await sleep(500);

  // Skip books without cover images
  if (!metadata?.thumbnail) {
    console.warn(`  Skipping "${title}" — no cover image available.`);
    appendAudit(`### ${title} — ${author}\n**SKIPPED**: No cover image available.\n`);
    return;
  }

  const description = metadata?.description ?? "";
  const categories =
    metadata?.categories.length ? metadata.categories : [genre];

  // Step 3: Get trait scores from Claude
  console.log(`  Fetching trait scores from Claude...`);
  let traitData: TraitScoresWithRationale | null = null;
  try {
    traitData = await fetchTraitScores(title, author, description, categories);
  } catch (err: any) {
    console.error(`  Failed to fetch trait scores:`, err.message);
  }

  await sleep(500);

  if (!traitData) {
    console.warn(`  Skipping "${title}" — failed to get trait scores.`);
    return;
  }

  // Write audit entry
  appendAudit(`### ${title} — ${author}`);
  appendAudit(`**Genre:** ${categories.join(", ")}\n`);
  appendAudit(`| Trait | Score | Rationale |`);
  appendAudit(`|-------|-------|-----------|`);
  for (const [key, score] of Object.entries(traitData.scores)) {
    const reason = traitData.rationale[key as keyof typeof traitData.rationale] ?? "";
    appendAudit(`| ${key} | ${score}/10 | ${reason} |`);
  }
  appendAudit("");

  // Step 4: Upsert into Supabase
  console.log(`  Upserting into Supabase...`);
  const record = {
    title: metadata?.title ?? title,
    author: metadata?.authors?.[0] ?? author,
    description,
    cover_image_url: metadata?.thumbnail ?? null,
    page_count: metadata?.pageCount ?? null,
    average_rating: metadata?.averageRating ?? null,
    isbn: metadata?.isbn ?? null,
    categories,
    ...traitData.scores,
  };

  const { error } = await supabase.from("books").upsert(record, {
    onConflict: "title,author",
  });

  if (error) {
    console.error(`  Supabase upsert error:`, error.message);
  } else {
    console.log(`  Done.`);
  }
}

async function main() {
  console.log(`Starting database seed with ${SEED_BOOKS.length} books...`);

  // Initialize audit file
  fs.writeFileSync(
    AUDIT_PATH,
    `# Moodleaf Scoring Audit\n\nGenerated: ${new Date().toISOString()}\n\nThis document records how each book was scored across all 8 trait dimensions, with rationale from Claude.\n\n---\n\n`
  );

  let seeded = 0;
  let skipped = 0;

  for (const book of SEED_BOOKS) {
    try {
      await seedBook(book);
      seeded++;
    } catch (err: any) {
      console.error(`  Unhandled error for "${book.title}":`, err.message);
      skipped++;
    }
  }

  console.log(`\nSeed complete. Processed: ${seeded}, Errors: ${skipped}`);
  console.log(`Scoring audit written to: ${AUDIT_PATH}`);
}

main();
