-- Run this in Supabase SQL Editor to create the books table

CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  page_count INTEGER,
  average_rating FLOAT,
  isbn TEXT,
  categories TEXT[],
  -- Trait scores (1-10)
  pacing FLOAT,
  character_depth FLOAT,
  emotional_weight FLOAT,
  plot_complexity FLOAT,
  prose_style FLOAT,
  mood FLOAT,
  spice_level FLOAT,
  world_building FLOAT,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for upserts
ALTER TABLE books ADD CONSTRAINT books_title_author_unique UNIQUE (title, author);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read all books)
CREATE POLICY "Allow public read access" ON books
  FOR SELECT USING (true);
