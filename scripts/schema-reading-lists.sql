-- Reading lists tables
-- Run this migration in Supabase SQL Editor

-- Reading lists
CREATE TABLE IF NOT EXISTS reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table
CREATE TABLE IF NOT EXISTS reading_list_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES reading_lists(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(list_id, book_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_books_list_id ON reading_list_books(list_id);

-- RLS policies
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_books ENABLE ROW LEVEL SECURITY;

-- Users can only see their own lists
CREATE POLICY "Users can view own lists"
  ON reading_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lists"
  ON reading_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON reading_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Junction table: verify ownership through reading_lists
CREATE POLICY "Users can view own list books"
  ON reading_list_books FOR SELECT
  USING (list_id IN (SELECT id FROM reading_lists WHERE user_id = auth.uid()));

CREATE POLICY "Users can add to own lists"
  ON reading_list_books FOR INSERT
  WITH CHECK (list_id IN (SELECT id FROM reading_lists WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove from own lists"
  ON reading_list_books FOR DELETE
  USING (list_id IN (SELECT id FROM reading_lists WHERE user_id = auth.uid()));
