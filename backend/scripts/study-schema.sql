-- ============================================================================
-- Study Planner & Pomodoro - Database Schema
-- ============================================================================

-- ============================================================================
-- STUDY SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  title VARCHAR(500),
  duration_minutes INT NOT NULL DEFAULT 25,
  type VARCHAR(20) DEFAULT 'pomodoro',
  status VARCHAR(20) DEFAULT 'completed',
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (type IN ('pomodoro', 'break', 'long_break', 'free_study')),
  CHECK (status IN ('in_progress', 'completed', 'cancelled'))
);

COMMENT ON TABLE study_sessions IS 'Tracks individual study sessions and pomodoro completions';

-- ============================================================================
-- POMODORO SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  work_duration INT DEFAULT 25,         -- minutes
  break_duration INT DEFAULT 5,         -- minutes
  long_break_duration INT DEFAULT 15,   -- minutes
  sessions_before_long_break INT DEFAULT 4,
  auto_start_breaks BOOLEAN DEFAULT FALSE,
  auto_start_pomodoros BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE pomodoro_settings IS 'User preferences for pomodoro timer';

-- ============================================================================
-- DAILY STUDY STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_study_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INT DEFAULT 0,
  pomodoros_completed INT DEFAULT 0,
  sessions_count INT DEFAULT 0,
  assignments_worked_on UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_study_stats IS 'Aggregated daily study statistics';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started ON study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_assignment ON study_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_daily_study_stats_user_date ON daily_study_stats(user_id, date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_pomodoro_settings_updated_at ON pomodoro_settings;
CREATE TRIGGER update_pomodoro_settings_updated_at
  BEFORE UPDATE ON pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Study Planner schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - study_sessions';
    RAISE NOTICE '   - pomodoro_settings';
    RAISE NOTICE '   - daily_study_stats';
END $$;
