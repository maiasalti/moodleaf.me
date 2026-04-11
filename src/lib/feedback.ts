import { supabase } from "./supabase";

export interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  message: string;
  page_url: string | null;
  created_at: string;
}

export async function submitFeedback(
  message: string,
  userId: string | null,
  userEmail: string | null,
  pageUrl: string
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    user_email: userEmail,
    message,
    page_url: pageUrl,
  });
  return !error;
}

export async function getAllFeedback(): Promise<Feedback[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Feedback[];
}
