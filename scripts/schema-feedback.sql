-- Run this in Supabase SQL Editor to create the feedback table

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  message TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit feedback
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Only Maia can read feedback (hardcoded admin email)
CREATE POLICY "Admin can read all feedback" ON feedback
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'maia.salti@gmail.com'
    )
  );
