/**
 * Video Cleanup Script
 *
 * This script cleans up:
 * 1. Failed/incomplete video generation jobs from the database
 * 2. Videos without valid video files
 * 3. Orphaned video directories and files
 * 4. Scraped content and temporary files
 *
 * Run with: node scripts/cleanup-videos.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const VIDEOS_DIR = path.join(__dirname, '../public/videos');

async function cleanup() {
  console.log('🧹 Starting video cleanup...\n');

  // Track cleanup stats
  const stats = {
    failedJobs: 0,
    orphanedVideos: 0,
    deletedDirs: 0,
    deletedFiles: 0
  };

  try {
    // ============================================
    // 1. Clean up failed video generation jobs
    // ============================================
    console.log('📋 Checking video generation jobs...');

    const { data: failedJobs, error: jobsError } = await supabase
      .from('video_generation_jobs')
      .select('id, status, video_id, source_url')
      .in('status', ['failed', 'cancelled']);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError.message);
    } else if (failedJobs && failedJobs.length > 0) {
      console.log(`  Found ${failedJobs.length} failed/cancelled jobs`);

      for (const job of failedJobs) {
        console.log(`  - Deleting job: ${job.id} (${job.status})`);
        await supabase.from('video_generation_jobs').delete().eq('id', job.id);
        stats.failedJobs++;
      }
    } else {
      console.log('  No failed jobs found');
    }

    // ============================================
    // 2. Get all valid videos from database
    // ============================================
    console.log('\n📹 Checking videos in database...');

    const { data: dbVideos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, video_url, thumbnail, is_generated');

    if (videosError) {
      console.error('Error fetching videos:', videosError.message);
      return;
    }

    console.log(`  Found ${dbVideos?.length || 0} videos in database`);

    // Check which videos have valid files
    const validVideoIds = new Set();
    const videosToDelete = [];

    for (const video of (dbVideos || [])) {
      if (video.is_generated) {
        // Check if video file exists
        const videoFileName = video.video_url?.split('/').pop();
        const videoPath = videoFileName ? path.join(VIDEOS_DIR, videoFileName) : null;

        if (videoPath && fs.existsSync(videoPath)) {
          validVideoIds.add(video.id);
        } else {
          console.log(`  ⚠️  Video missing file: ${video.title} (${video.id})`);
          videosToDelete.push(video);
        }
      } else {
        // Curated videos (external URLs) are always valid
        validVideoIds.add(video.id);
      }
    }

    // Delete videos without files
    if (videosToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${videosToDelete.length} videos without files...`);

      for (const video of videosToDelete) {
        console.log(`  - Deleting: ${video.title}`);
        await supabase.from('videos').delete().eq('id', video.id);
        stats.orphanedVideos++;
      }
    }

    // ============================================
    // 3. Clean up orphaned files and directories
    // ============================================
    console.log('\n📁 Checking files in videos directory...');

    if (!fs.existsSync(VIDEOS_DIR)) {
      console.log('  Videos directory does not exist');
    } else {
      const files = fs.readdirSync(VIDEOS_DIR);
      console.log(`  Found ${files.length} items in directory`);

      // Patterns to identify video job directories
      const videoIdPattern = /^video_[a-zA-Z0-9_-]+$/;
      const regenPattern = /^regen_[a-zA-Z0-9]+$/;

      for (const file of files) {
        const filePath = path.join(VIDEOS_DIR, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Check if it's an orphaned job directory
          if (videoIdPattern.test(file) || regenPattern.test(file)) {
            console.log(`  🗑️  Deleting orphaned directory: ${file}`);
            fs.rmSync(filePath, { recursive: true, force: true });
            stats.deletedDirs++;
          }
        } else if (stat.isFile()) {
          // Keep valid video files and thumbnails
          // Delete temp files, partial downloads, etc.
          const ext = path.extname(file).toLowerCase();
          const baseName = path.basename(file, ext);

          // Keep .mp4 files and .jpg thumbnails that correspond to valid videos
          if (ext === '.mp4' || ext === '.jpg') {
            // Extract video ID from filename
            const match = file.match(/video_([a-zA-Z0-9_-]+)/);
            // Keep the file - it might be a valid video
          } else {
            // Delete other file types (temp files, etc.)
            console.log(`  🗑️  Deleting file: ${file}`);
            fs.unlinkSync(filePath);
            stats.deletedFiles++;
          }
        }
      }
    }

    // ============================================
    // 4. Clean up processing jobs older than 1 hour
    // ============================================
    console.log('\n⏰ Checking stale processing jobs...');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: staleJobs, error: staleError } = await supabase
      .from('video_generation_jobs')
      .select('id, created_at')
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo);

    if (staleError) {
      console.error('Error fetching stale jobs:', staleError.message);
    } else if (staleJobs && staleJobs.length > 0) {
      console.log(`  Found ${staleJobs.length} stale processing jobs`);

      for (const job of staleJobs) {
        console.log(`  - Marking as failed: ${job.id}`);
        await supabase
          .from('video_generation_jobs')
          .update({ status: 'failed', error: 'Job timed out' })
          .eq('id', job.id);
      }
    } else {
      console.log('  No stale jobs found');
    }

    // ============================================
    // Print summary
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup Complete!');
    console.log('='.repeat(50));
    console.log(`  Failed jobs deleted: ${stats.failedJobs}`);
    console.log(`  Orphaned videos deleted: ${stats.orphanedVideos}`);
    console.log(`  Directories deleted: ${stats.deletedDirs}`);
    console.log(`  Files deleted: ${stats.deletedFiles}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run cleanup
cleanup().then(() => {
  console.log('\n👋 Done!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
