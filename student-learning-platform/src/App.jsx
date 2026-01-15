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

// AI Features
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

          {/* AI Assistant */}
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AIAssistantPage />
              </ProtectedRoute>
            }
          />

          {/* Resource Library */}
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
