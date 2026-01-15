-- ============================================================================
-- Resource Library - Database Schema
-- ============================================================================

-- ============================================================================
-- RESOURCE FOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS resource_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  parent_id UUID REFERENCES resource_folders(id) ON DELETE CASCADE,
  color VARCHAR(20) DEFAULT 'gray',
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE resource_folders IS 'Folders for organizing resources';

-- ============================================================================
-- RESOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES resource_folders(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'link', 'pdf', 'note', 'image', 'file'
  url TEXT,                    -- For links
  file_path TEXT,              -- For uploaded files
  file_size INT,               -- Size in bytes
  content TEXT,                -- For notes
  description TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE resources IS 'User resources like links, files, and notes';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_resource_folders_user ON resource_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_folder ON resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_resources_search ON resources 
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')));

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Resource Library schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - resource_folders';
    RAISE NOTICE '   - resources';
END $$;
