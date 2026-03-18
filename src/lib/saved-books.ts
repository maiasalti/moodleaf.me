import { supabase } from "./supabase";

export async function getSavedBookIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase
    .from("saved_books")
    .select("book_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.book_id));
}

export async function saveBook(userId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("saved_books")
    .insert({ user_id: userId, book_id: bookId });
  return !error;
}

export async function unsaveBook(userId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("saved_books")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);
  return !error;
}
