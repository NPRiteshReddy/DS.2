import { Video, Clock, Calendar, Eye, Bookmark, BookmarkCheck, Play } from 'lucide-react';

const VideoCard = ({ video, onClick, onBookmark }) => {
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'AI/ML':
        return 'bg-purple-100 text-purple-700';
      case 'Data Science':
        return 'bg-cyan-100 text-cyan-700';
      case 'Research':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden
               hover:shadow-lg hover:border-primary-200
               transition-all duration-200 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail.startsWith('http') ? video.thumbnail : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${video.thumbnail}`}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentElement.querySelector('.fallback-thumbnail')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center fallback-thumbnail ${video.thumbnail ? 'hidden absolute inset-0' : ''}`}>
          <Video className="w-16 h-16 text-primary-600 opacity-50" />
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30
                      transition-all flex items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100
                        transition-all">
            <Play className="w-6 h-6 text-primary-600 ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-gray-900 bg-opacity-80
                      text-white text-xs font-semibold rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>

        {/* Category Badge */}
        <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeClass(video.category)}`}>
          {video.category}
        </div>

        {/* Bookmark Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onBookmark) {
              onBookmark(video.id, video.isBookmarked);
            }
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all
                   ${video.isBookmarked
                     ? 'bg-primary-600 opacity-100'
                     : 'bg-white bg-opacity-90 opacity-0 group-hover:opacity-100'
                   } hover:bg-opacity-100 hover:scale-110`}
          title={video.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {video.isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-white" />
          ) : (
            <Bookmark className="w-4 h-4 text-gray-700" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2
                     group-hover:text-primary-600 transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {video.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {video.publishedAt}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {video.views.toLocaleString()} views
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Source: {video.source}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
