# 📚 Student Learning Platform

<div align="center">

**An AI-powered educational platform that transforms research papers and technical content into digestible educational videos and provides AI code reviews.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 🎯 Overview

The Student Learning Platform solves a critical problem for college students: **information overload** when trying to learn from lengthy research papers and technical content. Instead of spending hours reading dense academic material, students can:

- **Watch 5-10 minute educational videos** generated from research papers
- **Listen to podcast-style audio overviews** featuring AI-generated dialogue
- **Get AI-powered code reviews** for their GitHub projects

All built on **zero-cost infrastructure** to maintain accessibility for students.

---

## ✨ Features

### 🎬 Custom Video Generation
- Submit any URL (research paper, blog post, technical article)
- AI extracts content and generates educational video scripts
- **Manim-powered animations** with professional narration
- Videos saved to personal library

### 🎧 Audio Overview (NotebookLM-style)
- Two AI hosts (Alex & Sam) discuss your content in natural dialogue
- High-quality Text-to-Speech using Microsoft Edge TTS
- Customizable: target audience, focus area, duration, tone
- Transcript view and download options

### 🔍 AI Project Reviewer
- Submit GitHub repository URL for analysis
- Receive **quality score (0-10)** with detailed breakdowns
- Actionable suggestions for improvement
- **PDF report** download

### 📊 Browse Curated Content
- Dashboard with trending educational videos
- Category filtering: AI/ML, Data Science, Research
- Bookmark videos for later
- Search functionality

### 📰 Personalized News Feed
- Select interests (AI/ML, Data Science, LLMs, Computer Vision, etc.)
- Fetch AI-focused news via **Firecrawl API**
- Filter and search within your feed
- Generate video/audio directly from news articles

### 📅 Assignment Reminders
- Create and track assignments with due dates
- Priority levels (low, medium, high)
- **Multi-channel notifications**: In-app, Email (Resend), WhatsApp
- Customizable reminder timing (1 hour to 1 week before)

### ⏱️ Study Planner & Pomodoro
- **Pomodoro timer** with work/break/long-break modes
- Progress ring animation
- Daily and weekly study statistics
- Customizable timer durations

### 🃏 Flashcards with Spaced Repetition
- Create decks with color coding
- **SM-2 algorithm** for optimal review scheduling
- Flip card animations for study mode
- Track cards due for review

### 📈 Progress Dashboard & Gamification
- **XP and leveling system**
- Streak tracking (current and longest)
- **14 achievements** across categories
- Activity calendar (GitHub-style heatmap)
- Leaderboard for competition

### 🤖 AI Study Assistant
- Chat interface with session history
- **OpenAI GPT-4o-mini** integration
- Quick actions: Generate quiz, Explain concept, Create flashcards, Summarize

### 📁 Resource Library
- Save links and notes
- Folder organization
- Search and filter by type
- Favorites for quick access

### 🔐 Authentication
- Email/Password signup with validation
- JWT-based session management (7-day expiration)
- Protected routes for premium features

---

## 🏗️ Architecture

```
DS.2/
├── student-learning-platform/    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # 12 page components
│   │   ├── context/              # React Context (Auth)
│   │   ├── services/             # API client
│   │   └── utils/                # Helpers
│   └── package.json
│
├── backend/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/               # Database configuration
│   │   ├── controllers/          # Business logic (12 controllers)
│   │   ├── routes/               # API endpoints (12 route files)
│   │   ├── services/             # External integrations (12 services)
│   │   ├── middleware/           # Auth & error handling
│   │   ├── jobs/                 # Background job processors
│   │   ├── server.js             # Express app entry
│   │   └── worker.js             # Background worker
│   ├── scripts/                  # SQL schema files (8 schema files)
│   └── package.json
│
├── docs/                         # Technical documentation
├── PRD.md                        # Product Requirements Document
└── CLAUDE.md                     # AI assistant context file
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Node.js, Express 5, JWT, bcrypt, Bull/BullMQ |
| **Database** | PostgreSQL via Supabase |
| **Queue** | Redis + Bull for background jobs |
| **AI** | OpenAI (video scripts, chat), Anthropic Claude (code reviews), Firecrawl (news) |
| **Video** | Manim (animations), Edge TTS (narration), FFmpeg (processing) |
| **Audio** | Edge TTS (dialogue), FFmpeg (mixing) |
| **Notifications** | Resend (email), WhatsApp Business API |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Redis** server (for background jobs)
- **Python** 3.8+ with pip (for video generation)
- **FFmpeg** installed and in PATH

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DS.2
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=<your-secret-key>
FRONTEND_URL=http://localhost:5173

# Optional (for full functionality)
OPENAI_API_KEY=sk-<key>
ANTHROPIC_API_KEY=sk-ant-<key>
REDIS_URL=redis://localhost:6379

# Video Generation
ENABLE_VIDEO_RENDERING=true
```

### 3. Database Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Run the following schema files in order:
   - `backend/scripts/schema.sql` (core tables)
   - `backend/scripts/audio-schema.sql` (audio features)
   - `backend/scripts/news-schema.sql` (news feed)
   - `backend/scripts/assignments-schema.sql` (assignments & reminders)
   - `backend/scripts/study-schema.sql` (pomodoro & study)
   - `backend/scripts/flashcards-schema.sql` (flashcards & SM-2)
   - `backend/scripts/progress-schema.sql` (XP, achievements)
   - `backend/scripts/assistant-schema.sql` (AI chat)
   - `backend/scripts/resources-schema.sql` (resource library)
4. (Optional) Run `backend/scripts/seed-videos.sql` for sample data

### 4. Video Generation Dependencies

```bash
# Install Python packages
pip install manim edge-tts

# Install FFmpeg
# macOS:
brew install ffmpeg
# Windows:
choco install ffmpeg
# Linux:
apt install ffmpeg

# Verify installations
manim --version
ffmpeg -version
python -m edge_tts --version
```

### 5. Frontend Setup

```bash
cd student-learning-platform
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 6. Start the Application

```bash
# Terminal 1: Start Redis (if not running as service)
redis-server

# Terminal 2: Start Backend API
cd backend
npm run dev

# Terminal 3: Start Background Worker (for video/audio generation)
cd backend
npm run worker:dev

# Terminal 4: Start Frontend
cd student-learning-platform
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Logout |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/videos` | Get all videos |
| `GET` | `/api/videos/search` | Search videos |
| `GET` | `/api/videos/my-videos` | Get user's generated videos 🔒 |
| `GET` | `/api/videos/bookmarks` | Get bookmarked videos 🔒 |
| `GET` | `/api/videos/:id` | Get single video |
| `POST` | `/api/videos/:id/bookmark` | Bookmark video 🔒 |
| `DELETE` | `/api/videos/:id/bookmark` | Remove bookmark 🔒 |
| `POST` | `/api/videos/:id/view` | Increment view count |

### Video Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate/video` | Start video generation 🔒 |
| `GET` | `/api/generate/video/:id/status` | Check generation status 🔒 |
| `DELETE` | `/api/generate/video/:id` | Cancel generation 🔒 |
| `GET` | `/api/generate/my-jobs` | Get user's jobs 🔒 |

### Audio Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audio/generate` | Start audio generation 🔒 |
| `GET` | `/api/audio/:id/status` | Check generation status 🔒 |
| `GET` | `/api/audio/:id` | Get audio overview 🔒 |

### News Feed

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/news/categories` | Get interest categories |
| `GET` | `/api/news/interests` | Get user interests 🔒 |
| `PUT` | `/api/news/interests` | Update user interests 🔒 |
| `GET` | `/api/news` | Get personalized news feed 🔒 |
| `GET` | `/api/news/saved` | Get saved articles 🔒 |
| `POST` | `/api/news/:articleId/save` | Save/unsave article 🔒 |

🔒 = Requires authentication (JWT token in Authorization header)

### Assignments & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | Get all assignments 🔒 |
| `POST` | `/api/assignments` | Create assignment 🔒 |
| `PUT` | `/api/assignments/:id` | Update assignment 🔒 |
| `DELETE` | `/api/assignments/:id` | Delete assignment 🔒 |
| `GET` | `/api/notifications` | Get notifications 🔒 |
| `GET` | `/api/notifications/preferences` | Get notification settings 🔒 |
| `PUT` | `/api/notifications/preferences` | Update notification settings 🔒 |

### Study Planner

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/study/sessions` | Start study session 🔒 |
| `POST` | `/api/study/sessions/:id/complete` | Complete session 🔒 |
| `GET` | `/api/study/today` | Get today's stats 🔒 |
| `GET` | `/api/study/weekly` | Get weekly stats 🔒 |
| `GET` | `/api/study/settings` | Get pomodoro settings 🔒 |
| `PUT` | `/api/study/settings` | Update pomodoro settings 🔒 |

### Flashcards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flashcards/decks` | Get all decks 🔒 |
| `POST` | `/api/flashcards/decks` | Create deck 🔒 |
| `GET` | `/api/flashcards/decks/:id/study` | Get cards due for review 🔒 |
| `POST` | `/api/flashcards/cards/:id/review` | Review card (SM-2) 🔒 |

### Progress & Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress` | Get user progress 🔒 |
| `GET` | `/api/progress/achievements` | Get achievements 🔒 |
| `GET` | `/api/progress/activity` | Get activity history 🔒 |
| `GET` | `/api/progress/leaderboard` | Get leaderboard |

### AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assistant/sessions` | Create chat session 🔒 |
| `GET` | `/api/assistant/sessions` | Get all sessions 🔒 |
| `POST` | `/api/assistant/sessions/:id/chat` | Send message 🔒 |
| `POST` | `/api/assistant/quick-action` | Quick action (quiz/explain) 🔒 |

### Resource Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/resources` | Get all resources 🔒 |
| `POST` | `/api/resources` | Create resource 🔒 |
| `GET` | `/api/resources/folders` | Get folders 🔒 |
| `POST` | `/api/resources/:id/favorite` | Toggle favorite 🔒 |

---

## 🗃️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with bcrypt-hashed passwords |
| `user_stats` | Activity tracking (videos generated, reviews completed) |
| `videos` | Video metadata, URLs, categories |
| `bookmarks` | User video bookmarks |
| `code_reviews` | AI code review results |
| `video_generation_jobs` | Async job tracking |
| `daily_limits` | Rate limiting (5 videos, 3 reviews per day) |
| `view_history` | Video viewing history |
| `user_interests` | User's selected interest categories |
| `news_articles` | Cached news articles from Firecrawl |
| `user_news_feed` | Personalized feed with read/saved status |
| `assignments` | User assignments with due dates |
| `reminders` | Assignment reminder schedules |
| `notifications` | In-app notifications |
| `user_notification_preferences` | Email/WhatsApp/In-app settings |
| `study_sessions` | Pomodoro and study session tracking |
| `pomodoro_settings` | User timer preferences |
| `flashcard_decks` | Flashcard deck collections |
| `flashcards` | Individual cards with SM-2 data |
| `user_progress` | XP, levels, streaks |
| `achievements` | Available achievements |
| `user_achievements` | Earned achievements |
| `chat_sessions` | AI chat sessions |
| `chat_messages` | Chat message history |
| `resources` | Saved links, notes, files |
| `resource_folders` | Folder organization |

### Entity Relationship

```
users (1) ──── (N) user_stats
  │
  ├── (N) videos (created_by)
  │         │
  │         └── (N) bookmarks
  │         │
  │         └── (N) view_history
  │
  ├── (N) video_generation_jobs
  │
  └── (N) code_reviews
```

---

## 📁 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| `DashboardPage` | `/dashboard` | Browse curated videos |
| `LoginPage` | `/login` | User authentication |
| `SignupPage` | `/signup` | User registration |
| `BookmarksPage` | `/bookmarks` | Saved videos 🔒 |
| `CreateVideoPage` | `/create` | Submit URL for video 🔒 |
| `VideoGenerationLoadingPage` | `/create/generating` | Generation progress 🔒 |
| `VideoPlayerPage` | `/video/:id` | Watch video |
| `CreateAudioPage` | `/audio/create` | Submit URL for audio 🔒 |
| `AudioGenerationLoadingPage` | `/audio/generating` | Audio progress 🔒 |
| `AudioPlayerPage` | `/audio/player` | Listen to audio 🔒 |
| `ProjectReviewPage` | `/review` | Submit GitHub repo 🔒 |
| `ReviewResultsPage` | `/review/results` | View review results 🔒 |
| `InterestsPage` | `/interests` | Select interest categories 🔒 |
| `NewsFeedPage` | `/news` | Personalized AI news feed 🔒 |
| `AssignmentsPage` | `/assignments` | Manage assignments 🔒 |
| `NotificationSettingsPage` | `/settings/notifications` | Notification preferences 🔒 |
| `StudyPlannerPage` | `/study` | Pomodoro timer & stats 🔒 |
| `FlashcardsPage` | `/flashcards` | Flashcard decks 🔒 |
| `ProgressDashboardPage` | `/progress` | XP, achievements, leaderboard 🔒 |
| `AIAssistantPage` | `/assistant` | AI chat interface 🔒 |
| `ResourceLibraryPage` | `/resources` | Links, notes, files 🔒 |

🔒 = Protected route (requires login)

---

## 🔧 Backend Services

| Service | File | Purpose |
|---------|------|---------|
| **AI Service** | `ai.service.js` | OpenAI/Anthropic API integration |
| **Video Service** | `video.service.js` | Manim rendering, FFmpeg processing |
| **Audio Service** | `audio.service.js` | Audio generation orchestration |
| **Dialogue Service** | `dialogue.service.js` | AI dialogue script generation |
| **TTS Service** | `tts.service.js` | Edge TTS voice synthesis |
| **Storage Service** | `storage.service.js` | File storage management |
| **Firecrawl Service** | `firecrawl.service.js` | News feed API integration |
| **Email Service** | `email.service.js` | Resend API for emails |
| **WhatsApp Service** | `whatsapp.service.js` | WhatsApp Business API |
| **Reminders Service** | `reminders.service.js` | Assignment reminder scheduling |

---

## 🎨 Design System

The frontend follows a comprehensive design system:

- **Primary Color**: Indigo (#4f46e5)
- **Font**: Inter
- **Mobile-first** responsive design
- **WCAG 2.1 AA** accessibility standards

Components use predefined Tailwind utilities from the design system documented in `.claude/Skills/student-learning-platform-design-system.md`.

---

## 🧪 Testing

### Manual Testing

```bash
# Backend health check
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Video Generation Test

See `VIDEO_GENERATION_TEST_GUIDE.md` for detailed testing instructions.

---

## 📦 Deployment

### Frontend

Deploy to Vercel or Netlify:
- Build command: `npm run build`
- Output directory: `dist/`

### Backend

Deploy to any Node.js host (Render, Railway, Heroku):
- Requires Redis addon
- Set all environment variables
- Start command: `npm start`
- Worker command: `npm run worker`

---

## 📚 Additional Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Full Product Requirements Document |
| [CLAUDE.md](./CLAUDE.md) | AI assistant context and commands |
| [backend/README.md](./backend/README.md) | Backend-specific documentation |
| [docs/](./docs/) | Technical architecture docs |

---

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use the design system for UI components
3. Add tests for new functionality
4. Update documentation as needed

### File Conventions

- **Components**: PascalCase (`VideoCard.jsx`)
- **Utilities**: camelCase (`auth.js`)
- **Routes**: kebab-case (`auth.routes.js`)

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

**Built with ❤️ for students by students**

</div>
