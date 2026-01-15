/**
 * Code Review Job Processor
 * Handles asynchronous code review processing
 */

const { supabase } = require('../config/database');
const { ingestRepository, analyzeCodeWithGPT4 } = require('../services/reviews.service');

/**
 * Process a code review job
 * @param {Object} job - Bull job object with data
 * @returns {Promise<Object>} Review results
 */
async function processCodeReview(job) {
  const { reviewId, userId, repoUrl, repoName } = job.data;

  console.log(`\n=== Starting Code Review Job ${reviewId} ===`);
  console.log(`Repository: ${repoName}`);
  console.log(`User: ${userId}`);

  try {
    // Step 1: Ingest the repository
    console.log('Step 1: Ingesting repository with gitingest...');
    const repoData = await ingestRepository(repoUrl);
    console.log(`  Repository ingested successfully`);

    // Step 2: Analyze with GPT-4o
    console.log('Step 2: Analyzing code with GPT-4o...');
    const analysis = await analyzeCodeWithGPT4(repoData, repoName);
    console.log(`  Analysis complete`);

    // Step 3: Save results to database
    console.log('Step 3: Saving results...');
    const { error: updateError } = await supabase
      .from('code_reviews')
      .update({
        status: 'completed',
        quality_score: analysis.qualityScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        key_suggestions: analysis.keySuggestions,
        full_review: analysis.fullReview,
        metrics: analysis.metrics,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (updateError) {
      throw new Error('Failed to save review results: ' + updateError.message);
    }

    // Step 4: Update user stats
    console.log('Step 4: Updating user stats...');
    const { data: stats } = await supabase
      .from('user_stats')
      .select('reviews_completed')
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          reviews_completed: (stats.reviews_completed || 0) + 1
        })
        .eq('user_id', userId);
    }

    // Step 5: Update daily limits
    const today = new Date().toISOString().split('T')[0];
    const { data: limits } = await supabase
      .from('daily_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (limits) {
      await supabase
        .from('daily_limits')
        .update({
          reviews_completed: (limits.reviews_completed || 0) + 1
        })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase
        .from('daily_limits')
        .insert([{
          user_id: userId,
          date: today,
          videos_generated: 0,
          reviews_completed: 1
        }]);
    }

    console.log(`=== Code Review ${reviewId} Completed Successfully ===\n`);

    return {
      success: true,
      reviewId,
      qualityScore: analysis.qualityScore
    };

  } catch (error) {
    console.error(`Code review ${reviewId} failed:`, error.message);

    // Update review status to failed
    await supabase
      .from('code_reviews')
      .update({
        status: 'failed',
        error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    throw error;
  }
}

module.exports = { processCodeReview };
