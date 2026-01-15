const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
const signup = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, password } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate avatar initials (first letter of first and last name)
  const nameParts = name.trim().split(' ');
  const avatar = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();

  // Create user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert([
      {
        name,
        email,
        password: hashedPassword,
        avatar
      }
    ])
    .select('id, name, email, avatar, created_at')
    .single();

  if (userError) {
    console.error('User creation error:', userError);
    throw new AppError('Failed to create user', 500);
  }

  // Create user_stats entry
  const { error: statsError } = await supabase
    .from('user_stats')
    .insert([
      {
        user_id: user.id,
        videos_generated: 0,
        reviews_completed: 0,
        videos_watched: 0,
        bookmarks_count: 0
      }
    ]);

  if (statsError) {
    console.error('Stats creation error:', statsError);
    // Don't fail signup if stats creation fails
  }

  // Generate JWT token
  const token = generateToken(user);

  // Return user and token
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joined: user.created_at
      },
      token
    }
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password, avatar, created_at')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Get user stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('videos_generated, reviews_completed, videos_watched, bookmarks_count')
    .eq('user_id', user.id)
    .single();

  // Generate JWT token
  const token = generateToken(user);

  // Return user and token (exclude password)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joined: user.created_at,
        stats: stats || {
          videosGenerated: 0,
          reviewsCompleted: 0,
          videosWatched: 0,
          bookmarks: 0
        }
      },
      token
    }
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res, next) => {
  // User is already attached to req by auth middleware
  const userId = req.userId;

  // Fetch user with stats
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, avatar, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('User not found', 404);
  }

  // Get user stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('videos_generated, reviews_completed, videos_watched, bookmarks_count')
    .eq('user_id', userId)
    .single();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joined: user.created_at,
        stats: {
          videosGenerated: stats?.videos_generated || 0,
          reviewsCompleted: stats?.reviews_completed || 0,
          videosWatched: stats?.videos_watched || 0,
          bookmarks: stats?.bookmarks_count || 0
        }
      }
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
const logout = asyncHandler(async (req, res) => {
  // Logout is handled client-side by removing the token
  // This endpoint is just for consistency
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @route   POST /api/auth/google-callback
 * @desc    Handle Google OAuth callback and exchange for JWT
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res, next) => {
  const { accessToken, user: googleUser } = req.body;

  if (!accessToken || !googleUser || !googleUser.email) {
    throw new AppError('Invalid Google authentication data', 400);
  }

  const { id: googleId, email, name, avatar_url } = googleUser;

  // Check if user exists by google_id or email
  let { data: existingUser } = await supabase
    .from('users')
    .select('id, name, email, avatar, google_id, created_at')
    .or(`google_id.eq.${googleId},email.eq.${email}`)
    .single();

  let user;

  if (existingUser) {
    // Update google_id if not set (user previously signed up with email)
    if (!existingUser.google_id) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ google_id: googleId })
        .eq('id', existingUser.id)
        .select('id, name, email, avatar, created_at')
        .single();

      if (updateError) {
        console.error('Error updating google_id:', updateError);
      }
      user = updatedUser || existingUser;
    } else {
      user = existingUser;
    }
  } else {
    // Create new user
    const avatar = name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : email.substring(0, 2).toUpperCase();

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        name: name || email.split('@')[0],
        email,
        google_id: googleId,
        avatar,
        password: null // No password for Google users
      }])
      .select('id, name, email, avatar, created_at')
      .single();

    if (createError) {
      console.error('Error creating Google user:', createError);
      throw new AppError('Failed to create user account', 500);
    }

    user = newUser;

    // Create user_stats entry for new user
    await supabase
      .from('user_stats')
      .insert([{
        user_id: user.id,
        videos_generated: 0,
        reviews_completed: 0,
        videos_watched: 0,
        bookmarks_count: 0
      }]);
  }

  // Get user stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('videos_generated, reviews_completed, videos_watched, bookmarks_count')
    .eq('user_id', user.id)
    .single();

  // Generate JWT token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Google authentication successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joined: user.created_at,
        stats: stats || {
          videosGenerated: 0,
          reviewsCompleted: 0,
          videosWatched: 0,
          bookmarks: 0
        }
      },
      token
    }
  });
});

module.exports = {
  signup,
  login,
  getCurrentUser,
  logout,
  googleCallback
};
