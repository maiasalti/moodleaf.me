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

// Set to true to force re-seeding all books (e.g., after trait system change)
const FORCE_RESEED = false;

async function bookIsComplete(title: string, author: string): Promise<boolean> {
  if (FORCE_RESEED) return false;

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
    prose_density: number;
    characterization: number;
    emotional_impact: number;
    plot_complexity: number;
    humor: number;
    darkness: number;
    intellectual_challenge: number;
  };
  rationale: {
    pacing: string;
    prose_density: string;
    characterization: string;
    emotional_impact: string;
    plot_complexity: string;
    humor: string;
    darkness: string;
    intellectual_challenge: string;
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
Use the full range of the scale. Both ends of each scale represent valid, desirable qualities.

Book: ${title} by ${author}
Description: ${description}
Genre/Categories: ${categories.join(", ")}

Score this book on the following dimensions. For each, provide the numeric score AND a brief 1-sentence rationale explaining why.
Respond ONLY with valid JSON, no other text:

{
  "scores": {
    "pacing": <1=leisurely (scenes linger, savoring detail) to 10=rapid (events unfold quickly, page-turning momentum)>,
    "prose_density": <1=transparent (plain, utilitarian language) to 10=lush (highly stylized, lyrical, rhetorically rich)>,
    "characterization": <1=archetypal (characters as clear symbols/roles, limited nuance) to 10=deeply nuanced (internally complex, contradictory, developmentally rich)>,
    "emotional_impact": <1=cool (emotion present but muted, rarely aims for gut-punch) to 10=overwhelming (strong emotional intensity, readers feel shaken/moved)>,
    "plot_complexity": <1=straightforward (one main through-line, few reversals) to 10=intricate (multiple threads, timelines, nested structures, frequent twists)>,
    "humor": <1=earnest (humor is rare, tone stays mostly serious) to 10=comedic (humor is frequent and central to the reading experience)>,
    "darkness": <1=safe (comforting, gentle, low-disturbance tone) to 10=disturbing (bleak, grim, or psychologically/viscerally unsettling)>,
    "intellectual_challenge": <1=effortless (easy to follow while tired/distracted) to 10=demanding (requires sustained attention, dense allusions/experimentation)>
  },
  "rationale": {
    "pacing": "<why this score>",
    "prose_density": "<why this score>",
    "characterization": "<why this score>",
    "emotional_impact": "<why this score>",
    "plot_complexity": "<why this score>",
    "humor": "<why this score>",
    "darkness": "<why this score>",
    "intellectual_challenge": "<why this score>"
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
