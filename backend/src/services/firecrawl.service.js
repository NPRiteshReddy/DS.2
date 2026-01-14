/**
 * Firecrawl Service
 * Handles integration with Firecrawl API for web scraping and news fetching
 */

const axios = require('axios');

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// AI-focused interest categories with search keywords
const INTEREST_CATEGORIES = {
    'AI/ML': ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning'],
    'Data Science': ['data science', 'data analysis', 'statistics', 'data visualization'],
    'LLMs': ['large language models', 'GPT', 'Claude', 'transformers', 'NLP', 'chatbot'],
    'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'CNN'],
    'Research Papers': ['research paper', 'arxiv', 'academic', 'peer review', 'study'],
    'MLOps': ['MLOps', 'model deployment', 'ML pipelines', 'kubernetes', 'docker'],
    'AI Ethics': ['AI safety', 'responsible AI', 'AI ethics', 'bias in AI', 'alignment']
};

// AI-focused news sources to prioritize
const AI_NEWS_SOURCES = [
    'arxiv.org',
    'openai.com',
    'deepmind.google',
    'ai.meta.com',
    'anthropic.com',
    'huggingface.co',
    'towardsdatascience.com',
    'paperswithcode.com',
    'techcrunch.com/category/artificial-intelligence',
    'venturebeat.com/category/ai'
];

/**
 * Search for news articles using Firecrawl's search endpoint
 * @param {string} query - Search query
 * @param {number} limit - Number of results to fetch
 * @returns {Promise<Array>} Array of article objects
 */
const searchNews = async (query, limit = 10) => {
    if (!FIRECRAWL_API_KEY) {
        throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    try {
        const response = await axios.post(
            `${FIRECRAWL_API_URL}/search`,
            {
                query: `${query} latest news 2026`,
                limit: limit,
                scrapeOptions: {
                    formats: ['markdown'],
                    onlyMainContent: true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.data) {
            return response.data.data.map(item => ({
                title: item.title || 'Untitled',
                description: item.description || extractDescription(item.markdown),
                content: item.markdown || '',
                url: item.url,
                source: extractSource(item.url),
                imageUrl: item.ogImage || item.image || null,
                publishedAt: item.publishedTime || new Date().toISOString()
            }));
        }

        return [];
    } catch (error) {
        console.error('Firecrawl search error:', error.message);
        throw new Error(`Failed to search news: ${error.message}`);
    }
};

/**
 * Scrape a single URL for article content
 * @param {string} url - Article URL to scrape
 * @returns {Promise<Object>} Article data
 */
const scrapeArticle = async (url) => {
    if (!FIRECRAWL_API_KEY) {
        throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    try {
        const response = await axios.post(
            `${FIRECRAWL_API_URL}/scrape`,
            {
                url: url,
                formats: ['markdown'],
                onlyMainContent: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.data) {
            const data = response.data.data;
            return {
                title: data.title || 'Untitled',
                description: data.description || extractDescription(data.markdown),
                content: data.markdown || '',
                url: url,
                source: extractSource(url),
                imageUrl: data.ogImage || data.image || null,
                publishedAt: data.publishedTime || new Date().toISOString()
            };
        }

        return null;
    } catch (error) {
        console.error('Firecrawl scrape error:', error.message);
        throw new Error(`Failed to scrape article: ${error.message}`);
    }
};

/**
 * Fetch news for specific interests
 * @param {Array<string>} interests - User's interest categories
 * @param {number} articlesPerInterest - Number of articles per interest
 * @returns {Promise<Array>} Array of article objects with relevance tags
 */
const fetchNewsForInterests = async (interests, articlesPerInterest = 5) => {
    const allArticles = [];
    const seenUrls = new Set();

    for (const interest of interests) {
        const keywords = INTEREST_CATEGORIES[interest];
        if (!keywords) continue;

        // Build search query from keywords
        const query = keywords.slice(0, 2).join(' OR ');

        try {
            const articles = await searchNews(query, articlesPerInterest);

            for (const article of articles) {
                // Avoid duplicates
                if (seenUrls.has(article.url)) continue;
                seenUrls.add(article.url);

                // Add relevance tags
                article.relevanceTags = [interest];
                article.category = interest;

                // Calculate relevance score based on keyword matches
                article.relevanceScore = calculateRelevanceScore(article, keywords);

                allArticles.push(article);
            }
        } catch (error) {
            console.error(`Error fetching news for ${interest}:`, error.message);
            // Continue with other interests
        }
    }

    // Sort by relevance score
    return allArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * Calculate relevance score based on keyword matches
 * @param {Object} article - Article object
 * @param {Array<string>} keywords - Keywords to match
 * @returns {number} Relevance score (0-1)
 */
const calculateRelevanceScore = (article, keywords) => {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
            matches++;
        }
    }

    return Math.min(matches / keywords.length, 1);
};

/**
 * Extract source name from URL
 * @param {string} url - Article URL
 * @returns {string} Source name
 */
const extractSource = (url) => {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch {
        return 'Unknown';
    }
};

/**
 * Extract description from markdown content
 * @param {string} markdown - Markdown content
 * @returns {string} First paragraph as description
 */
const extractDescription = (markdown) => {
    if (!markdown) return '';

    // Get first non-empty paragraph
    const paragraphs = markdown.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
    if (paragraphs.length > 0) {
        // Clean and truncate
        const desc = paragraphs[0].replace(/[#*_\[\]]/g, '').trim();
        return desc.length > 300 ? desc.substring(0, 297) + '...' : desc;
    }

    return '';
};

/**
 * Get available interest categories
 * @returns {Array} Array of category objects
 */
const getInterestCategories = () => {
    return Object.keys(INTEREST_CATEGORIES).map(name => ({
        name,
        keywords: INTEREST_CATEGORIES[name]
    }));
};

/**
 * Check if Firecrawl API is configured
 * @returns {boolean} True if API key is set
 */
const isConfigured = () => {
    return !!FIRECRAWL_API_KEY;
};

module.exports = {
    searchNews,
    scrapeArticle,
    fetchNewsForInterests,
    getInterestCategories,
    isConfigured,
    INTEREST_CATEGORIES,
    AI_NEWS_SOURCES
};
