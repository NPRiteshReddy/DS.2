import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Search, Bookmark, ChevronDown, RefreshCw,
  Filter, Calendar, X, Check, Menu, BookOpen, Layers,
  BarChart2, MessageSquare, Library
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import { categories } from '../data/mockCategories';
import api from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user, logout } = useAuth();

  // Filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState('all');
  const filterRef = useRef(null);
  const dateRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' }
  ];

  // Date range options
  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch videos from API based on category, search query, and filters
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let response;

        // If there's a search query, use search endpoint
        if (debouncedQuery.trim()) {
          response = await api.videos.search(debouncedQuery, activeCategory);
        } else {
          // Otherwise, get all videos with category filter
          const params = {
            category: activeCategory,
            page: 1,
            limit: 24,
            sortBy,
            dateRange
          };
          response = await api.videos.getAll(params);
        }

        let videos = response.data.videos || [];

        // Client-side sorting (as backup if backend doesn't support it)
        videos = sortVideos(videos, sortBy);

        // Client-side date filtering (as backup if backend doesn't support it)
        videos = filterByDate(videos, dateRange);

        setFilteredVideos(videos);
        setHasMore(response.data.pagination?.totalPages > 1 || false);
        setPage(1);
      } catch (err) {
        console.error('Error fetching videos:', err.message);
        setError(err.message);
        setFilteredVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [activeCategory, debouncedQuery, sortBy, dateRange]);

  // Sort videos client-side
  const sortVideos = (videos, sort) => {
    const sorted = [...videos];
    switch (sort) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'most_viewed':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'title_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  };

  // Filter videos by date range client-side
  const filterByDate = (videos, range) => {
    if (range === 'all') return videos;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return videos.filter(video => {
      const videoDate = new Date(video.created_at);
      switch (range) {
        case 'today':
          return videoDate >= startOfDay;
        case 'week':
          const weekAgo = new Date(startOfDay);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return videoDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(startOfDay);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return videoDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(startOfDay);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return videoDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setSortBy('newest');
    setDateRange('all');
  };

  // Check if any filters are active
  const hasActiveFilters = sortBy !== 'newest' || dateRange !== 'all';

  const loadMore = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const params = {
        category: activeCategory,
        page: page + 1,
        limit: 24
      };

      const response = await api.videos.getAll(params);
      setFilteredVideos(prev => [...prev, ...response.data.videos]);
      setPage(page + 1);
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error loading more videos:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async (videoId, isCurrentlyBookmarked) => {
    // Must be authenticated to bookmark
    if (!user) {
      alert('Please login to bookmark videos');
      return;
    }

    try {
      // Optimistically update UI
      setFilteredVideos(prev =>
        prev.map(video =>
          video.id === videoId
            ? { ...video, isBookmarked: !isCurrentlyBookmarked }
            : video
        )
      );

      // Call API
      if (isCurrentlyBookmarked) {
        await api.videos.removeBookmark(videoId);
      } else {
        await api.videos.bookmark(videoId);
      }
    } catch (err) {
      console.error('Bookmark error:', err.message);
      // Revert optimistic update on error
      setFilteredVideos(prev =>
        prev.map(video =>
          video.id === videoId
            ? { ...video, isBookmarked: isCurrentlyBookmarked }
            : video
        )
      );
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
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-base font-medium text-primary-600 border-b-2 border-primary-600 pb-1">
                Dashboard
              </Link>
              <Link to="/create" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Create Video
              </Link>
              <Link to="/review" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Review Project
              </Link>
              <Link to="/study" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Study
              </Link>
              <Link to="/flashcards" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                <Layers className="w-4 h-4" />
                Flashcards
              </Link>
              <Link to="/progress" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                <BarChart2 className="w-4 h-4" />
                Progress
              </Link>
              <Link to="/assistant" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Assistant
              </Link>
              <Link to="/resources" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors flex items-center gap-1">
                <Library className="w-4 h-4" />
                Resources
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Link
                to="/bookmarks"
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
                title="View Bookmarks"
              >
                <Bookmark className="w-5 h-5" />
                {user && <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full" />}
              </Link>
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
                  className="px-4 py-2 text-base font-medium text-primary-600 bg-primary-50 rounded-lg"
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
                  to="/study"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Study Planner
                </Link>
                <Link
                  to="/flashcards"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Flashcards
                </Link>
                <Link
                  to="/progress"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4" />
                  Progress Dashboard
                </Link>
                <Link
                  to="/assistant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Assistant
                </Link>
                <Link
                  to="/resources"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Library className="w-4 h-4" />
                  Resource Library
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

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-3">
              Discover Educational Content
            </h1>
            <p className="text-xl text-primary-100">
              Browse 100+ curated videos on AI/ML, Data Science, and Research Papers.
              New content added weekly from trusted sources.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, papers, or concepts..."
                className="w-full px-6 py-4 pl-12 bg-white bg-opacity-20 backdrop-blur-sm
                         border-2 border-white border-opacity-30 rounded-lg
                         text-white placeholder:text-primary-200
                         focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                         transition-all"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-primary-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8" aria-label="Categories">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-1 py-4 text-base font-medium border-b-2 -mb-px
                  transition-all duration-200
                  ${activeCategory === category.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Sort/Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setShowFilterDropdown(!showFilterDropdown);
                  setShowDateDropdown(false);
                }}
                className={`px-4 py-2 bg-white border rounded-lg
                           text-sm font-medium transition-colors
                           flex items-center gap-2
                           ${sortBy !== 'newest'
                             ? 'border-primary-500 text-primary-600 bg-primary-50'
                             : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                           }`}
              >
                <Filter className="w-4 h-4" />
                {sortOptions.find(o => o.value === sortBy)?.label || 'Sort By'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between
                                   ${sortBy === option.value
                                     ? 'bg-primary-50 text-primary-600'
                                     : 'text-gray-700 hover:bg-gray-50'
                                   }`}
                      >
                        {option.label}
                        {sortBy === option.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Dropdown */}
            <div className="relative" ref={dateRef}>
              <button
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown);
                  setShowFilterDropdown(false);
                }}
                className={`px-4 py-2 bg-white border rounded-lg
                           text-sm font-medium transition-colors
                           flex items-center gap-2
                           ${dateRange !== 'all'
                             ? 'border-primary-500 text-primary-600 bg-primary-50'
                             : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                           }`}
              >
                <Calendar className="w-4 h-4" />
                {dateOptions.find(o => o.value === dateRange)?.label || 'Date Range'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDateDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {dateOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateRange(option.value);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between
                                   ${dateRange === option.value
                                     ? 'bg-primary-50 text-primary-600'
                                     : 'text-gray-700 hover:bg-gray-50'
                                   }`}
                      >
                        {option.label}
                        {dateRange === option.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700
                         flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{filteredVideos.length} videos found</span>
          </div>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          // Skeleton Loaders
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
        ) : filteredVideos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => {
                  // Navigate to video player page
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
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No videos found
            </h3>
            <p className="text-base text-gray-500 mb-6 max-w-sm">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {filteredVideos.length > 0 && hasMore && !debouncedQuery && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-8 py-3 bg-white border-2 border-gray-300 rounded-lg
                       text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400
                       transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Load More Videos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
