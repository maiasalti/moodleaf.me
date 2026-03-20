import { supabase } from "./supabase";
import { ReadingList, ReadingListWithBooks } from "./types";

export async function getUserLists(userId: string): Promise<ReadingListWithBooks[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reading_lists")
    .select("*, reading_list_books(*, books(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reading lists:", error);
    return [];
  }

  return (data ?? []).map((list: any) => ({
    id: list.id,
    user_id: list.user_id,
    name: list.name,
    created_at: list.created_at,
    books: (list.reading_list_books ?? [])
      .map((rlb: any) => rlb.books)
      .filter(Boolean),
  }));
}

export async function createList(userId: string, name: string): Promise<ReadingList | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reading_lists")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    console.error("Error creating list:", error);
    return null;
  }
  return data;
}

export async function deleteList(listId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reading_lists")
    .delete()
    .eq("id", listId);
  return !error;
}

export async function addBookToList(listId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reading_list_books")
    .insert({ list_id: listId, book_id: bookId });
  return !error;
}

export async function removeBookFromList(listId: string, bookId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reading_list_books")
    .delete()
    .eq("list_id", listId)
    .eq("book_id", bookId);
  return !error;
}
