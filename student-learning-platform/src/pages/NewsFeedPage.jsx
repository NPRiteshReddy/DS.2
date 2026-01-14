import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Newspaper,
    RefreshCw,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    Video,
    Headphones,
    Settings,
    Clock,
    Globe,
    Sparkles,
    ChevronRight,
    Filter,
    Search
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NewsFeedPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [articles, setArticles] = useState([]);
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [needsInterests, setNeedsInterests] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchNewsFeed();
    }, []);

    const fetchNewsFeed = async (refresh = false) => {
        try {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            const response = await axios.get(`${API_URL}/news${refresh ? '?refresh=true' : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                if (response.data.data.needsInterests) {
                    setNeedsInterests(true);
                } else {
                    setArticles(response.data.data.articles);
                    setInterests(response.data.data.interests || []);
                    setNeedsInterests(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError('Failed to load news feed. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchNewsFeed(true);
    };

    const toggleSave = async (articleId) => {
        try {
            const response = await axios.post(
                `${API_URL}/news/${articleId}/save`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setArticles(prev => prev.map(article =>
                    article.id === articleId
                        ? { ...article, isSaved: response.data.data.isSaved }
                        : article
                ));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    const filteredArticles = articles.filter(article => {
        // Filter by category
        if (activeFilter !== 'all' && article.category !== activeFilter) {
            return false;
        }
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                article.title?.toLowerCase().includes(query) ||
                article.description?.toLowerCase().includes(query) ||
                article.source?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Needs interests setup
    if (needsInterests) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Set Up Your Personalized Feed
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Tell us what topics interest you to get AI news tailored just for you.
                    </p>
                    <button
                        onClick={() => navigate('/interests')}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Select Interests
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading your personalized feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Newspaper className="w-6 h-6 text-indigo-400" />
                            <h1 className="text-2xl font-bold text-white">AI News Feed</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <Link
                                to="/interests"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Interests
                            </Link>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Category Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            {interests.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => setActiveFilter(interest)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === interest
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-6xl mx-auto px-4 mt-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {error}
                    </div>
                </div>
            )}

            {/* Articles Grid */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                        <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">
                            {searchQuery ? 'No matching articles' : 'No articles yet'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Click refresh to fetch the latest AI news'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredArticles.map((article, index) => (
                            <article
                                key={article.url || index}
                                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group"
                            >
                                {/* Image */}
                                {article.imageUrl && (
                                    <div className="aspect-video bg-gray-700 overflow-hidden">
                                        <img
                                            src={article.imageUrl}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}

                                <div className="p-5">
                                    {/* Category & Time */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                                            {article.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(article.publishedAt)}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                                        {article.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                        {article.description}
                                    </p>

                                    {/* Source */}
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <Globe className="w-3 h-3" />
                                        {article.source}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Read
                                            </a>
                                            <button
                                                onClick={() => toggleSave(article.id)}
                                                className={`flex items-center gap-1 text-sm transition-colors ${article.isSaved
                                                        ? 'text-indigo-400'
                                                        : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {article.isSaved ? (
                                                    <BookmarkCheck className="w-4 h-4" />
                                                ) : (
                                                    <Bookmark className="w-4 h-4" />
                                                )}
                                                Save
                                            </button>
                                        </div>

                                        {/* Generate Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/create?url=${encodeURIComponent(article.url)}`}
                                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                <Video className="w-3 h-3" />
                                                Video
                                            </Link>
                                            <Link
                                                to={`/audio/create?url=${encodeURIComponent(article.url)}`}
                                                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                <Headphones className="w-3 h-3" />
                                                Audio
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsFeedPage;
