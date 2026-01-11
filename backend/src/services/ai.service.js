const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate video script from content using OpenAI GPT-4
 * Creates professional 3Blue1Brown-style educational video scripts
 * @param {string} content - Extracted content from URL
 * @param {string} title - Title of the content
 * @returns {Promise<Object>} Generated script with slides and visualData
 */
async function generateVideoScript(content, title) {
  try {
    const prompt = `You are an expert educational video scriptwriter who creates 3Blue1Brown-style content with professional animations and engaging explanations.

Create a detailed video script from this content:
Title: ${title}

Content:
${content.substring(0, 12000)}

Generate a JSON response with this EXACT structure:
{
  "title": "Compelling title (max 80 chars)",
  "description": "2-3 sentence hook describing what viewers will learn",
  "visualTheme": "math" or "science" or "programming" or "business" or "general",
  "slides": [
    {
      "slideNumber": 1,
      "heading": "Clear, descriptive heading",
      "narration": "Conversational script (60-100 words per slide, engaging and educational)",
      "visualType": "One of the 10 types below",
      "visualData": { structured data specific to visualType - see requirements below },
      "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "duration": 40
    }
  ],
  "totalDuration": "6:30",
  "category": "AI/ML" or "Data Science" or "Research"
}

=== VISUALIZATION TYPES AND REQUIRED visualData ===

1. "neural_network" - For AI/ML concepts, brain-like processing
   visualData: {
     "layers": [3, 5, 4, 2],
     "labels": ["Input", "Processing", "Output"],
     "showSignalFlow": true
   }

2. "tree_hierarchy" - For structures, taxonomies, decision trees
   visualData: {
     "rootLabel": "Main Concept",
     "children": [
       { "label": "Branch 1", "children": ["Leaf 1.1", "Leaf 1.2"] },
       { "label": "Branch 2", "children": ["Leaf 2.1", "Leaf 2.2"] }
     ]
   }

3. "math_graph" - For mathematical functions, data trends, charts
   visualData: {
     "functions": [
       { "expression": "x**2", "label": "Quadratic", "color": "blue" },
       { "expression": "2*x + 1", "label": "Linear", "color": "green" }
     ],
     "xRange": [-5, 5],
     "yRange": [-2, 25],
     "xLabel": "Time",
     "yLabel": "Value"
   }

4. "animated_list" - For key points, features, steps
   visualData: {
     "items": [
       { "text": "First important point", "icon": "arrow" },
       { "text": "Second key concept", "icon": "star" },
       { "text": "Third takeaway", "icon": "check" }
     ],
     "style": "cascade"
   }

5. "code_walkthrough" - For algorithms, code explanations
   visualData: {
     "language": "python",
     "code": "def example():\\n    return 'Hello'",
     "highlights": [
       { "lines": [1], "label": "Function definition" },
       { "lines": [2], "label": "Return statement" }
     ]
   }

6. "concept_diagram" - For showing relationships between ideas
   visualData: {
     "centerConcept": "Main Idea",
     "relatedConcepts": [
       { "label": "Related 1", "connection": "enables" },
       { "label": "Related 2", "connection": "requires" },
       { "label": "Related 3", "connection": "produces" }
     ]
   }

7. "timeline" - For history, evolution, sequences
   visualData: {
     "events": [
       { "year": "1950", "label": "Beginning", "description": "The start" },
       { "year": "2000", "label": "Growth", "description": "Expansion" },
       { "year": "2024", "label": "Today", "description": "Current state" }
     ]
   }

8. "comparison" - For comparing options, pros/cons
   visualData: {
     "items": [
       { "name": "Option A", "pros": ["Fast", "Simple"], "cons": ["Limited"] },
       { "name": "Option B", "pros": ["Powerful", "Flexible"], "cons": ["Complex"] }
     ],
     "layout": "side_by_side"
   }

9. "process_flow" - For workflows, pipelines, step-by-step
   visualData: {
     "steps": [
       { "label": "Input", "description": "Data enters" },
       { "label": "Process", "description": "Transform" },
       { "label": "Output", "description": "Results" }
     ],
     "showArrows": true
   }

10. "equation_derivation" - For mathematical proofs, formulas
    visualData: {
      "steps": ["E = mc^2", "E/m = c^2", "c = sqrt(E/m)"],
      "explanations": ["Einstein's equation", "Divide by mass", "Solve for c"]
    }

=== GUIDELINES ===
- Create 8-12 slides for a 5-10 minute video
- Each slide MUST have a visualType and matching visualData structure
- Narration should be 60-100 words per slide, conversational and engaging
- Use variety in visualization types - don't repeat the same type consecutively
- First slide should be introduction (use "animated_list" or "concept_diagram")
- Last slide should be conclusion/summary
- Match visualization type to content: neural_network for AI topics, math_graph for data/statistics, timeline for history, etc.
- Duration per slide: 30-60 seconds based on content complexity
- Include 3-4 bullet points that summarize the core message of each slide

Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational video scriptwriter who creates 3Blue1Brown-style content. You always provide complete, structured visualData for each slide to enable professional Manim animations. Your scripts are engaging, well-paced, and visually rich.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000
    });

    const scriptData = JSON.parse(response.choices[0].message.content);

    // Validate the response structure
    if (!scriptData.title || !scriptData.slides || !Array.isArray(scriptData.slides)) {
      throw new Error('Invalid script structure from OpenAI');
    }

    // Ensure each slide has required fields with defaults
    scriptData.slides = scriptData.slides.map((slide, index) => ({
      slideNumber: slide.slideNumber || index + 1,
      heading: slide.heading || `Slide ${index + 1}`,
      narration: slide.narration || '',
      visualType: slide.visualType || 'animated_list',
      visualData: slide.visualData || getDefaultVisualData(slide.visualType),
      bulletPoints: slide.bulletPoints || [],
      duration: slide.duration || 40
    }));

    return scriptData;
  } catch (error) {
    console.error('OpenAI script generation error:', error.message);
    throw new Error(`Failed to generate video script: ${error.message}`);
  }
}

/**
 * Get default visualData for a visualization type
 * @param {string} visualType - The type of visualization
 * @returns {Object} Default visualData structure
 */
function getDefaultVisualData(visualType) {
  const defaults = {
    neural_network: { layers: [3, 5, 5, 2], labels: ['Input', 'Hidden', 'Output'], showSignalFlow: true },
    tree_hierarchy: { rootLabel: 'Main', children: [{ label: 'A', children: ['A1', 'A2'] }] },
    math_graph: { functions: [{ expression: 'x**2', label: 'f(x)', color: 'blue' }], xRange: [-5, 5], yRange: [0, 25] },
    animated_list: { items: [{ text: 'Point 1', icon: 'arrow' }], style: 'cascade' },
    code_walkthrough: { language: 'python', code: '# Code example', highlights: [] },
    concept_diagram: { centerConcept: 'Main', relatedConcepts: [{ label: 'Related', connection: 'links to' }] },
    timeline: { events: [{ year: '2024', label: 'Now', description: 'Current' }] },
    comparison: { items: [{ name: 'Option', pros: ['Pro'], cons: ['Con'] }], layout: 'side_by_side' },
    process_flow: { steps: [{ label: 'Step 1', description: 'First step' }], showArrows: true },
    equation_derivation: { steps: ['a = b'], explanations: ['Start'] }
  };
  return defaults[visualType] || defaults.animated_list;
}

/**
 * Extract and clean content from URL
 * @param {string} url - URL to extract content from
 * @returns {Promise<Object>} Extracted title and content
 */
async function extractContentFromURL(url) {
  const axios = require('axios');
  const cheerio = require('cheerio');

  try {
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, iframe, noscript').remove();

    // Try to extract title
    let title = $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled Content';

    // Try to extract main content
    let content = '';

    // Common content selectors
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.article-content',
      '.post-content',
      '#content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback: get all paragraph text
    if (!content || content.length < 500) {
      content = $('p').map((i, el) => $(el).text()).get().join('\n\n');
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n+/g, '\n\n') // Multiple newlines to double newline
      .trim();

    // Validate we have enough content
    if (content.length < 200) {
      throw new Error('Insufficient content extracted from URL. Please try a different URL with more text content.');
    }

    return {
      title: title.substring(0, 200), // Limit title length
      content: content.substring(0, 15000) // Limit content for processing
    };
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error('Invalid URL or website not accessible');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

/**
 * Generate Manim Python code using AI for a specific slide
 * Creates custom, creative animations tailored to content
 * @param {Object} slide - Slide object with heading, narration, bulletPoints
 * @param {number} slideIndex - Index of the slide
 * @param {string} theme - Visual theme (math, science, programming, business, general)
 * @returns {Promise<string>} Generated Manim Python code
 */
async function generateManimCodeWithAI(slide, slideIndex, theme = 'general') {
  const heading = slide.heading || `Slide ${slideIndex + 1}`;
  const narration = slide.narration || '';
  const bulletPoints = slide.bulletPoints || [];
  const visualType = slide.visualType || 'animated_list';
  const visualData = slide.visualData || {};

  const prompt = `You are an expert Manim animator who creates stunning 3Blue1Brown-style educational videos.

Generate a complete Manim Python scene class for this slide:

SLIDE CONTENT:
- Heading: "${heading}"
- Narration: "${narration.substring(0, 500)}"
- Key Points: ${JSON.stringify(bulletPoints.slice(0, 4))}
- Suggested Visual Type: ${visualType}
- Visual Data: ${JSON.stringify(visualData)}
- Theme: ${theme}

REQUIREMENTS:
1. Create a class named "Slide${slideIndex}Scene" that extends Scene (or ThreeDScene if 3D needed)
2. Use professional 3Blue1Brown color scheme: background "#1a1a2e", BLUE_C, GREEN_C, GOLD, WHITE
3. Start with an animated title using Write()
4. Create engaging animations that illustrate the content
5. Use smooth transitions (FadeIn, FadeOut, Transform, Create, Write)
6. Animation should be 20-30 seconds total
7. End with self.wait() and fade out all mobjects
8. DO NOT use LaTeX/MathTex - use Text() for all text to avoid errors
9. Keep code simple and robust - avoid complex custom classes
10. ONLY use Manim classes that exist - NO made-up classes!

VALID MANIM CLASSES (USE ONLY THESE):
- Shapes: Circle, Square, Rectangle, Triangle, Polygon, Dot, Line, Arrow, Arc, Ellipse, RoundedRectangle
- Text: Text, Paragraph (NO MathTex, NO Tex, NO Checkmark, NO Star)
- Groups: VGroup, Group
- Positioning: UP, DOWN, LEFT, RIGHT, ORIGIN, UL, UR, DL, DR
- Animations: Write, Create, FadeIn, FadeOut, Transform, ReplacementTransform, GrowFromCenter, Indicate, MoveToTarget
- Colors: RED, BLUE, GREEN, YELLOW, WHITE, GRAY, GOLD, ORANGE, PURPLE, TEAL, PINK, RED_C, BLUE_C, GREEN_C

DO NOT USE: Checkmark, Star, Emoji, Icon, Image, or any other non-standard Manim class

MANIM IMPORTS AVAILABLE:
from manim import *
import numpy as np

Return ONLY the Python class code, no explanations or markdown. The code must be syntactically valid Python.

Example structure:
class Slide${slideIndex}Scene(Scene):
    def construct(self):
        # Title
        title = Text("${heading.substring(0, 50)}", font_size=44, color=BLUE_C)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Main animation content here...

        self.wait(2)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Use GPT-4o for better code generation
      messages: [
        {
          role: 'system',
          content: 'You are an expert Manim animator. You write clean, working Manim code that creates beautiful educational animations. You always use Text() instead of MathTex to avoid LaTeX errors. Your code is robust and handles edge cases.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let code = response.choices[0].message.content;

    // Clean up the response - remove markdown code blocks if present
    code = code.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();

    // Remove redundant imports that AI sometimes adds
    code = code.replace(/^from manim import \*\n?/gm, '');
    code = code.replace(/^import numpy as np\n?/gm, '');

    // Validate basic structure
    if (!code.includes(`class Slide${slideIndex}Scene`) || !code.includes('def construct')) {
      console.warn(`AI generated invalid code structure for slide ${slideIndex}, using template fallback`);
      return null; // Signal to use template fallback
    }

    // Fix common AI mistakes - replace non-existent classes
    code = code.replace(/Checkmark\(\)/g, 'Text("✓", font_size=32, color=GREEN_C)');
    code = code.replace(/Star\(\)/g, 'Circle(radius=0.15, color=GOLD, fill_opacity=1)');
    code = code.replace(/Icon\([^)]*\)/g, 'Circle(radius=0.1, color=WHITE, fill_opacity=1)');

    // Replace LaTeX-dependent classes with Text() to avoid LaTeX requirement
    // MathTex("...") -> Text("...", font_size=36)
    code = code.replace(/MathTex\s*\(\s*r?"([^"]*)"\s*\)/g, 'Text("$1", font_size=36)');
    code = code.replace(/MathTex\s*\(\s*r?'([^']*)'\s*\)/g, "Text('$1', font_size=36)");
    // Tex("...") -> Text("...", font_size=36)
    code = code.replace(/Tex\s*\(\s*r?"([^"]*)"\s*\)/g, 'Text("$1", font_size=36)');
    code = code.replace(/Tex\s*\(\s*r?'([^']*)'\s*\)/g, "Text('$1', font_size=36)");
    // Handle MathTex/Tex with additional parameters
    code = code.replace(/MathTex\s*\(/g, 'Text(');
    code = code.replace(/Tex\s*\(/g, 'Text(');

    // Fix overly long text that could cause rendering issues
    code = code.replace(/Text\(\s*"([^"]{200,})"/g, (match, text) => {
      return `Text("${text.substring(0, 150)}..."`;
    });

    console.log(`✓ AI generated custom Manim code for slide ${slideIndex}`);
    return code;

  } catch (error) {
    console.error(`AI Manim generation error for slide ${slideIndex}:`, error.message);
    return null; // Signal to use template fallback
  }
}

/**
 * Generate Manim code for all slides using AI with fallback to templates
 * @param {Array} slides - Array of slide objects
 * @param {string} theme - Visual theme
 * @returns {Promise<Array>} Array of {slideIndex, code, isAIGenerated}
 */
async function generateAllManimCodeWithAI(slides, theme = 'general') {
  const results = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];

    // Try AI generation
    const aiCode = await generateManimCodeWithAI(slide, i, theme);

    if (aiCode) {
      results.push({
        slideIndex: i,
        code: aiCode,
        isAIGenerated: true
      });
    } else {
      // Will use template fallback in video.service.js
      results.push({
        slideIndex: i,
        code: null,
        isAIGenerated: false
      });
    }
  }

  return results;
}

module.exports = {
  generateVideoScript,
  extractContentFromURL,
  getDefaultVisualData,
  generateManimCodeWithAI,
  generateAllManimCodeWithAI
};
