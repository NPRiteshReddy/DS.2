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
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  });

  // Set response headers
  const filename = `code-review-${review.repo_name.replace('/', '-')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe PDF to response
  doc.pipe(res);

  // Colors
  const primaryColor = '#4f46e5';
  const primaryLight = '#eef2ff';
  const successColor = '#16a34a';
  const successLight = '#dcfce7';
  const warningColor = '#d97706';
  const warningLight = '#fef3c7';
  const errorColor = '#dc2626';
  const grayColor = '#374151';
  const lightGray = '#6b7280';
  const borderGray = '#e5e7eb';

  // Helper function to get score color and background
  const getScoreColors = (score) => {
    if (score >= 8) return { color: successColor, bg: successLight };
    if (score >= 6) return { color: warningColor, bg: warningLight };
    return { color: errorColor, bg: '#fef2f2' };
  };

  // Helper function to get score label
  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  // Helper to draw a rounded rectangle
  const drawRoundedRect = (x, y, width, height, radius, fillColor, strokeColor = null) => {
    doc.roundedRect(x, y, width, height, radius);
    if (fillColor) doc.fill(fillColor);
    if (strokeColor) {
      doc.roundedRect(x, y, width, height, radius).stroke(strokeColor);
    }
  };

  // Page dimensions
  const pageWidth = doc.page.width - 100; // 50 margin on each side

  // ===== HEADER SECTION =====
  // Draw header background
  drawRoundedRect(50, 50, pageWidth, 80, 8, primaryLight);

  doc
    .fontSize(24)
    .fillColor(primaryColor)
    .text('Code Review Report', 50, 70, { align: 'center', width: pageWidth });

  doc
    .fontSize(11)
    .fillColor(lightGray)
    .text('AI-Powered Code Analysis by LearnAI', 50, 100, { align: 'center', width: pageWidth });

  doc.y = 150;

  // ===== REPOSITORY INFO BOX =====
  const repoBoxY = doc.y;
  drawRoundedRect(50, repoBoxY, pageWidth, 70, 8, '#f9fafb');
  doc.roundedRect(50, repoBoxY, pageWidth, 70, 8).stroke(borderGray);

  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('REPOSITORY', 65, repoBoxY + 12);

  doc
    .fontSize(14)
    .fillColor(primaryColor)
    .text(review.repo_name, 65, repoBoxY + 28);

  doc
    .fontSize(9)
    .fillColor(lightGray)
    .text(review.repo_url, 65, repoBoxY + 48);

  // Review date on the right
  const reviewDate = review.completed_at
    ? new Date(review.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  doc
    .fontSize(9)
    .fillColor(lightGray)
    .text(`Reviewed: ${reviewDate}`, 350, repoBoxY + 28, { align: 'right', width: 180 });

  doc.y = repoBoxY + 90;

  // ===== QUALITY SCORE BOX =====
  const score = review.quality_score || 0;
  const scoreColors = getScoreColors(score);
  const scoreLabel = getScoreLabel(score);
  const scoreBoxY = doc.y;

  drawRoundedRect(50, scoreBoxY, pageWidth, 90, 8, scoreColors.bg);

  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('QUALITY SCORE', 65, scoreBoxY + 12);

  doc
    .fontSize(42)
    .fillColor(scoreColors.color)
    .text(`${score}`, 65, scoreBoxY + 30);

  doc
    .fontSize(20)
    .fillColor(lightGray)
    .text('/10', 115, scoreBoxY + 45);

  doc
    .fontSize(16)
    .fillColor(scoreColors.color)
    .text(scoreLabel, 170, scoreBoxY + 45);

  // Score bar visualization
  const barX = 300;
  const barWidth = 200;
  const barHeight = 12;
  const barY = scoreBoxY + 50;

  // Background bar
  doc.roundedRect(barX, barY, barWidth, barHeight, 6).fill('#e5e7eb');
  // Filled bar
  const filledWidth = (score / 10) * barWidth;
  if (filledWidth > 0) {
    doc.roundedRect(barX, barY, filledWidth, barHeight, 6).fill(scoreColors.color);
  }

  doc.y = scoreBoxY + 110;

  // ===== KEY SUGGESTIONS =====
  const keySuggestions = review.key_suggestions || [];
  if (keySuggestions.length > 0) {
    const suggestionsY = doc.y;

    doc
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Key Suggestions', 50, suggestionsY);

    doc.y = suggestionsY + 25;

    keySuggestions.forEach((suggestion, idx) => {
      const itemY = doc.y;

      // Number circle
      doc.circle(65, itemY + 7, 10).fill(primaryLight);
      doc
        .fontSize(10)
        .fillColor(primaryColor)
        .text(`${idx + 1}`, 61, itemY + 2);

      // Suggestion text
      doc
        .fontSize(11)
        .fillColor(grayColor)
        .text(suggestion, 85, itemY, { width: pageWidth - 45 });

      doc.y += 8;
    });

    doc.y += 15;
  }

  // ===== STRENGTHS & IMPROVEMENTS SIDE BY SIDE =====
  const strengths = review.strengths || [];
  const improvements = review.improvements || [];

  if (strengths.length > 0 || improvements.length > 0) {
    // Check if we need a new page
    if (doc.y > 550) {
      doc.addPage();
      doc.y = 50;
    }

    const columnsY = doc.y;
    const columnWidth = (pageWidth - 20) / 2;

    // Strengths column
    if (strengths.length > 0) {
      drawRoundedRect(50, columnsY, columnWidth, 20, 4, successLight);

      doc
        .fontSize(12)
        .fillColor(successColor)
        .text('Strengths', 60, columnsY + 5);

      let strengthY = columnsY + 30;
      strengths.forEach((strength) => {
        doc
          .fontSize(10)
          .fillColor(successColor)
          .text('[+]', 55, strengthY);

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .text(strength, 75, strengthY, { width: columnWidth - 35 });

        strengthY = doc.y + 8;
      });
    }

    // Improvements column
    if (improvements.length > 0) {
      const rightColX = 50 + columnWidth + 20;
      drawRoundedRect(rightColX, columnsY, columnWidth, 20, 4, warningLight);

      doc
        .fontSize(12)
        .fillColor(warningColor)
        .text('Areas for Improvement', rightColX + 10, columnsY + 5);

      let improvementY = columnsY + 30;
      improvements.forEach((improvement) => {
        doc
          .fontSize(10)
          .fillColor(warningColor)
          .text('[!]', rightColX + 5, improvementY);

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .text(improvement, rightColX + 25, improvementY, { width: columnWidth - 35 });

        improvementY = doc.y + 8;
      });

      doc.y = Math.max(doc.y, improvementY);
    }

    doc.y += 20;
  }

  // ===== DETAILED REVIEW =====
  if (review.full_review) {
    // Check if we need a new page
    if (doc.y > 500) {
      doc.addPage();
      doc.y = 50;
    }

    const detailsY = doc.y;

    drawRoundedRect(50, detailsY, pageWidth, 25, 4, primaryLight);

    doc
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Detailed Review', 60, detailsY + 7);

    doc.y = detailsY + 40;

    // Split by paragraphs and render
    const paragraphs = review.full_review.split('\n\n');
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        // Check for page break
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }

        doc
          .fontSize(10)
          .fillColor(grayColor)
          .text(paragraph.trim(), 50, doc.y, {
            width: pageWidth,
            align: 'justify',
            lineGap: 2
          });

        doc.y += 12;
      }
    });
  }

  // ===== FOOTER =====
  // Add footer to all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc
      .moveTo(50, doc.page.height - 50)
      .lineTo(doc.page.width - 50, doc.page.height - 50)
      .stroke(borderGray);

    // Footer text
    doc
      .fontSize(8)
      .fillColor(lightGray)
      .text(
        'Generated by LearnAI Code Review',
        50,
        doc.page.height - 40,
        { align: 'left', width: pageWidth / 2 }
      );

    doc
      .fontSize(8)
      .fillColor(lightGray)
      .text(
        `Page ${i + 1} of ${pages.count}`,
        doc.page.width / 2,
        doc.page.height - 40,
        { align: 'right', width: pageWidth / 2 }
      );
  }

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
