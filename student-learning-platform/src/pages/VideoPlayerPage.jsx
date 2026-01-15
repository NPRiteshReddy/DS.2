import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    GraduationCap, Play, Pause, Volume2, VolumeX, Maximize,
    SkipBack, SkipForward, Settings, Download, Share2,
    Bookmark, BookmarkCheck, Clock, Eye, Calendar, ExternalLink,
    ChevronLeft, FileText, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VideoPlayerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const videoRef = useRef(null);
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch video data
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                const response = await api.videos.getById(id);
                // API returns { success: true, data: { video: {...} } }
                const videoData = response.data?.video || response.data;
                setVideo(videoData);
                setIsBookmarked(videoData.isBookmarked || videoData.is_bookmarked || false);

                // Parse transcript if available
                if (videoData.transcript) {
                    try {
                        const parsed = typeof videoData.transcript === 'string'
                            ? JSON.parse(videoData.transcript)
                            : videoData.transcript;
                        setTranscript(Array.isArray(parsed) ? parsed : []);
                    } catch {
                        setTranscript([]);
                    }
                }

                // Increment view count
                api.videos.incrementView(id).catch(() => { });
            } catch (err) {
                setError(err.message || 'Failed to load video');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchVideo();
    }, [id]);

    // Video player handlers
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const rect = e.target.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (videoRef.current) {
            videoRef.current.currentTime = percent * duration;
        }
    };

    const skip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const handleSpeedChange = (speed) => {
        setPlaybackRate(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        setShowSpeedMenu(false);
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleBookmark = async () => {
        try {
            if (isBookmarked) {
                await api.videos.removeBookmark(id);
            } else {
                await api.videos.bookmark(id);
            }
            setIsBookmarked(!isBookmarked);
        } catch (err) {
            console.error('Bookmark error:', err);
        }
    };

    const handleDownload = async () => {
        if (!video?.video_url || isDownloading) return;

        setIsDownloading(true);
        try {
            // Build the full URL
            const url = video.video_url.startsWith('http')
                ? video.video_url
                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${video.video_url}`;

            // Fetch the video as a blob
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch video');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Create download link and trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            // Sanitize filename - remove invalid characters
            const safeTitle = video.title.replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
            link.download = `${safeTitle}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup blob URL after a short delay
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download video. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xl mb-4">{error || 'Video not found'}</p>
                    <Link to="/dashboard" className="text-primary-400 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Determine if video URL is a local/served file or external
    // Backend serves videos at http://localhost:5000/videos/
    const getVideoUrl = () => {
        const url = video.video_url;
        if (!url) return '';

        // If already a full URL, use as-is
        if (url.startsWith('http')) {
            return url;
        }

        // For relative URLs like /videos/file.mp4, prepend backend URL
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${backendUrl}${url}`;
    };

    const videoSrc = getVideoUrl();

    console.log('Video URL:', video.video_url, '-> Resolved:', videoSrc);

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navigation */}
            <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                                <span>Back</span>
                            </Link>
                            <Link to="/" className="flex items-center gap-2">
                                <GraduationCap className="w-7 h-7 text-primary-500" />
                                <span className="text-lg font-bold text-white">Learn.AI</span>
                            </Link>
                        </div>

                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white">{user.avatar}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Video Player */}
                        <div className="lg:col-span-2">
                            <div className="bg-black rounded-xl overflow-hidden relative group">
                                {/* Video Element */}
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    className="w-full aspect-video"
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onClick={togglePlay}
                                    poster={video.thumbnail}
                                />

                                {/* Play Overlay */}
                                {!isPlaying && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                                        onClick={togglePlay}
                                    >
                                        <div className="w-20 h-20 bg-primary-600/90 rounded-full flex items-center justify-center
                                  transform transition-transform hover:scale-110">
                                            <Play className="w-10 h-10 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent 
                              p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Progress Bar */}
                                    <div
                                        className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer"
                                        onClick={handleSeek}
                                    >
                                        <div
                                            className="h-full bg-primary-500 rounded-full relative"
                                            style={{ width: `${(currentTime / duration) * 100}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 
                                    bg-primary-500 rounded-full shadow" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Play/Pause */}
                                            <button onClick={togglePlay} className="text-white hover:text-primary-400">
                                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                            </button>

                                            {/* Skip */}
                                            <button onClick={() => skip(-10)} className="text-white hover:text-primary-400">
                                                <SkipBack className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => skip(10)} className="text-white hover:text-primary-400">
                                                <SkipForward className="w-5 h-5" />
                                            </button>

                                            {/* Volume */}
                                            <div className="flex items-center gap-2">
                                                <button onClick={toggleMute} className="text-white hover:text-primary-400">
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={isMuted ? 0 : volume}
                                                    onChange={handleVolumeChange}
                                                    className="w-20 accent-primary-500"
                                                />
                                            </div>

                                            {/* Time */}
                                            <span className="text-white text-sm">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Speed */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                                    className="text-white hover:text-primary-400 flex items-center gap-1"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                    <span className="text-sm">{playbackRate}x</span>
                                                </button>
                                                {showSpeedMenu && (
                                                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg py-2">
                                                        {speedOptions.map(speed => (
                                                            <button
                                                                key={speed}
                                                                onClick={() => handleSpeedChange(speed)}
                                                                className={`block w-full px-4 py-1 text-sm text-left hover:bg-gray-700
                                          ${playbackRate === speed ? 'text-primary-400' : 'text-white'}`}
                                                            >
                                                                {speed}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Fullscreen */}
                                            <button onClick={toggleFullscreen} className="text-white hover:text-primary-400">
                                                <Maximize className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Video Info */}
                            <div className="mt-6">
                                <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
                                <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {video.views || 0} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {video.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(video.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded text-xs">
                                        {video.category}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={handleBookmark}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                              ${isBookmarked
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                                    >
                                        {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                        {isBookmarked ? 'Saved' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                                            ${isDownloading
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Download
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowTranscript(!showTranscript)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                              ${showTranscript
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                                    >
                                        <FileText className="w-5 h-5" />
                                        Transcript
                                    </button>
                                </div>

                                {/* Description */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-gray-300">{video.description}</p>
                                    {video.source_url && (
                                        <a
                                            href={video.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-primary-400 hover:underline mt-3 text-sm"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View Original Source
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Transcript or Slides */}
                        <div className="lg:col-span-1">
                            {showTranscript && transcript.length > 0 ? (
                                <div className="bg-gray-800 rounded-lg p-4 sticky top-20">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-primary-400" />
                                        Video Slides
                                    </h3>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                        {transcript.map((slide, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-6 h-6 bg-primary-600 rounded text-white text-xs 
                                         flex items-center justify-center font-medium">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-white font-medium text-sm line-clamp-1">
                                                        {slide.title || slide.heading || `Slide ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-xs line-clamp-2 ml-8">
                                                    {slide.narration || slide.content || ''}
                                                </p>
                                                {slide.duration && (
                                                    <span className="text-gray-500 text-xs ml-8">
                                                        {slide.duration}s
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-800 rounded-lg p-6 text-center">
                                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-white font-medium mb-2">Video Transcript</h3>
                                    <p className="text-gray-400 text-sm">
                                        Click the "Transcript" button to view the video slides and narration.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerPage;
