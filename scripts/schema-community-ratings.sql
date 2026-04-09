-- Run this in Supabase SQL Editor to add community rating tables

-- Tracks that a user has logged a book as "read"
CREATE TABLE IF NOT EXISTS user_read_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_user_read_books_user ON user_read_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_read_books_book ON user_read_books(book_id);

ALTER TABLE user_read_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own read-log" ON user_read_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log books as read" ON user_read_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlog books" ON user_read_books
  FOR DELETE USING (auth.uid() = user_id);

-- Per-user trait ratings for books they've read
CREATE TABLE IF NOT EXISTS user_book_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  pacing FLOAT NOT NULL CHECK (pacing BETWEEN 1 AND 10),
  character_depth FLOAT NOT NULL CHECK (character_depth BETWEEN 1 AND 10),
  emotional_weight FLOAT NOT NULL CHECK (emotional_weight BETWEEN 1 AND 10),
  plot_complexity FLOAT NOT NULL CHECK (plot_complexity BETWEEN 1 AND 10),
  prose_style FLOAT NOT NULL CHECK (prose_style BETWEEN 1 AND 10),
  mood FLOAT NOT NULL CHECK (mood BETWEEN 1 AND 10),
  spice_level FLOAT NOT NULL CHECK (spice_level BETWEEN 1 AND 10),
  world_building FLOAT NOT NULL CHECK (world_building BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_user_book_ratings_user ON user_book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_ratings_book ON user_book_ratings(book_id);

ALTER TABLE user_book_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ratings" ON user_book_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert ratings" ON user_book_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON user_book_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON user_book_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for aggregation (anyone can see aggregate stats)
CREATE POLICY "Anyone can read ratings for aggregation" ON user_book_ratings
  FOR SELECT USING (true);
