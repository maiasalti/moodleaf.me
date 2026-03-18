import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Download image to temp file and check pixel width
async function getImageWidth(url: string): Promise<number> {
  try {
    const tmpFile = `/tmp/cover_check_${Date.now()}.jpg`;
    execSync(`curl -sL "${url}" -o "${tmpFile}" --max-time 10`, { stdio: "pipe" });
    const fileInfo = execSync(`file "${tmpFile}"`, { encoding: "utf-8" });
    execSync(`rm -f "${tmpFile}"`, { stdio: "pipe" });

    // Parse width from file output like "JPEG image data, ..., 115x187, ..."
    const match = fileInfo.match(/(\d+)x(\d+)/);
    if (match) return parseInt(match[1]);
    return 0;
  } catch {
    return 0;
  }
}

// Try Open Library by ISBN (often higher quality than title search)
async function tryOpenLibraryISBN(isbn: string): Promise<string | null> {
  if (!isbn) return null;
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  const width = await getImageWidth(url);
  return width >= 300 ? url : null;
}

// Try Open Library by title/author search
async function tryOpenLibrarySearch(title: string, author: string): Promise<string | null> {
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=3`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    const data = await response.json();

    // Try multiple results — sometimes the first has a bad cover
    for (const doc of data.docs?.slice(0, 3) || []) {
      if (!doc.cover_i) continue;
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      const width = await getImageWidth(url);
      if (width >= 300) return url;
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

    // Try extraLarge > large > medium > thumbnail, all with zoom tweaks
    for (const key of ["extraLarge", "large", "medium", "thumbnail"]) {
      if (!imageLinks[key]) continue;
      let url = imageLinks[key].replace(/^http:/, "https:");

      // Try zoom=3 first (largest)
      for (const zoom of ["3", "2", "1"]) {
        const zoomedUrl = url.replace(/zoom=\d/, `zoom=${zoom}`);
        const width = await getImageWidth(zoomedUrl);
        if (width >= 300) return zoomedUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const MIN_WIDTH = 300; // Minimum acceptable pixel width

async function main() {
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, isbn, cover_image_url");

  if (!books) return;

  console.log(`Checking ${books.length} books for high-res covers (>=${MIN_WIDTH}px wide)...\n`);

  let upgraded = 0;
  let alreadyGood = 0;
  let noGoodCover: string[] = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const progress = `[${i + 1}/${books.length}]`;

    // Check current cover quality
    if (book.cover_image_url) {
      const currentWidth = await getImageWidth(book.cover_image_url);
      if (currentWidth >= MIN_WIDTH) {
        alreadyGood++;
        continue;
      }
      console.log(`${progress} Low-res (${currentWidth}px): "${book.title}" — searching for better...`);
    } else {
      console.log(`${progress} No cover: "${book.title}" — searching...`);
    }

    // Try sources in order of quality
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
    }

    // 3. Google Books
    if (!newUrl) {
      newUrl = await tryGoogleBooks(book.title, book.author);
      if (newUrl) console.log(`  Found via Google Books`);
    }

    if (newUrl) {
      await supabase.from("books").update({ cover_image_url: newUrl }).eq("id", book.id);
      upgraded++;
      console.log(`  Upgraded!`);
    } else {
      // Clear the bad cover so the frontend shows the nice gradient fallback
      if (book.cover_image_url) {
        await supabase.from("books").update({ cover_image_url: null }).eq("id", book.id);
        console.log(`  No good cover found — using fallback`);
      }
      noGoodCover.push(book.title);
    }

    await sleep(300);
  }

  console.log(`\n--- Results ---`);
  console.log(`Already good: ${alreadyGood}`);
  console.log(`Upgraded: ${upgraded}`);
  console.log(`Using fallback: ${noGoodCover.length}`);
  if (noGoodCover.length > 0) {
    console.log(`\nBooks using gradient fallback:`);
    for (const t of noGoodCover) console.log(`  - ${t}`);
  }
}

main();
