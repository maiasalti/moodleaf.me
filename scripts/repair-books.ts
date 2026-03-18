import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY!;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryGoogleBooks(title: string, author: string): Promise<{ thumbnail: string | null; description: string | null }> {
  // Try multiple query strategies
  const queries = [
    `intitle:${title} inauthor:${author}`,
    `"${title}" "${author}"`,
    `${title} ${author}`,
  ];

  for (const q of queries) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=3`;
    const response = await fetch(url);
    if (!response.ok) continue;

    const data = await response.json();
    if (!data.items) continue;

    // Find the best match (one with both thumbnail and description)
    for (const item of data.items) {
      const vol = item.volumeInfo;
      let thumbnail: string | null = null;
      if (vol.imageLinks?.thumbnail) {
        thumbnail = vol.imageLinks.thumbnail
          .replace(/^http:/, "https:")
          .replace(/zoom=1/, "zoom=2");
      }
      const description = vol.description || null;

      if (thumbnail || description) {
        return { thumbnail, description };
      }
    }
  }

  return { thumbnail: null, description: null };
}

async function tryOpenLibraryCovers(title: string, author: string, isbn: string | null): Promise<string | null> {
  // Try by ISBN first
  if (isbn) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (response.ok) return url.replace("?default=false", "");
  }

  // Try search by title+author
  const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
  const response = await fetch(searchUrl);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.docs?.length > 0 && data.docs[0].cover_i) {
    return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
  }

  return null;
}

async function generateDescription(title: string, author: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Write a 2-3 sentence book description/blurb for "${title}" by ${author}. Write it in the style of a back-cover summary — engaging but not spoilery. Return ONLY the description text, no quotes or preamble.`,
    }],
  });
  return message.content[0].type === "text" ? message.content[0].text.trim() : "";
}

async function main() {
  // Find books missing cover or description
  const { data: broken, error } = await supabase
    .from("books")
    .select("id, title, author, isbn, cover_image_url, description")
    .or("cover_image_url.is.null,description.is.null,description.eq.");

  if (error) {
    console.error("Error querying books:", error);
    return;
  }

  console.log(`Found ${broken?.length ?? 0} books needing repair.\n`);

  for (const book of broken ?? []) {
    console.log(`Repairing: "${book.title}" by ${book.author}`);
    const updates: Record<string, string> = {};

    const needsCover = !book.cover_image_url;
    const needsDesc = !book.description;

    if (needsCover || needsDesc) {
      // Try Google Books again with better queries
      console.log("  Trying Google Books...");
      const google = await tryGoogleBooks(book.title, book.author);
      await sleep(300);

      if (google.thumbnail && needsCover) {
        updates.cover_image_url = google.thumbnail;
        console.log("  Found cover via Google Books.");
      }
      if (google.description && needsDesc) {
        updates.description = google.description;
        console.log("  Found description via Google Books.");
      }
    }

    // Fallback: Open Library for covers
    if (needsCover && !updates.cover_image_url) {
      console.log("  Trying Open Library...");
      const olCover = await tryOpenLibraryCovers(book.title, book.author, book.isbn);
      await sleep(300);

      if (olCover) {
        updates.cover_image_url = olCover;
        console.log("  Found cover via Open Library.");
      }
    }

    // Fallback: Claude for descriptions
    if (needsDesc && !updates.description) {
      console.log("  Generating description with Claude...");
      const desc = await generateDescription(book.title, book.author);
      await sleep(300);

      if (desc) {
        updates.description = desc;
        console.log("  Generated description.");
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("books")
        .update(updates)
        .eq("id", book.id);

      if (updateError) {
        console.error(`  Update failed:`, updateError.message);
      } else {
        console.log(`  Updated: ${Object.keys(updates).join(", ")}`);
      }
    } else {
      console.log(`  Could not find cover or description — consider removing this book.`);
    }
  }

  // Final check: any books still missing covers?
  const { data: stillBroken } = await supabase
    .from("books")
    .select("title, author")
    .is("cover_image_url", null);

  if (stillBroken && stillBroken.length > 0) {
    console.log(`\n⚠ ${stillBroken.length} books still missing covers:`);
    for (const b of stillBroken) {
      console.log(`  - "${b.title}" by ${b.author}`);
    }
  } else {
    console.log("\nAll books now have covers!");
  }

  console.log("\nRepair complete.");
}

main();
