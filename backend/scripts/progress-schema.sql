-- ============================================================================
-- Progress & Gamification - Database Schema
-- ============================================================================

-- ============================================================================
-- USER PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  videos_created INT DEFAULT 0,
  audios_created INT DEFAULT 0,
  assignments_completed INT DEFAULT 0,
  cards_reviewed INT DEFAULT 0,
  study_minutes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_progress IS 'User progress and gamification stats';

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  xp_reward INT DEFAULT 50,
  category VARCHAR(50)
);

-- Insert default achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_video', 'Director', 'Create your first video', 'video', 100, 'videos'),
  ('video_master', 'Video Master', 'Create 10 videos', 'film', 250, 'videos'),
  ('first_audio', 'Podcaster', 'Create your first audio overview', 'headphones', 100, 'audio'),
  ('first_assignment', 'Organized', 'Create your first assignment', 'clipboard', 50, 'assignments'),
  ('assignment_master', 'Task Master', 'Complete 10 assignments', 'check-circle', 200, 'assignments'),
  ('first_deck', 'Card Collector', 'Create your first flashcard deck', 'layers', 50, 'flashcards'),
  ('hundred_cards', 'Memory Pro', 'Review 100 flashcards', 'brain', 200, 'flashcards'),
  ('streak_3', 'Getting Started', '3 day learning streak', 'flame', 75, 'streaks'),
  ('streak_7', 'Week Warrior', '7 day learning streak', 'flame', 150, 'streaks'),
  ('streak_30', 'Monthly Master', '30 day learning streak', 'trophy', 500, 'streaks'),
  ('pomodoro_10', 'Focus Finder', 'Complete 10 pomodoro sessions', 'clock', 100, 'study'),
  ('pomodoro_50', 'Deep Worker', 'Complete 50 pomodoro sessions', 'target', 300, 'study'),
  ('study_hour', 'Hour of Power', 'Study for 1 hour in a day', 'zap', 75, 'study'),
  ('study_marathon', 'Marathon Learner', 'Study for 5 hours in a day', 'award', 200, 'study')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USER ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

COMMENT ON TABLE user_achievements IS 'Achievements earned by users';

-- ============================================================================
-- DAILY ACTIVITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  study_minutes INT DEFAULT 0,
  cards_reviewed INT DEFAULT 0,
  videos_watched INT DEFAULT 0,
  assignments_completed INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_activity IS 'Daily activity tracking for streaks and analytics';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, date);

-- ============================================================================
-- FUNCTION: Calculate level from XP
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_level(xp INT)
RETURNS INT AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  RETURN FLOOR(SQRT(xp::float / 100)) + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Progress & Gamification schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - user_progress';
    RAISE NOTICE '   - achievements';
    RAISE NOTICE '   - user_achievements';
    RAISE NOTICE '   - daily_activity';
END $$;
