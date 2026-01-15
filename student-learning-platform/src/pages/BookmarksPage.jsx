import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bookmark, ArrowLeft, RefreshCw, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import api from '../services/api';

const BookmarksPage = () => {
  const navigate = useNavigate();
  const [bookmarkedVideos, setBookmarkedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Fetch bookmarked videos
  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.videos.getBookmarks();
        setBookmarkedVideos(response.data.videos);
      } catch (err) {
        console.error('Error fetching bookmarks:', err.message);
        setError(err.message);
        setBookmarkedVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleBookmark = async (videoId, isCurrentlyBookmarked) => {
    try {
      // Optimistically remove from list
      setBookmarkedVideos(prev => prev.filter(video => video.id !== videoId));

      // Call API to remove bookmark
      await api.videos.removeBookmark(videoId);
    } catch (err) {
      console.error('Bookmark error:', err.message);
      // Refetch bookmarks on error
      const response = await api.videos.getBookmarks();
      setBookmarkedVideos(response.data.videos);
      alert('Failed to update bookmark. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Learn.AI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/create" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Create Video
              </Link>
              <Link to="/review" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Review Project
              </Link>
              <Link to="/bookmarks" className="text-base font-medium text-primary-600 border-b-2 border-primary-600 pb-1">
                Bookmarks
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">{user.avatar}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              )}
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Create Video
                </Link>
                <Link
                  to="/review"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Review Project
                </Link>
                <Link
                  to="/bookmarks"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-primary-600 bg-primary-50 rounded-lg"
                >
                  Bookmarks
                </Link>
                {user && (
                  <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">{user.avatar}</span>
                      </div>
                      <span className="text-sm text-gray-700">{user.name || user.email}</span>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">
              My Bookmarks
            </h1>
          </div>

          <p className="text-xl text-primary-100">
            {bookmarkedVideos.length} saved video{bookmarkedVideos.length !== 1 ? 's' : ''} for later viewing
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load bookmarks
            </h3>
            <p className="text-base text-gray-500 mb-6 max-w-sm">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : bookmarkedVideos.length > 0 ? (
          // Video Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => {
                  navigate(`/video/${video.id}`);
                }}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookmarks yet
            </h3>
            <p className="text-base text-gray-500 mb-6 max-w-sm">
              Start bookmarking videos you want to watch later. Click the bookmark icon on any video card.
            </p>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors"
            >
              Browse Videos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
