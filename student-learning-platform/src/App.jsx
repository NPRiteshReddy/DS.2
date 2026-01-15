import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BookmarksPage from './pages/BookmarksPage';
import CreateVideoPage from './pages/CreateVideoPage';
import VideoGenerationLoadingPage from './pages/VideoGenerationLoadingPage';
import ProjectReviewPage from './pages/ProjectReviewPage';
import ReviewResultsPage from './pages/ReviewResultsPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// News Feed Pages
import InterestsPage from './pages/InterestsPage';
import NewsFeedPage from './pages/NewsFeedPage';

// Assignments & Reminders
import AssignmentsPage from './pages/AssignmentsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';

// New Features
import StudyPlannerPage from './pages/StudyPlannerPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ProgressDashboardPage from './pages/ProgressDashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ResourceLibraryPage from './pages/ResourceLibraryPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Bookmarks Route */}
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />

          {/* Create Video Routes */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateVideoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create/generating"
            element={
              <ProtectedRoute>
                <VideoGenerationLoadingPage />
              </ProtectedRoute>
            }
          />

          {/* Video Player Route */}
          <Route path="/video/:id" element={<VideoPlayerPage />} />

          {/* Project Review Routes */}
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <ProjectReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/results"
            element={
              <ProtectedRoute>
                <ReviewResultsPage />
              </ProtectedRoute>
            }
          />

          {/* News Feed Routes */}
          <Route
            path="/interests"
            element={
              <ProtectedRoute>
                <InterestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <NewsFeedPage />
              </ProtectedRoute>
            }
          />

          {/* Assignments Route */}
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Notification Settings */}
          <Route
            path="/settings/notifications"
            element={
              <ProtectedRoute>
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* New Features */}
          <Route
            path="/study"
            element={
              <ProtectedRoute>
                <StudyPlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AIAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ResourceLibraryPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
