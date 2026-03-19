import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Download image and check pixel width via file size as proxy
// Open Library -L images that are real covers are typically >30KB
// Tiny placeholders or 1x1 images are <5KB
async function isGoodCover(url: string): Promise<boolean> {
  try {
    const tmpFile = `/tmp/cover_check_${Date.now()}.jpg`;
    execSync(`curl -sL "${url}" -o "${tmpFile}" --max-time 10`, { stdio: "pipe" });
    const stats = fs.statSync(tmpFile);
    const size = stats.size;

    // Also try to parse dimensions from file command
    let width = 0;
    try {
      const fileInfo = execSync(`file "${tmpFile}"`, { encoding: "utf-8" });
      const match = fileInfo.match(/(\d+)\s*x\s*(\d+)/);
      if (match) width = parseInt(match[1]);
    } catch {}

    fs.unlinkSync(tmpFile);

    // Accept if dimensions are good OR file is large enough to be a real cover
    return width >= 200 || size >= 30000;
  } catch {
    return false;
  }
}

// Try Open Library by ISBN (often highest quality)
async function tryOpenLibraryISBN(isbn: string): Promise<string | null> {
  if (!isbn) return null;
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  return (await isGoodCover(url)) ? url : null;
}

// Try Open Library by title/author search
async function tryOpenLibrarySearch(title: string, author: string): Promise<string | null> {
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=3`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    const data = await response.json();

    for (const doc of data.docs?.slice(0, 3) || []) {
      if (!doc.cover_i) continue;
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      if (await isGoodCover(url)) return url;
    }
    return null;
  } catch {
    return null;
  }
}

// Try Google Books API
async function tryGoogleBooks(title: string, author: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    const data = await response.json();

    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    if (!imageLinks) return null;

    // Try largest zoom first
    const baseUrl = (imageLinks.thumbnail || imageLinks.smallThumbnail || "")
      .replace(/^http:/, "https:");
    if (!baseUrl) return null;

    for (const zoom of ["3", "2"]) {
      const url = baseUrl.replace(/zoom=\d/, `zoom=${zoom}`);
      if (await isGoodCover(url)) return url;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, isbn, cover_image_url");

  if (!books) return;

  console.log(`Checking ${books.length} books for cover quality...\n`);

  let upgraded = 0;
  let alreadyGood = 0;
  let restored = 0;
  let noGoodCover: string[] = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const progress = `[${i + 1}/${books.length}]`;

    // Check if current cover is good
    if (book.cover_image_url && (await isGoodCover(book.cover_image_url))) {
      alreadyGood++;
      continue;
    }

    console.log(`${progress} Needs upgrade: "${book.title}"`);

    let newUrl: string | null = null;

    // 1. Open Library by ISBN
    if (book.isbn) {
      newUrl = await tryOpenLibraryISBN(book.isbn);
      if (newUrl) console.log(`  Found via Open Library ISBN`);
    }

    // 2. Open Library by search
    if (!newUrl) {
      newUrl = await tryOpenLibrarySearch(book.title, book.author);
      if (newUrl) console.log(`  Found via Open Library search`);
      await sleep(300);
    }

    // 3. Google Books
    if (!newUrl) {
      newUrl = await tryGoogleBooks(book.title, book.author);
      if (newUrl) console.log(`  Found via Google Books`);
      await sleep(200);
    }

    if (newUrl) {
      await supabase.from("books").update({ cover_image_url: newUrl }).eq("id", book.id);
      upgraded++;
    } else {
      noGoodCover.push(book.title);
      console.log(`  No good cover found`);
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Already good: ${alreadyGood}`);
  console.log(`Upgraded: ${upgraded}`);
  console.log(`No good cover: ${noGoodCover.length}`);
  if (noGoodCover.length > 0) {
    console.log(`\nBooks without good covers:`);
    for (const t of noGoodCover) console.log(`  - ${t}`);
  }
}

main();
