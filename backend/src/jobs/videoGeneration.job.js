const { supabase } = require('../config/database');
const { extractContentFromURL, generateVideoScript } = require('../services/ai.service');
const {
  generateManimFile,
  renderManimVideo,
  renderIndividualSlides,
  generateVideoNarration,
  generateSlideNarrations,
  syncSlideWithAudio,
  generateSyncedVideo,
  combineVideoAudio,
  getVideoDuration,
  generateThumbnail,
  cleanupVideoTemp,
  VIDEO_OUTPUT_DIR,
  TEMP_DIR
} = require('../services/video.service');
const { uploadVideo, uploadThumbnail } = require('../services/storage.service');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs').promises;

// Configuration for video rendering
const ENABLE_FULL_RENDERING = process.env.ENABLE_VIDEO_RENDERING === 'true';

// Valid categories for videos (must match database constraint)
const VALID_CATEGORIES = ['AI/ML', 'Data Science', 'Research'];

/**
 * Normalize category to a valid database value
 * @param {string} category - Category from AI
 * @returns {string} Valid category
 */
function normalizeCategory(category) {
  if (!category) return 'AI/ML';

  // Check if already valid
  if (VALID_CATEGORIES.includes(category)) {
    return category;
  }

  // Map common variations
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('ai') || categoryLower.includes('ml') || categoryLower.includes('machine learning')) {
    return 'AI/ML';
  }
  if (categoryLower.includes('data')) {
    return 'Data Science';
  }
  if (categoryLower.includes('research') || categoryLower.includes('science') || categoryLower.includes('programming')) {
    return 'Research';
  }

  // Default fallback
  return 'AI/ML';
}

/**
 * Process video generation job
 * @param {Object} job - Bull job object
 * @returns {Promise<Object>} Result with video ID
 */
async function processVideoGeneration(job) {
  const { jobId, userId, sourceUrl } = job.data;

  console.log(`\n=== Starting Video Generation Job ${jobId} ===`);
  console.log(`User: ${userId}`);
  console.log(`Source: ${sourceUrl}`);
  console.log(`Full Rendering: ${ENABLE_FULL_RENDERING ? 'enabled' : 'disabled (using fast mode)'}`);

  try {
    // Step 1: Extract content from URL
    await updateJobProgress(jobId, {
      status: 'processing',
      progress: {
        step: 1,
        totalSteps: 5,
        percentage: 5,
        message: 'Extracting content from URL...'
      }
    });

    console.log('Step 1: Extracting content...');
    const { title, content } = await extractContentFromURL(sourceUrl);
    console.log(`✓ Extracted: "${title}" (${content.length} characters)`);

    await updateJobProgress(jobId, {
      progress: {
        step: 1,
        totalSteps: 5,
        percentage: 15,
        message: 'Content extracted successfully'
      }
    });

    // Step 2: Generate script with OpenAI
    await updateJobProgress(jobId, {
      progress: {
        step: 2,
        totalSteps: 5,
        percentage: 20,
        message: 'Generating video script with AI...'
      }
    });

    console.log('Step 2: Generating script with OpenAI...');
    const script = await generateVideoScript(content, title);
    console.log(`✓ Script generated: ${script.slides.length} slides, ${script.totalDuration}`);

    // Store the script in video_scripts table
    console.log('Storing script in database...');
    const { data: savedScript, error: scriptError } = await supabase
      .from('video_scripts')
      .insert([
        {
          title: script.title,
          description: script.description,
          source_url: sourceUrl,
          slides: script.slides,
          total_duration: script.totalDuration,
          category: normalizeCategory(script.category),
          status: 'pending',
          created_by: userId
        }
      ])
      .select()
      .single();

    if (scriptError) {
      console.error('Failed to store script:', scriptError.message);
      // Continue anyway - script storage is not critical
    } else {
      console.log(`✓ Script stored with ID: ${savedScript.id}`);
    }

    const scriptId = savedScript?.id;

    await updateJobProgress(jobId, {
      progress: {
        step: 2,
        totalSteps: 5,
        percentage: 30,
        message: `Script ready: ${script.slides.length} slides`
      }
    });

    let videoUrl, thumbnailUrl, finalDuration;

    if (ENABLE_FULL_RENDERING) {
      // Full video rendering with Manim + TTS
      // Mode controlled by ENABLE_PERSLIDE_SYNC:
      // - default (true): Render each slide, sync with audio individually (like ai_unveiled_synced.mp4)
      // - false: Render all slides as one video, combine with audio (faster but less precise)
      // Per-slide sync is enabled by default for better quality
      const usePerSlideSync = process.env.ENABLE_PERSLIDE_SYNC !== 'false';

      // Step 3: Generate and render Manim animations
      await updateJobProgress(jobId, {
        progress: {
          step: 3,
          totalSteps: 5,
          percentage: 35,
          message: 'Creating animated visualizations...'
        }
      });

      console.log('Step 3: Generating Manim file...');
      // Check if AI-enhanced Manim generation is enabled
      // Disabled by default - AI generates unreliable layouts with overlapping elements
      const useAIManiem = process.env.ENABLE_AI_MANIM === 'true'; // Default disabled
      const visualTheme = script.visualTheme || 'general';

      if (useAIManiem) {
        console.log('  Using AI-enhanced Manim generation (GPT-4 custom code)...');
      } else {
        console.log('  Using template-based Manim generation...');
      }

      const manimFilePath = await generateManimFile(script.slides, jobId, {
        useAI: useAIManiem,
        theme: visualTheme
      });
      console.log(`✓ Manim file created: ${manimFilePath}`);

      const renderOutputDir = path.join(VIDEO_OUTPUT_DIR, jobId);
      await fs.mkdir(renderOutputDir, { recursive: true });

      let slideVideos = [];
      let slideAudios = [];

      if (usePerSlideSync) {
        // Per-slide sync mode (slower but better quality)
        console.log('Step 3b: Rendering individual slide animations (per-slide sync mode)...');
        // Scene names are Slide0Scene, Slide1Scene, etc. (0-indexed with Scene suffix)
        const sceneNames = script.slides.map((_, i) => `Slide${i}Scene`);
        slideVideos = await renderIndividualSlides(manimFilePath, sceneNames, renderOutputDir);
        console.log(`✓ Rendered ${slideVideos.length}/${sceneNames.length} slide videos`);

        if (slideVideos.length < script.slides.length) {
          console.warn('Some slides failed to render, falling back to combined mode');
        }
      }

      // Fallback to combined mode if per-slide failed or not enabled
      if (!usePerSlideSync || slideVideos.length < script.slides.length) {
        console.log('Step 3b: Rendering full video...');
        const rawVideoPath = await renderManimVideo(manimFilePath, 'FullVideo', renderOutputDir);
        console.log(`✓ Video rendered: ${rawVideoPath}`);
        slideVideos = [rawVideoPath];
      }

      await updateJobProgress(jobId, {
        progress: {
          step: 3,
          totalSteps: 5,
          percentage: 55,
          message: 'Animations rendered successfully'
        }
      });

      // Step 4: Generate narration
      await updateJobProgress(jobId, {
        progress: {
          step: 4,
          totalSteps: 5,
          percentage: 60,
          message: 'Generating AI narration...'
        }
      });

      if (usePerSlideSync && slideVideos.length === script.slides.length) {
        // Generate per-slide audio for sync
        console.log('Step 4: Generating narration for each slide...');
        slideAudios = await generateSlideNarrations(script.slides, jobId);
        console.log(`✓ Generated ${slideAudios.length} audio files`);
      } else {
        // Generate combined audio
        console.log('Step 4: Generating combined narration...');
        const audioPath = await generateVideoNarration(script.slides, jobId);
        console.log(`✓ Narration generated: ${audioPath}`);
        slideAudios = [audioPath];
      }

      await updateJobProgress(jobId, {
        progress: {
          step: 4,
          totalSteps: 5,
          percentage: 75,
          message: 'Narration generated successfully'
        }
      });

      // Step 5: Combine video and audio with sync
      await updateJobProgress(jobId, {
        progress: {
          step: 5,
          totalSteps: 5,
          percentage: 80,
          message: 'Synchronizing video and audio...'
        }
      });

      console.log('Step 5: Combining and syncing video with audio...');
      const finalVideoFilename = `video_${jobId}.mp4`;
      const finalVideoPath = path.join(VIDEO_OUTPUT_DIR, finalVideoFilename);

      if (usePerSlideSync && slideVideos.length === script.slides.length && slideAudios.length === slideVideos.length) {
        // Per-slide sync (like ai_unveiled_synced.mp4)
        console.log('Using per-slide sync mode...');
        await generateSyncedVideo(script.slides, jobId, slideVideos, slideAudios, finalVideoPath);
        console.log(`✓ Synced video created: ${finalVideoPath}`);
      } else {
        // Combine video with audio, extending video if audio is longer
        await combineVideoAudio(slideVideos[0], slideAudios[0], finalVideoPath);
        console.log(`✓ Final video: ${finalVideoPath}`);
      }

      // Generate thumbnail
      const thumbnailFilename = `thumb_${jobId}.jpg`;
      const thumbnailPath = path.join(VIDEO_OUTPUT_DIR, thumbnailFilename);
      await generateThumbnail(finalVideoPath, thumbnailPath);

      // Get final duration
      finalDuration = await getVideoDuration(finalVideoPath);

      // Upload to Supabase Storage
      await updateJobProgress(jobId, {
        progress: {
          step: 5,
          totalSteps: 5,
          percentage: 90,
          message: 'Uploading to cloud storage...'
        }
      });

      console.log('Step 5b: Uploading to Supabase Storage...');
      try {
        videoUrl = await uploadVideo(finalVideoPath, jobId);
        thumbnailUrl = await uploadThumbnail(thumbnailPath, jobId);
        console.log(`✓ Video uploaded: ${videoUrl}`);
        console.log(`✓ Thumbnail uploaded: ${thumbnailUrl}`);
      } catch (uploadError) {
        console.error('Upload to Supabase failed, using local path:', uploadError.message);
        // Fallback to local paths if upload fails
        videoUrl = `/videos/${finalVideoFilename}`;
        thumbnailUrl = `/videos/${thumbnailFilename}`;
      }

      // Cleanup temp files
      await cleanupVideoTemp(jobId);

    } else {
      // Fast mode: Create placeholder/simulated video
      console.log('Step 3-5: Fast mode - generating simulated video...');

      // Generate thumbnail URL
      thumbnailUrl = `https://via.placeholder.com/1280x720/6366f1/ffffff?text=${encodeURIComponent(script.title.substring(0, 30))}`;

      // Mock video URL
      videoUrl = `https://example.com/videos/${nanoid()}.mp4`;
      finalDuration = script.totalDuration;
    }

    await updateJobProgress(jobId, {
      progress: {
        step: 5,
        totalSteps: 5,
        percentage: 90,
        message: 'Saving to database...'
      }
    });

    // Save to database
    console.log('Saving video to database...');
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert([
        {
          title: script.title,
          description: script.description,
          thumbnail: thumbnailUrl,
          video_url: videoUrl,
          duration: typeof finalDuration === 'number'
            ? formatDuration(finalDuration)
            : script.totalDuration,
          category: normalizeCategory(script.category),
          views: 0,
          source: 'AI Generated',
          source_url: sourceUrl,
          transcript: JSON.stringify(script.slides),
          created_by: userId,
          is_generated: true
        }
      ])
      .select()
      .single();

    if (videoError) {
      throw new Error(`Failed to create video: ${videoError.message}`);
    }

    console.log(`✓ Video created with ID: ${video.id}`);

    // Update script status to completed and link video
    if (scriptId) {
      await supabase
        .from('video_scripts')
        .update({
          status: 'completed',
          video_id: video.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', scriptId);
      console.log('✓ Script status updated to completed');
    }

    // Update job to completed
    await updateJobProgress(jobId, {
      status: 'completed',
      progress: {
        step: 5,
        totalSteps: 5,
        percentage: 100,
        message: 'Video generated successfully!'
      },
      video_id: video.id,
      completed_at: new Date().toISOString()
    });

    // Update user stats
    await updateUserStats(userId, 'videos_generated');

    // Update daily limits
    await incrementDailyLimit(userId, 'videos_generated');

    console.log(`=== Job ${jobId} completed successfully ===\n`);

    return {
      success: true,
      videoId: video.id,
      title: video.title,
      videoUrl: videoUrl
    };
  } catch (error) {
    console.error(`✗ Job ${jobId} failed:`, error.message);

    // Cleanup on failure
    await cleanupVideoTemp(jobId);

    // Update job to failed
    await updateJobProgress(jobId, {
      status: 'failed',
      error: error.message,
      progress: {
        step: 0,
        totalSteps: 5,
        percentage: 0,
        message: `Failed: ${error.message}`
      }
    });

    throw error;
  }
}

/**
 * Format duration from seconds to MM:SS
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update job progress in database
 */
async function updateJobProgress(jobId, updates) {
  const { error } = await supabase
    .from('video_generation_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update job progress:', error.message);
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(userId, field) {
  try {
    const { data: stats } = await supabase
      .from('user_stats')
      .select(field)
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({ [field]: stats[field] + 1 })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update user stats:', error.message);
  }
}

/**
 * Increment daily limit counter
 */
async function incrementDailyLimit(userId, field) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if entry exists for today
    const { data: existing } = await supabase
      .from('daily_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('daily_limits')
        .update({ [field]: existing[field] + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      // Create new entry
      await supabase
        .from('daily_limits')
        .insert([
          {
            user_id: userId,
            date: today,
            [field]: 1
          }
        ]);
    }
  } catch (error) {
    console.error('Failed to update daily limits:', error.message);
  }
}

module.exports = {
  processVideoGeneration
};
