require('dotenv').config();
const { supabase } = require('./src/config/database');
const videoService = require('./src/services/video.service');
const path = require('path');
const fs = require('fs').promises;
const { nanoid } = require('nanoid');

// Script ID from previous step
const SCRIPT_ID = '601d9fb3-be86-46dc-886e-9370445582f3';
const JOB_ID = `regen_${nanoid(6)}`;
const VIDEO_OUTPUT_DIR = path.join(process.cwd(), 'public', 'videos');

async function run() {
    console.log(`\n=== REGENERATION STARTED ===`);
    console.log(`Script ID: ${SCRIPT_ID}`);
    console.log(`Job ID: ${JOB_ID}`);

    // Fetch script
    const { data: script, error } = await supabase
        .from('video_scripts')
        .select('*')
        .eq('id', SCRIPT_ID)
        .single();

    if (error || !script) {
        console.error("❌ Script not found or error:", error);
        return;
    }

    console.log(`✓ Found script: "${script.title}"`);
    console.log(`✓ Slide count: ${script.slides.length}`);

    try {
        const renderOutputDir = path.join(VIDEO_OUTPUT_DIR, JOB_ID);
        await fs.mkdir(renderOutputDir, { recursive: true });

        // Step 1: Generate Manim File
        console.log("\n[Step 1] Generating Manim Code...");
        const manimFilePath = await videoService.generateManimFile(script.slides, JOB_ID);
        console.log(`✓ Manim file: ${manimFilePath}`);

        // Step 2: Render Slides
        console.log("\n[Step 2] Rendering Individual Slides (720p30)...");
        const sceneNames = script.slides.map((_, i) => `Slide${i}Scene`);
        const slideVideos = await videoService.renderIndividualSlides(manimFilePath, sceneNames, renderOutputDir);

        console.log(`✓ Rendered ${slideVideos.length}/${sceneNames.length} slides successfully.`);

        let finalSlideVideos = [];
        let finalSlides = [];

        if (slideVideos.length === 0) {
            throw new Error("No slides were rendered successfully.");
        }

        if (slideVideos.length < sceneNames.length) {
            console.warn("⚠️ Warning: Some slides failed. Filtering pipeline...");

            // Map video files back to slide indices using filename
            const successfulIndices = slideVideos.map(vidPath => {
                const match = vidPath.match(/Slide(\d+)Scene/);
                return match ? parseInt(match[1]) : -1;
            }).filter(idx => idx !== -1).sort((a, b) => a - b);

            successfulIndices.forEach(idx => {
                finalSlides.push(script.slides[idx]);
                // Matches logic in video.service which returns paths
                // We need to ensure correct path corresponds to index
                const vid = slideVideos.find(p => p.includes(`Slide${idx}Scene`));
                finalSlideVideos.push(vid);
            });

            console.log(`Proceeding with ${finalSlides.length} valid slides.`);
            script.slides = finalSlides; // UPDATE SCRIPT CONTENT FOR NEXT STEPS
        } else {
            finalSlideVideos = slideVideos;
        }

        // Step 3: Generate Audio (Only for successful slides)
        console.log("\n[Step 3] Generating Narration Audio...");
        // script.slides is now filtered so this generates audio only for valid slides
        const slideAudios = await videoService.generateSlideNarrations(script.slides, JOB_ID);
        console.log(`✓ Generated ${slideAudios.length} audio files`);

        // Step 4: Sync & Concatenate
        console.log("\n[Step 4] Synchronizing Video & Audio...");
        const finalVideoPath = path.join(VIDEO_OUTPUT_DIR, `video_${JOB_ID}.mp4`);

        // Pass filtered lists
        await videoService.generateSyncedVideo(script.slides, JOB_ID, finalSlideVideos, slideAudios, finalVideoPath);

        console.log(`\n✅ SUCCESS! Final video generated at:`);
        console.log(finalVideoPath);

    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
    }
}

run();
