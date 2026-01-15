-- ============================================================================
-- Flashcards & Spaced Repetition - Database Schema
-- ============================================================================

-- ============================================================================
-- FLASHCARD DECKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(200),
  color VARCHAR(20) DEFAULT 'indigo',
  cards_count INT DEFAULT 0,
  last_studied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE flashcard_decks IS 'Flashcard deck collections';

-- ============================================================================
-- FLASHCARDS TABLE (with SM-2 algorithm fields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,          -- Question/prompt
  back TEXT NOT NULL,           -- Answer
  difficulty INT DEFAULT 0,     -- Number of times incorrect
  ease_factor FLOAT DEFAULT 2.5,  -- SM-2 ease factor
  interval_days INT DEFAULT 0,    -- Days until next review
  repetitions INT DEFAULT 0,      -- Number of successful reviews
  next_review DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE flashcards IS 'Individual flashcards with spaced repetition data';

-- ============================================================================
-- FLASHCARD REVIEW LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  quality INT NOT NULL,  -- 0-5 rating (SM-2)
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE flashcard_reviews IS 'History of flashcard reviews for analytics';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON flashcard_reviews(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_flashcard_decks_updated_at ON flashcard_decks;
CREATE TRIGGER update_flashcard_decks_updated_at
  BEFORE UPDATE ON flashcard_decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update deck card count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE flashcard_decks SET cards_count = cards_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE flashcard_decks SET cards_count = cards_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deck_card_count ON flashcards;
CREATE TRIGGER trigger_update_deck_card_count
  AFTER INSERT OR DELETE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_card_count();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Flashcards schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - flashcard_decks';
    RAISE NOTICE '   - flashcards';
    RAISE NOTICE '   - flashcard_reviews';
END $$;
