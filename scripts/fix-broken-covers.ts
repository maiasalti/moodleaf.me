import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, isbn, cover_image_url");

  if (!books) return;

  console.log(`Checking ${books.length} books for broken covers...\n`);

  let fixed = 0;
  let stillBroken: string[] = [];

  for (const book of books) {
    if (!book.cover_image_url) {
      console.log(`  No cover at all: "${book.title}"`);
      stillBroken.push(book.title);
      continue;
    }

    // Check if the cover image is actually valid (not a tiny placeholder)
    try {
      const res = await fetch(book.cover_image_url, { method: "HEAD" });
      const contentLength = parseInt(res.headers.get("content-length") || "0");

      // Google Books placeholder images are typically < 15KB
      if (contentLength >= 15000) continue; // Good cover, skip

      console.log(`  Broken cover (${contentLength}B): "${book.title}" — trying Open Library...`);
    } catch {
      console.log(`  Fetch failed: "${book.title}" — trying Open Library...`);
    }

    // Try Open Library
    try {
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&limit=1`;
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.docs?.[0]?.cover_i) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
          await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", book.id);
          console.log(`    Fixed with Open Library.`);
          fixed++;
          await sleep(200);
          continue;
        }
      }
    } catch {}

    // If Open Library failed, try Google Books at zoom=2 instead of zoom=3
    if (book.cover_image_url.includes("zoom=3")) {
      const zoom2 = book.cover_image_url.replace("zoom=3", "zoom=2");
      try {
        const res = await fetch(zoom2, { method: "HEAD" });
        const contentLength = parseInt(res.headers.get("content-length") || "0");
        if (contentLength >= 15000) {
          await supabase.from("books").update({ cover_image_url: zoom2 }).eq("id", book.id);
          console.log(`    Fixed with Google Books zoom=2.`);
          fixed++;
          continue;
        }
      } catch {}
    }

    stillBroken.push(book.title);
    console.log(`    Could not fix: "${book.title}"`);
    await sleep(200);
  }

  console.log(`\nFixed ${fixed} broken covers.`);
  if (stillBroken.length > 0) {
    console.log(`\n${stillBroken.length} still broken:`);
    for (const t of stillBroken) console.log(`  - ${t}`);
  } else {
    console.log("All covers are good!");
  }
}

main();
