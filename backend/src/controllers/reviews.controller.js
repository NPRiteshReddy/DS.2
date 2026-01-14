/**
 * Code Review Controller
 * Handles code review API endpoints
 */

const { supabase } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { nanoid } = require('nanoid');
const { codeReviewQueue } = require('../jobs/queue');
const PDFDocument = require('pdfkit');

// Daily review limit
const DAILY_REVIEW_LIMIT = 3;

/**
 * Submit a GitHub repository for code review
 * POST /api/reviews
 */
const submitReview = asyncHandler(async (req, res) => {
  const { repoUrl } = req.body;
  const userId = req.userId;

  // Validate GitHub URL
  const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
  if (!repoUrl || !githubRegex.test(repoUrl)) {
    throw new AppError('Invalid GitHub repository URL. Format: https://github.com/owner/repo', 400);
  }

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];

  const { data: limits } = await supabase
    .from('daily_limits')
    .select('reviews_completed')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (limits && limits.reviews_completed >= DAILY_REVIEW_LIMIT) {
    throw new AppError(`Daily review limit reached (${DAILY_REVIEW_LIMIT} per day). Try again tomorrow.`, 429);
  }

  // Create review record
  const reviewId = `review_${nanoid(12)}`;
  const repoName = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');

  const { error: insertError } = await supabase
    .from('code_reviews')
    .insert([{
      id: reviewId,
      user_id: userId,
      repo_url: repoUrl,
      repo_name: repoName,
      status: 'processing',
      created_at: new Date().toISOString()
    }]);

  if (insertError) {
    console.error('Failed to create review record:', insertError);
    throw new AppError('Failed to start code review', 500);
  }

  // Queue the review job
  try {
    await codeReviewQueue.add(
      { reviewId, userId, repoUrl, repoName },
      { jobId: reviewId }
    );
    console.log(`Code review job queued: ${reviewId}`);
  } catch (queueError) {
    // Clean up if queue fails
    await supabase.from('code_reviews').delete().eq('id', reviewId);
    throw new AppError('Failed to queue code review job', 500);
  }

  res.status(201).json({
    success: true,
    data: {
      reviewId,
      status: 'processing',
      message: 'Code review started. This usually takes 1-3 minutes.'
    }
  });
});

/**
 * Get review job status
 * GET /api/reviews/:reviewId/status
 */
const getReviewStatus = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  const { data: review, error } = await supabase
    .from('code_reviews')
    .select('id, status, quality_score, error, created_at, completed_at')
    .eq('id', reviewId)
    .eq('user_id', userId)
    .single();

  if (error || !review) {
    throw new AppError('Review not found', 404);
  }

  // Calculate progress based on status
  let progress = { step: 1, message: 'Starting review...' };
  if (review.status === 'processing') {
    progress = { step: 2, message: 'Analyzing repository...' };
  } else if (review.status === 'completed') {
    progress = { step: 3, message: 'Review complete!' };
  } else if (review.status === 'failed') {
    progress = { step: 0, message: review.error || 'Review failed' };
  }

  res.json({
    success: true,
    data: {
      reviewId: review.id,
      status: review.status,
      qualityScore: review.quality_score,
      progress,
      createdAt: review.created_at,
      completedAt: review.completed_at
    }
  });
});

/**
 * Get full review results
 * GET /api/reviews/:reviewId
 */
const getReviewResults = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  const { data: review, error } = await supabase
    .from('code_reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('user_id', userId)
    .single();

  if (error || !review) {
    throw new AppError('Review not found', 404);
  }

  if (review.status !== 'completed') {
    throw new AppError(`Review is ${review.status}. Please wait for completion.`, 400);
  }

  res.json({
    success: true,
    data: {
      reviewId: review.id,
      repoUrl: review.repo_url,
      repoName: review.repo_name,
      status: review.status,
      qualityScore: review.quality_score,
      strengths: review.strengths || [],
      improvements: review.improvements || [],
      keySuggestions: review.key_suggestions || [],
      fullReview: review.full_review,
      metrics: review.metrics || {},
      createdAt: review.created_at,
      completedAt: review.completed_at
    }
  });
});

/**
 * Get user's review history
 * GET /api/reviews/my-reviews
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const { data: reviews, error } = await supabase
    .from('code_reviews')
    .select('id, repo_url, repo_name, status, quality_score, created_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError('Failed to fetch review history', 500);
  }

  res.json({
    success: true,
    data: {
      reviews: reviews || [],
      count: reviews?.length || 0
    }
  });
});

/**
 * Download review as PDF
 * GET /api/reviews/:reviewId/download
 */
const downloadReviewPDF = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  const { data: review, error } = await supabase
    .from('code_reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('user_id', userId)
    .single();

  if (error || !review) {
    throw new AppError('Review not found', 404);
  }

  if (review.status !== 'completed') {
    throw new AppError(`Review is ${review.status}. Please wait for completion.`, 400);
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  const filename = `code-review-${review.repo_name.replace('/', '-')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe PDF to response
  doc.pipe(res);

  // Colors
  const primaryColor = '#4f46e5';
  const successColor = '#16a34a';
  const warningColor = '#d97706';
  const grayColor = '#374151';
  const lightGray = '#6b7280';

  // Helper function to get score color
  const getScoreColor = (score) => {
    if (score >= 8) return successColor;
    if (score >= 6) return warningColor;
    return '#dc2626';
  };

  // Helper function to get score label
  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  // ===== HEADER =====
  doc
    .fontSize(28)
    .fillColor(primaryColor)
    .text('Code Review Report', { align: 'center' });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor(lightGray)
    .text('Generated by LearnAI', { align: 'center' });

  doc.moveDown(2);

  // ===== REPOSITORY INFO =====
  doc
    .fontSize(14)
    .fillColor(grayColor)
    .text('Repository:', { continued: true })
    .fillColor(primaryColor)
    .text(` ${review.repo_name}`);

  doc.moveDown(0.3);

  doc
    .fontSize(11)
    .fillColor(lightGray)
    .text(`URL: ${review.repo_url}`);

  doc.moveDown(0.3);

  const reviewDate = review.completed_at
    ? new Date(review.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  doc.text(`Review Date: ${reviewDate}`);

  doc.moveDown(2);

  // ===== QUALITY SCORE =====
  const score = review.quality_score || 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  doc
    .fontSize(18)
    .fillColor(grayColor)
    .text('Quality Score');

  doc.moveDown(0.5);

  // Score display
  doc
    .fontSize(48)
    .fillColor(scoreColor)
    .text(`${score}/10`, { continued: true })
    .fontSize(16)
    .fillColor(lightGray)
    .text(`  ${scoreLabel}`, { baseline: 'middle' });

  doc.moveDown(2);

  // ===== KEY SUGGESTIONS =====
  const keySuggestions = review.key_suggestions || [];
  if (keySuggestions.length > 0) {
    doc
      .fontSize(18)
      .fillColor(primaryColor)
      .text('Key Suggestions');

    doc.moveDown(0.5);

    keySuggestions.forEach((suggestion, idx) => {
      doc
        .fontSize(11)
        .fillColor(grayColor)
        .text(`${idx + 1}. ${suggestion}`, { indent: 10 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  // ===== STRENGTHS =====
  const strengths = review.strengths || [];
  if (strengths.length > 0) {
    doc
      .fontSize(18)
      .fillColor(successColor)
      .text('Strengths');

    doc.moveDown(0.5);

    strengths.forEach((strength) => {
      doc
        .fontSize(11)
        .fillColor(grayColor)
        .text(`✓ ${strength}`, { indent: 10 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  // ===== AREAS FOR IMPROVEMENT =====
  const improvements = review.improvements || [];
  if (improvements.length > 0) {
    doc
      .fontSize(18)
      .fillColor(warningColor)
      .text('Areas for Improvement');

    doc.moveDown(0.5);

    improvements.forEach((improvement) => {
      doc
        .fontSize(11)
        .fillColor(grayColor)
        .text(`⚠ ${improvement}`, { indent: 10 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  // ===== DETAILED REVIEW =====
  if (review.full_review) {
    // Add new page if needed
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(18)
      .fillColor(primaryColor)
      .text('Detailed Review');

    doc.moveDown(0.5);

    // Split by paragraphs and render
    const paragraphs = review.full_review.split('\n\n');
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        doc
          .fontSize(11)
          .fillColor(grayColor)
          .text(paragraph.trim(), {
            align: 'justify',
            lineGap: 3
          });
        doc.moveDown(0.8);
      }
    });
  }

  // ===== FOOTER =====
  doc.moveDown(2);

  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('─'.repeat(60), { align: 'center' });

  doc.moveDown(0.5);

  doc
    .fontSize(9)
    .text('This report was generated automatically by LearnAI Code Review.', { align: 'center' })
    .text('For questions or feedback, visit learnai.com', { align: 'center' });

  // Finalize PDF
  doc.end();
});

module.exports = {
  submitReview,
  getReviewStatus,
  getReviewResults,
  getMyReviews,
  downloadReviewPDF
};
