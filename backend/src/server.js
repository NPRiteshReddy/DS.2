const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/videos.routes');
const generateRoutes = require('./routes/generate.routes');
const audioRoutes = require('./routes/audio.routes');

const app = express();

// CORS configuration - apply before static files
// Allow both localhost:5173 and localhost:5174 for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve static files from public directory (for audio and video files)
// These need to be served with proper CORS headers for media playback
app.use('/audio', express.static(path.join(__dirname, '..', 'public', 'audio'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (path.endsWith('.mp3')) {
      res.set('Content-Type', 'audio/mpeg');
    }
  }
}));

app.use('/videos', express.static(path.join(__dirname, '..', 'public', 'videos'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    }
  }
}));

// Security middleware (after static files to not interfere with media)

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/audio', audioRoutes);

// Review routes (to be added later)
// app.use('/api/reviews', reviewRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    await testConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ Server started successfully');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🎨 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log('');
      console.log('📋 Available routes:');
      console.log('');
      console.log('   Authentication:');
      console.log('   POST   /api/auth/signup          - User registration');
      console.log('   POST   /api/auth/login           - User login');
      console.log('   GET    /api/auth/me              - Get current user');
      console.log('   POST   /api/auth/logout          - Logout');
      console.log('');
      console.log('   Videos:');
      console.log('   GET    /api/videos               - Get all videos');
      console.log('   GET    /api/videos/search        - Search videos');
      console.log('   GET    /api/videos/my-videos     - Get user\'s videos (auth)');
      console.log('   GET    /api/videos/bookmarks     - Get bookmarked videos (auth)');
      console.log('   GET    /api/videos/:id           - Get single video');
      console.log('   POST   /api/videos/:id/bookmark  - Bookmark video (auth)');
      console.log('   DELETE /api/videos/:id/bookmark  - Remove bookmark (auth)');
      console.log('   POST   /api/videos/:id/view      - Increment view count');
      console.log('');
      console.log('   Video Generation:');
      console.log('   POST   /api/generate/video       - Start video generation (auth)');
      console.log('   GET    /api/generate/video/:id/status - Check generation status (auth)');
      console.log('   DELETE /api/generate/video/:id   - Cancel generation (auth)');
      console.log('   GET    /api/generate/my-jobs     - Get user\'s jobs (auth)');
      console.log('');
      console.log('   Health:');
      console.log('   GET    /health                   - Health check');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
