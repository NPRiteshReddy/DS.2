import axios from 'axios';

// API base URL - change this in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds
});

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Return error message from server
      const errorMessage = data?.error || data?.message || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// API service object
const api = {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth: {
    /**
     * Register a new user
     * @param {string} name - User's full name
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} Response with user data and token
     */
    signup: async (name, email, password) => {
      const response = await apiClient.post('/auth/signup', {
        name,
        email,
        password
      });
      return response.data;
    },

    /**
     * Login user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} Response with user data and token
     */
    login: async (email, password) => {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      return response.data;
    },

    /**
     * Logout user (client-side only)
     * @returns {Promise} Response
     */
    logout: async () => {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    },

    /**
     * Get current authenticated user
     * @returns {Promise} Response with user data
     */
    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },

    /**
     * Handle Google OAuth callback
     * @param {Object} data - Google auth data
     * @param {string} data.accessToken - Supabase access token
     * @param {Object} data.user - Google user data
     * @returns {Promise} Response with user data and JWT token
     */
    googleCallback: async (data) => {
      const response = await apiClient.post('/auth/google-callback', data);
      return response.data;
    }
  },

  // ============================================================================
  // VIDEOS
  // ============================================================================
  videos: {
    /**
     * Get all videos with optional filtering and pagination
     * @param {Object} params - Query parameters
     * @param {string} params.category - Filter by category (AI/ML, Data Science, Research)
     * @param {string} params.search - Search query
     * @param {number} params.page - Page number
     * @param {number} params.limit - Results per page
     * @returns {Promise} Response with videos array and pagination
     */
    getAll: async (params = {}) => {
      const response = await apiClient.get('/videos', { params });
      return response.data;
    },

    /**
     * Search videos by query
     * @param {string} query - Search query
     * @param {string} category - Optional category filter
     * @returns {Promise} Response with matching videos
     */
    search: async (query, category = null) => {
      const params = { q: query };
      if (category && category !== 'All') {
        params.category = category;
      }
      const response = await apiClient.get('/videos/search', { params });
      return response.data;
    },

    /**
     * Get user's generated videos
     * @returns {Promise} Response with user's videos
     */
    getMyVideos: async () => {
      const response = await apiClient.get('/videos/my-videos');
      return response.data;
    },

    /**
     * Get user's bookmarked videos
     * @returns {Promise} Response with bookmarked videos
     */
    getBookmarks: async () => {
      const response = await apiClient.get('/videos/bookmarks');
      return response.data;
    },

    /**
     * Get single video by ID
     * @param {string} id - Video ID
     * @returns {Promise} Response with video data
     */
    getById: async (id) => {
      const response = await apiClient.get(`/videos/${id}`);
      return response.data;
    },

    /**
     * Bookmark a video
     * @param {string} id - Video ID
     * @returns {Promise} Response
     */
    bookmark: async (id) => {
      const response = await apiClient.post(`/videos/${id}/bookmark`);
      return response.data;
    },

    /**
     * Remove bookmark from a video
     * @param {string} id - Video ID
     * @returns {Promise} Response
     */
    removeBookmark: async (id) => {
      const response = await apiClient.delete(`/videos/${id}/bookmark`);
      return response.data;
    },

    /**
     * Increment view count for a video
     * @param {string} id - Video ID
     * @param {number} watchDuration - Duration watched in seconds (optional)
     * @returns {Promise} Response with new view count
     */
    incrementView: async (id, watchDuration = 0) => {
      const response = await apiClient.post(`/videos/${id}/view`, {
        watchDuration
      });
      return response.data;
    }
  },

  // ============================================================================
  // VIDEO GENERATION
  // ============================================================================
  generate: {
    /**
     * Start video generation from URL
     * @param {string} url - Source URL (article, paper, etc.)
     * @returns {Promise} Response with job ID
     */
    startGeneration: async (url) => {
      const response = await apiClient.post('/generate/video', { url });
      return response.data;
    },

    /**
     * Check generation status
     * @param {string} jobId - Job ID
     * @returns {Promise} Response with job status and progress
     */
    checkStatus: async (jobId) => {
      const response = await apiClient.get(`/generate/video/${jobId}/status`);
      return response.data;
    },

    /**
     * Cancel video generation
     * @param {string} jobId - Job ID
     * @returns {Promise} Response
     */
    cancel: async (jobId) => {
      const response = await apiClient.delete(`/generate/video/${jobId}`);
      return response.data;
    },

    /**
     * Get user's generation jobs
     * @returns {Promise} Response with user's jobs
     */
    getMyJobs: async () => {
      const response = await apiClient.get('/generate/my-jobs');
      return response.data;
    }
  },

  // ============================================================================
  // CODE REVIEWS
  // ============================================================================
  reviews: {
    /**
     * Submit GitHub repository for review
     * @param {string} repoUrl - GitHub repository URL
     * @returns {Promise} Response with review ID
     */
    submit: async (repoUrl) => {
      const response = await apiClient.post('/reviews', { repoUrl });
      return response.data;
    },

    /**
     * Check review status
     * @param {string} reviewId - Review ID
     * @returns {Promise} Response with review status
     */
    checkStatus: async (reviewId) => {
      const response = await apiClient.get(`/reviews/${reviewId}/status`);
      return response.data;
    },

    /**
     * Get review results
     * @param {string} reviewId - Review ID
     * @returns {Promise} Response with review data
     */
    getResults: async (reviewId) => {
      const response = await apiClient.get(`/reviews/${reviewId}`);
      return response.data;
    },

    /**
     * Download review PDF
     * @param {string} reviewId - Review ID
     * @returns {Promise} Response with PDF file
     */
    downloadPDF: async (reviewId) => {
      const response = await apiClient.get(`/reviews/${reviewId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },

    /**
     * Get user's review history
     * @returns {Promise} Response with user's reviews
     */
    getMyReviews: async () => {
      const response = await apiClient.get('/reviews/my-reviews');
      return response.data;
    }
  }
};

export default api;
