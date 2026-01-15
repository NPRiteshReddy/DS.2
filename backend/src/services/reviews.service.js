/**
 * Code Review Service
 * Handles repository ingestion and AI-powered code analysis
 */

const { spawn } = require('child_process');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Ingest a GitHub repository using gitingest Python package
 * @param {string} repoUrl - GitHub repository URL
 * @returns {Promise<Object>} Repository data with summary, tree, and content
 */
async function ingestRepository(repoUrl) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', '..', 'scripts', 'gitingest_wrapper.py');

    console.log(`  Ingesting repository: ${repoUrl}`);

    const process = spawn('python', [pythonScript, repoUrl], {
      timeout: 120000 // 2 minute timeout for large repos
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`  gitingest failed with code ${code}: ${stderr}`);
        reject(new Error(stderr || 'Failed to ingest repository'));
        return;
      }

      try {
        const result = JSON.parse(stdout);

        if (!result.success) {
          reject(new Error(result.error || 'Failed to ingest repository'));
          return;
        }

        console.log(`  Repository ingested: ${result.tree.split('\n').length} files`);
        resolve(result);
      } catch (e) {
        reject(new Error('Failed to parse gitingest output: ' + e.message));
      }
    });

    process.on('error', (err) => {
      reject(new Error('Failed to run gitingest: ' + err.message));
    });
  });
}

/**
 * Analyze repository code using GPT-4o
 * @param {Object} repoData - Repository data from gitingest
 * @param {string} repoName - Repository name (owner/repo)
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeCodeWithGPT4(repoData, repoName) {
  console.log(`  Analyzing code with GPT-4o...`);

  const prompt = `You are an expert code reviewer with deep knowledge of software engineering best practices, design patterns, and security. Analyze this GitHub repository and provide a comprehensive code review.

Repository: ${repoName}

## File Structure:
${repoData.tree.substring(0, 5000)}

## Code Content (sampled):
${repoData.content.substring(0, 25000)}

Provide a detailed JSON response with the following structure:
{
  "qualityScore": <number between 0-10 with one decimal, e.g., 7.5>,
  "strengths": [
    "<specific strength with example from code>",
    "<another strength>",
    "<at least 3-5 strengths>"
  ],
  "improvements": [
    "<specific improvement suggestion with file/location if applicable>",
    "<another improvement>",
    "<at least 3-5 improvements>"
  ],
  "keySuggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ],
  "fullReview": "<comprehensive 300-500 word review covering architecture, code quality, maintainability, potential issues, and recommendations>",
  "metrics": {
    "codeOrganization": <0-10>,
    "documentation": <0-10>,
    "bestPractices": <0-10>,
    "security": <0-10>,
    "testCoverage": <0-10>,
    "maintainability": <0-10>
  }
}

Be specific, reference actual files/patterns you see, and provide actionable feedback.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Always respond with valid JSON. Be thorough, specific, and constructive in your feedback.'
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

    const analysis = JSON.parse(response.choices[0].message.content);

    // Validate required fields
    if (typeof analysis.qualityScore !== 'number') {
      analysis.qualityScore = 5.0;
    }
    if (!Array.isArray(analysis.strengths)) {
      analysis.strengths = ['Code review completed'];
    }
    if (!Array.isArray(analysis.improvements)) {
      analysis.improvements = ['Consider adding more documentation'];
    }
    if (!Array.isArray(analysis.keySuggestions)) {
      analysis.keySuggestions = ['Review completed successfully'];
    }
    if (typeof analysis.fullReview !== 'string') {
      analysis.fullReview = 'Code review analysis completed.';
    }
    if (typeof analysis.metrics !== 'object') {
      analysis.metrics = {
        codeOrganization: 5,
        documentation: 5,
        bestPractices: 5,
        security: 5,
        testCoverage: 5,
        maintainability: 5
      };
    }

    console.log(`  Analysis complete: Quality score ${analysis.qualityScore}/10`);
    return analysis;

  } catch (error) {
    console.error(`  GPT-4o analysis error: ${error.message}`);
    throw new Error('Failed to analyze code: ' + error.message);
  }
}

module.exports = {
  ingestRepository,
  analyzeCodeWithGPT4
};
