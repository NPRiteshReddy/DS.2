/**
 * Code Review Routes
 * API endpoints for GitHub repository code reviews
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  submitReview,
  getReviewStatus,
  getReviewResults,
  getMyReviews,
  downloadReviewPDF
} = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/reviews
 * Submit a GitHub repository for code review
 * Requires authentication
 */
router.post(
  '/',
  authenticate,
  [
    body('repoUrl')
      .notEmpty()
      .withMessage('Repository URL is required')
      .isURL()
      .withMessage('Must be a valid URL')
      .matches(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/)
      .withMessage('Must be a valid GitHub repository URL (https://github.com/owner/repo)')
  ],
  validate,
  submitReview
);

/**
 * GET /api/reviews/my-reviews
 * Get user's review history
 * Requires authentication
 */
router.get('/my-reviews', authenticate, getMyReviews);

/**
 * GET /api/reviews/:reviewId/status
 * Check review job status
 * Requires authentication
 */
router.get(
  '/:reviewId/status',
  authenticate,
  [
    param('reviewId')
      .notEmpty()
      .withMessage('Review ID is required')
  ],
  validate,
  getReviewStatus
);

/**
 * GET /api/reviews/:reviewId/download
 * Download review as PDF
 * Requires authentication
 */
router.get(
  '/:reviewId/download',
  authenticate,
  [
    param('reviewId')
      .notEmpty()
      .withMessage('Review ID is required')
  ],
  validate,
  downloadReviewPDF
);

/**
 * GET /api/reviews/:reviewId
 * Get full review results
 * Requires authentication
 */
router.get(
  '/:reviewId',
  authenticate,
  [
    param('reviewId')
      .notEmpty()
      .withMessage('Review ID is required')
  ],
  validate,
  getReviewResults
);

module.exports = router;
