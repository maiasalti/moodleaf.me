import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY!;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeDuplicates() {
  console.log("=== Removing duplicate books ===\n");

  const { data: allBooks } = await supabase
    .from("books")
    .select("id, title, author, created_at");

  if (!allBooks) return;

  // Group by normalized title+author
  const groups = new Map<string, typeof allBooks>();
  for (const book of allBooks) {
    const key = `${book.title.toLowerCase().trim()}|||${book.author.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(book);
  }

  let removed = 0;
  for (const [key, books] of groups) {
    if (books.length <= 1) continue;

    // Keep the first one (oldest), delete the rest
    const [keep, ...dupes] = books.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    console.log(`  Duplicate: "${keep.title}" — keeping ID ${keep.id}, removing ${dupes.length} dupe(s)`);

    for (const dupe of dupes) {
      await supabase.from("saved_books").delete().eq("book_id", dupe.id);
      await supabase.from("books").delete().eq("id", dupe.id);
      removed++;
    }
  }

  // Also check for mismatched entries (e.g., wrong author from Google Books)
  const { data: badEntries } = await supabase
    .from("books")
    .select("id, title, author")
    .or("title.ilike.%Ertrinkendes%,author.ilike.%Ani Goviani%,title.ilike.%KRISTIN. HANNAH%,author.ilike.%KRISTIN. HANNAH%");

  if (badEntries && badEntries.length > 0) {
    for (const bad of badEntries) {
      console.log(`  Removing bad entry: "${bad.title}" by ${bad.author}`);
      await supabase.from("saved_books").delete().eq("book_id", bad.id);
      await supabase.from("books").delete().eq("id", bad.id);
      removed++;
    }
  }

  console.log(`  Removed ${removed} duplicate/bad entries.\n`);
}

async function upgradeCovers() {
  console.log("=== Upgrading cover resolution ===\n");

  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, cover_image_url, isbn");

  if (!books) return;

  let upgraded = 0;
  let missingFixed = 0;

  for (const book of books) {
    // Upgrade Google Books URLs to higher zoom
    if (book.cover_image_url?.includes("books.google.com")) {
      const highRes = book.cover_image_url
        .replace(/zoom=\d/, "zoom=3")
        .replace(/&edge=curl/, "");

      if (highRes !== book.cover_image_url) {
        await supabase.from("books").update({ cover_image_url: highRes }).eq("id", book.id);
        upgraded++;
      }
    }

    // Fix missing covers using Open Library
    if (!book.cover_image_url) {
      console.log(`  Missing cover: "${book.title}" — trying Open Library...`);

      // Try Open Library search
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&limit=1`;
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.docs?.[0]?.cover_i) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
          await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", book.id);
          console.log(`  Fixed with Open Library cover.`);
          missingFixed++;
        }
      }

      // Fallback: try Google Books again
      if (!book.cover_image_url) {
        const q = encodeURIComponent(`"${book.title}" "${book.author}"`);
        const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${q}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1`;
        const gbResponse = await fetch(gbUrl);
        if (gbResponse.ok) {
          const gbData = await gbResponse.json();
          if (gbData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
            const coverUrl = gbData.items[0].volumeInfo.imageLinks.thumbnail
              .replace(/^http:/, "https:")
              .replace(/zoom=\d/, "zoom=3")
              .replace(/&edge=curl/, "");
            await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", book.id);
            console.log(`  Fixed with Google Books cover.`);
            missingFixed++;
          }
        }
      }

      await sleep(300);
    }
  }

  console.log(`  Upgraded ${upgraded} covers to higher resolution.`);
  console.log(`  Fixed ${missingFixed} missing covers.\n`);

  // Final check
  const { data: stillMissing } = await supabase
    .from("books")
    .select("title, author")
    .is("cover_image_url", null);

  if (stillMissing && stillMissing.length > 0) {
    console.log(`⚠ Still missing covers:`);
    for (const b of stillMissing) {
      console.log(`  - "${b.title}" by ${b.author}`);
    }
  } else {
    console.log("All books have covers!");
  }
}

async function main() {
  await removeDuplicates();
  await upgradeCovers();
  console.log("\nDone.");
}

main();
