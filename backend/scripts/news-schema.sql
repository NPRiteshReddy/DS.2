-- ============================================================================
-- News Feed Feature - Database Schema
-- ============================================================================
-- Run this in Supabase SQL Editor to add news feed tables
-- ============================================================================

-- ============================================================================
-- USER INTERESTS TABLE
-- ============================================================================
-- Stores user's selected interest categories
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  interests TEXT[] DEFAULT '{}',  -- ['AI/ML', 'Data Science', 'LLMs', ...]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_interests IS 'Stores user interest preferences for news personalization';
COMMENT ON COLUMN user_interests.interests IS 'Array of interest categories selected by user';

-- ============================================================================
-- NEWS ARTICLES TABLE
-- ============================================================================
-- Cached news articles fetched from Firecrawl
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content TEXT,           -- Full markdown content from Firecrawl
  url VARCHAR(1000) UNIQUE NOT NULL,
  source VARCHAR(200),    -- Source website name
  image_url VARCHAR(1000),
  published_at TIMESTAMP,
  category VARCHAR(100),  -- Primary category
  keywords TEXT[],        -- Keywords for matching
  relevance_tags TEXT[],  -- AI/ML, Data Science, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE news_articles IS 'Cached news articles fetched via Firecrawl API';

-- ============================================================================
-- USER NEWS FEED TABLE
-- ============================================================================
-- Personalized feed entries for each user
CREATE TABLE IF NOT EXISTS user_news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 0,  -- How relevant to user's interests (0-1)
  is_read BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, article_id)
);

COMMENT ON TABLE user_news_feed IS 'User-specific news feed with read/saved status';

-- ============================================================================
-- NEWS FETCH LOGS TABLE
-- ============================================================================
-- Track when news was last fetched (for rate limiting/caching)
CREATE TABLE IF NOT EXISTS news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100),
  articles_fetched INT DEFAULT 0,
  fetched_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE news_fetch_logs IS 'Tracks news fetch operations for rate limiting';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_created ON news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url);
CREATE INDEX IF NOT EXISTS idx_user_news_feed_user ON user_news_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_news_feed_article ON user_news_feed(article_id);
CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_user ON news_fetch_logs(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for user_interests
DROP TRIGGER IF EXISTS update_user_interests_updated_at ON user_interests;
CREATE TRIGGER update_user_interests_updated_at
  BEFORE UPDATE ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ News feed schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - user_interests';
    RAISE NOTICE '   - news_articles';
    RAISE NOTICE '   - user_news_feed';
    RAISE NOTICE '   - news_fetch_logs';
END $$;
