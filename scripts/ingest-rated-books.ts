/**
 * Ingest pre-rated books (scored with the same prompt as seed-database.ts) into Supabase.
 *
 * Usage: npx tsx scripts/ingest-rated-books.ts <dir-of-json-batches> [--dry-run]
 *
 * Each JSON file is an array of { title, author, genre, scores: {8 traits}, rationale: {8 traits} }.
 * For each book: look up Google Books (falling back to Open Library) for cover/description/ISBN,
 * skip books without a usable cover, skip anything already in the DB, upsert, append to scoring-audit.md.
 * Progress is recorded in <dir>/.ingest-progress.json so the script can be re-run safely.
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), quiet: true });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY!;
const AUDIT_PATH = path.resolve(__dirname, "../scoring-audit.md");
const TRAITS = [
  "pacing", "prose_density", "characterization", "emotional_impact",
  "plot_complexity", "humor", "darkness", "intellectual_challenge",
] as const;
const CONCURRENCY = 6;

type Trait = (typeof TRAITS)[number];
interface RatedBook {
  title: string;
  author: string;
  genre: string;
  scores: Record<Trait, number>;
  rationale: Record<Trait, string>;
}
interface Metadata {
  title: string;
  author: string;
  description: string;
  cover: string;
  pageCount: number | null;
  averageRating: number | null;
  isbn: string | null;
  categories: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/^(the|a|an) /, "").replace(/[^a-z0-9]/g, "");
const titleKey = (t: string) => norm(t.split(/[:(]/)[0]);
const surname = (a: string) => norm(a.trim().split(/\s+/).pop() ?? a);
const bookKey = (t: string, a: string) => `${titleKey(t)}|${surname(a)}`;

function titlesMatch(wanted: string, found: string) {
  const w = titleKey(wanted), f = titleKey(found);
  return w.length > 0 && (w === f || (Math.min(w.length, f.length) >= 6 && (f.startsWith(w) || w.startsWith(f))));
}
function authorsMatch(wanted: string, found: string[]) {
  const s = surname(wanted);
  return found.some((a) => norm(a).includes(s));
}

async function fetchJson(url: string, tries = 5): Promise<any | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * 2 ** i); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(1000 * 2 ** i); }
  }
  return null;
}

// Reject missing images and Google's "image not available" placeholders (small files).
async function coverIsUsable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    return buf.byteLength >= 6000;
  } catch { return false; }
}

async function googleLookup(b: RatedBook): Promise<Metadata | null> {
  const q = encodeURIComponent(`intitle:${b.title.split(":")[0]} inauthor:${b.author.trim().split(/\s+/).pop()}`);
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${q}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=10&printType=books`);
  const items: any[] = data?.items ?? [];
  const matches = items
    .map((it) => it.volumeInfo)
    .filter((v) => v?.title && v.authors && titlesMatch(b.title, v.title) && authorsMatch(b.author, v.authors));
  if (matches.length === 0) return null;
  // Prefer an edition with a cover and a description
  matches.sort((x, y) =>
    (y.imageLinks?.thumbnail ? 2 : 0) + (y.description ? 1 : 0) - ((x.imageLinks?.thumbnail ? 2 : 0) + (x.description ? 1 : 0)));
  const withDesc = matches.find((v) => v.description);
  for (const v of matches) {
    if (!v.imageLinks?.thumbnail) continue;
    const cover = v.imageLinks.thumbnail.replace(/^http:/, "https:").replace(/zoom=1/, "zoom=2").replace(/&edge=curl/, "");
    if (!(await coverIsUsable(cover))) continue;
    return {
      title: b.title,
      author: b.author,
      description: v.description ?? withDesc?.description ?? "",
      cover,
      pageCount: v.pageCount ?? matches.find((m) => m.pageCount)?.pageCount ?? null,
      averageRating: v.averageRating ?? null,
      isbn: v.industryIdentifiers?.find((i: any) => i.type === "ISBN_13")?.identifier ?? v.industryIdentifiers?.[0]?.identifier ?? null,
      categories: v.categories ?? [b.genre],
    };
  }
  // Matched but no usable Google cover — keep its metadata, try Open Library for the cover
  const v = matches[0];
  const ol = await openLibraryLookup(b);
  if (!ol) return null;
  return {
    ...ol,
    description: withDesc?.description ?? ol.description,
    pageCount: matches.find((m) => m.pageCount)?.pageCount ?? ol.pageCount,
    averageRating: v.averageRating ?? null,
    categories: v.categories ?? [b.genre],
  };
}

async function openLibraryLookup(b: RatedBook): Promise<Metadata | null> {
  const data = await fetchJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(b.title)}&author=${encodeURIComponent(b.author)}&limit=5&fields=title,author_name,cover_i,number_of_pages_median,isbn`);
  for (const d of data?.docs ?? []) {
    if (!d.cover_i || !titlesMatch(b.title, d.title) || !authorsMatch(b.author, d.author_name ?? [])) continue;
    const cover = `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
    if (!(await coverIsUsable(cover))) continue;
    return {
      title: b.title, author: b.author, description: "", cover,
      pageCount: d.number_of_pages_median ?? null, averageRating: null,
      isbn: d.isbn?.find((i: string) => i.length === 13) ?? d.isbn?.[0] ?? null,
      categories: [b.genre],
    };
  }
  return null;
}

async function loadExistingKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("books").select("title, author").range(from, from + 999);
    if (error) throw error;
    for (const b of data) keys.add(bookKey(b.title, b.author));
    if (data.length < 1000) break;
  }
  return keys;
}

function auditEntry(b: RatedBook, categories: string[]) {
  const rows = TRAITS.map((k) => `| ${k} | ${b.scores[k]}/10 | ${b.rationale[k]} |`).join("\n");
  return `### ${b.title} — ${b.author}\n**Genre:** ${categories.join(", ")}\n\n| Trait | Score | Rationale |\n|-------|-------|-----------|\n${rows}\n\n`;
}

async function main() {
  const dir = path.resolve(process.argv[2] ?? "");
  const dryRun = process.argv.includes("--dry-run");
  if (!fs.existsSync(dir)) throw new Error(`Usage: ingest-rated-books.ts <dir> [--dry-run]`);

  const files = fs.readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(".json") && !f.includes(".ingest-progress"));
  const all: RatedBook[] = files.flatMap((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { console.warn(`Unreadable: ${f}`); return []; }
  });

  const progressPath = path.join(dir, ".ingest-progress.json");
  const progress: Record<string, string> = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, "utf8")) : {};
  const existing = await loadExistingKeys();
  console.log(`${all.length} rated books in ${files.length} files; ${existing.size} already in DB; ${Object.keys(progress).length} previously processed.`);

  const queue: RatedBook[] = [];
  const seen = new Set<string>();
  for (const b of all) {
    const k = bookKey(b.title, b.author);
    if (seen.has(k) || progress[k] || existing.has(k)) continue;
    if (!TRAITS.every((t) => Number.isInteger(b.scores?.[t]) && b.scores[t] >= 1 && b.scores[t] <= 10)) continue;
    seen.add(k);
    queue.push(b);
  }
  console.log(`${queue.length} to process.`);

  const stats = { added: 0, noMatch: 0, error: 0 };
  let done = 0;
  const saveProgress = () => fs.writeFileSync(progressPath, JSON.stringify(progress));

  async function worker() {
    while (queue.length) {
      const b = queue.shift()!;
      const k = bookKey(b.title, b.author);
      try {
        const meta = (await googleLookup(b)) ?? (await openLibraryLookup(b));
        if (!meta) { stats.noMatch++; progress[k] = "no-cover-or-match"; continue; }
        if (dryRun) { stats.added++; progress[k] = "dry-run"; continue; }
        const { error } = await supabase.from("books").upsert({
          title: meta.title, author: meta.author, description: meta.description,
          cover_image_url: meta.cover, page_count: meta.pageCount, average_rating: meta.averageRating,
          isbn: meta.isbn, categories: meta.categories, ...b.scores,
        }, { onConflict: "title,author", ignoreDuplicates: true });
        if (error) { stats.error++; console.error(`  DB error "${b.title}": ${error.message}`); continue; }
        fs.appendFileSync(AUDIT_PATH, auditEntry(b, meta.categories));
        stats.added++; progress[k] = "added";
      } catch (e: any) {
        stats.error++; console.error(`  Error "${b.title}": ${e.message}`);
      } finally {
        if (++done % 100 === 0) {
          saveProgress();
          console.log(`[${done}] added ${stats.added}, no cover/match ${stats.noMatch}, errors ${stats.error}`);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  saveProgress();
  console.log(`\nDone. Added ${stats.added}, skipped (no cover/match) ${stats.noMatch}, errors ${stats.error}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
