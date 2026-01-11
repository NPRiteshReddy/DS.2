# Video Generation Testing Guide

## Overview

The video generation feature has been **significantly enhanced** to produce professional-quality educational videos similar to the `ai_unveiled` example. This guide explains how to test the improved feature.

---

## What Was Fixed

### 1. **Enhanced Manim Visualizations**

All 6 visualization types have been completely rewritten:

| Type | Before | After |
|------|--------|-------|
| **Graph** | Single curve, basic axes | Dual curves with colors, labeled axes, smooth animations |
| **Brain Diagram** | 12 simple lines | 25 colored neural pathways, 3D-like appearance, gradual reveal |
| **Hierarchy** | Basic boxes | Animated tree with connecting lines, varied colors, smooth transitions |
| **List** | Plain bullet points | Colored boxes per item, animated icons, staggered entrance |
| **Code** | Simple code block | Terminal appearance with header, syntax highlighting, line numbers |
| **Text** | Basic title + text | Title with underline, decorative boxes, highlighted key points |

### 2. **Improved Timing**

- **Wait times** now properly calculated: `waitTime = totalDuration - animationTime - 2`
- Animations take ~30% of slide duration (max 5 seconds)
- Content stays visible for the remaining time to match narration

### 3. **Better Configuration**

```python
config.pixel_height = 720
config.pixel_width = 1280
config.frame_rate = 24  # Smoother than 30fps
config.background_color = "#0f0f23"  # Dark theme for contrast
```

### 4. **Enhanced Visual Quality**

- **Colors**: Using Manim's built-in palette (BLUE_C, GREEN_C, YELLOW, PINK, GOLD, TEAL, PURPLE_C)
- **Animations**: FadeIn, Write, Create with proper lag_ratio and run_time
- **Layout**: Better spacing, alignment, and positioning
- **Cleanup**: All mobjects properly cleared with `FadeOut`

---

## Prerequisites

Before testing, ensure you have:

1. **Python 3.8+** installed
2. **Manim** installed:
   ```bash
   pip install manim
   ```

3. **Edge TTS** installed:
   ```bash
   pip install edge-tts
   ```

4. **FFmpeg** installed and in PATH:
   - **Windows**: `choco install ffmpeg` or `scoop install ffmpeg`
   - **Mac**: `brew install ffmpeg`
   - **Linux**: `apt install ffmpeg`

5. **Backend environment variables** set:
   ```env
   ENABLE_VIDEO_RENDERING=true
   ENABLE_PERSLIDE_SYNC=true
   OPENAI_API_KEY=sk-...
   REDIS_URL=redis://localhost:6379
   ```

6. **Redis server** running

---

## How to Test

### Method 1: Via Frontend (Full Flow)

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev  # In one terminal
   npm run worker:dev  # In another terminal
   ```

2. **Start Frontend**:
   ```bash
   cd student-learning-platform
   npm install
   npm run dev
   ```

3. **Create Account**:
   - Navigate to http://localhost:5173
   - Sign up with email/password
   - Login

4. **Generate Video**:
   - Click "Create Video"
   - Enter a URL (e.g., https://en.wikipedia.org/wiki/Artificial_intelligence)
   - Submit and watch the progress tracker
   - Wait 2-5 minutes for completion

5. **Watch Result**:
   - You'll be redirected to the video player
   - Video should have:
     - Clear title slides
     - Animated visualizations
     - Smooth transitions
     - Synchronized audio narration

### Method 2: Direct Manim Testing (Quick)

To test just the Manim generation without the full pipeline:

1. **Check existing test video**:
   ```bash
   cd backend/test_output/media/videos/ai_unveiled/720p24
   ls -lh
   # You should see Slide1_Introduction.mp4, Slide2_WhatIsAI.mp4, etc.
   ```

2. **Render a specific slide**:
   ```bash
   cd backend/test_output
   python -m manim render -ql ai_unveiled.py Slide2_WhatIsAI
   ```

3. **Watch the output**:
   - Video will be in `media/videos/ai_unveiled/720p24/Slide2_WhatIsAI.mp4`
   - Should show brain diagram with neural pathways and bullet points

### Method 3: Test Script Generation

To test just the OpenAI script generation:

```javascript
// In backend, create test_script.js
const { generateVideoScript } = require('./src/services/ai.service');

const sampleContent = `
Artificial Intelligence (AI) is the simulation of human intelligence by machines.
AI systems can learn, reason, and solve complex problems.
Modern AI uses deep learning and neural networks.
Applications include computer vision, natural language processing, and robotics.
`;

generateVideoScript(sampleContent, "Introduction to AI")
  .then(script => console.log(JSON.stringify(script, null, 2)))
  .catch(err => console.error(err));
```

Run: `node test_script.js`

Expected output:
```json
{
  "title": "Introduction to AI",
  "description": "An educational overview of Artificial Intelligence...",
  "slides": [
    {
      "slideNumber": 1,
      "title": "What is AI?",
      "narration": "Artificial Intelligence, or AI, is...",
      "visualType": "brain_diagram",
      "visualDescription": "Brain with neural connections",
      "bulletPoints": ["Machine learning", "Deep learning", "Neural networks"],
      "duration": 30
    }
    // ... more slides
  ],
  "totalDuration": "5:30",
  "category": "AI/ML"
}
```

---

## What to Look For

### ✅ **Good Output** (Like ai_unveiled)

- **Smooth animations**: Elements appear gradually, not all at once
- **Varied colors**: Different colors for different elements
- **Proper timing**: Content stays visible long enough to read
- **Clear audio**: Natural-sounding narration synchronized with visuals
- **Professional look**: Dark background, good contrast, readable text
- **No gaps**: Slides transition smoothly without black screens

### ❌ **Issues to Watch For**

- **Black screens**: Video too short or sync failed
- **Frozen frames**: Video frozen while audio continues
- **Text cutoff**: Text too long for screen
- **Overlapping elements**: Poor layout
- **No audio**: TTS failed
- **Desynchronization**: Audio doesn't match visuals

---

## Troubleshooting

### Issue: "Manim command not found"

**Solution**:
```bash
python -m manim --version  # Should show version number
# If not installed:
pip install manim
```

### Issue: "Edge TTS failed"

**Solution**:
```bash
python -m edge_tts --list-voices | grep "en-US-GuyNeural"
# Should show voice details
# If not installed:
pip install edge-tts
```

### Issue: "FFmpeg not found"

**Solution**:
```bash
ffmpeg -version  # Should show version
# If not installed:
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### Issue: "Video renders but has no audio"

**Possible causes**:
1. TTS failed silently - check logs for errors
2. Audio file not generated - check `backend/temp/{jobId}/audio/` folder
3. FFmpeg sync command failed - check error output

**Debug**:
```bash
# Check if audio files exist
ls backend/temp/{jobId}/audio/
# Should show narration_00.mp3, narration_01.mp3, etc.

# Test TTS manually
python -m edge_tts --voice "en-US-GuyNeural" --text "Hello world" --write-media test.mp3
# Should create test.mp3
```

### Issue: "Job gets stuck in processing"

**Solution**:
1. Check Redis connection: `redis-cli ping` (should return "PONG")
2. Check worker is running: Look for "Worker is ready" in logs
3. Check job status in database:
   ```sql
   SELECT * FROM video_generation_jobs ORDER BY created_at DESC LIMIT 5;
   ```

---

## Performance Expectations

| Stage | Duration | CPU Usage |
|-------|----------|-----------|
| Content extraction | 5-10s | Low |
| Script generation (OpenAI) | 10-20s | Low (API call) |
| Manim rendering | 60-180s | **High** (CPU intensive) |
| TTS generation | 20-40s | Medium |
| Audio-video sync | 30-60s | Medium (FFmpeg) |
| **Total** | **2-5 minutes** | Varies |

---

## Expected Output Quality

### Video Specifications

- **Resolution**: 1280x720 (720p HD)
- **Frame rate**: 24 fps
- **Codec**: H.264
- **Audio**: AAC, 44.1kHz, stereo
- **Bitrate**: ~2-4 Mbps (depending on content)
- **File size**: ~50-150 MB for 5-minute video

### Visual Quality Comparison

**ai_unveiled.py** (reference):
- 8 slides, 8:15 duration
- Professional animations (brain diagrams, timelines, futuristic city)
- Smooth transitions, varied colors
- Clear, readable text (48pt titles, 24pt content)

**Your Generated Videos** (should match):
- 8-12 slides, 5-10 minutes
- Similar animation quality per visualization type
- Same dark theme (`#0f0f23` background)
- Comparable text sizes and layout

---

## Next Steps After Testing

1. **If tests pass**:
   - Deploy to production
   - Monitor first few user-generated videos
   - Collect feedback on quality

2. **If issues found**:
   - Check logs in `backend/logs/`
   - Verify environment variables
   - Test dependencies individually
   - Review error messages in console

3. **To improve further**:
   - Add more visualization types (network diagrams, timelines, maps)
   - Support custom voice selection
   - Add background music option
   - Implement video preview before finalizing

---

## Example Test URLs

Use these URLs to test different types of content:

1. **Technical/AI**: https://en.wikipedia.org/wiki/Artificial_intelligence
2. **Scientific**: https://en.wikipedia.org/wiki/Machine_learning
3. **Historical**: https://en.wikipedia.org/wiki/History_of_computing
4. **Process**: https://en.wikipedia.org/wiki/Scientific_method
5. **Code-heavy**: https://en.wikipedia.org/wiki/Algorithm

---

## Monitoring Generated Videos

After generation, videos are stored in:
- **Database**: `videos` table (with `is_generated = true`)
- **Files**: `backend/public/videos/video_{jobId}.mp4`
- **Thumbnails**: `backend/public/videos/thumb_{jobId}.jpg`
- **Temp files**: `backend/temp/{jobId}/` (cleaned up after success)

To check recent generations:
```sql
SELECT
  id, title, duration, created_at,
  is_generated, created_by
FROM videos
WHERE is_generated = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## Success Criteria

✅ **Video generation is working correctly if**:

1. Job completes within 2-5 minutes
2. Video plays smoothly in browser
3. Audio is synchronized with visuals
4. All slides have appropriate visualizations
5. Text is readable and properly formatted
6. Colors and contrast are good
7. No errors in backend logs
8. File size is reasonable (50-150 MB)
9. Quality matches ai_unveiled reference
10. User can watch, bookmark, and share the video

---

## Support

If you encounter issues:
1. Check backend logs: `backend/logs/error.log`
2. Check worker output: Terminal running `npm run worker:dev`
3. Check Redis: `redis-cli monitor`
4. Check job status: Query `video_generation_jobs` table
5. Review temp files: `backend/temp/{jobId}/`

For reproducible bugs:
1. Save the job ID
2. Copy error messages
3. Save the source URL
4. Note system specs (OS, Python version, Node version)
5. Create GitHub issue with details

---

**Happy Testing! 🎬**
