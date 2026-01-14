/**
 * News Controller
 * Handles news feed and user interests endpoints
 */

const { supabase } = require('../config/database');
const firecrawlService = require('../services/firecrawl.service');

/**
 * Get available interest categories
 * GET /api/news/categories
 */
const getCategories = async (req, res) => {
    try {
        const categories = firecrawlService.getInterestCategories();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get categories'
        });
    }
};

/**
 * Get user's interests
 * GET /api/news/interests
 */
const getUserInterests = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('user_interests')
            .select('interests')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({
            success: true,
            data: {
                interests: data?.interests || [],
                hasInterests: data?.interests?.length > 0
            }
        });
    } catch (error) {
        console.error('Get user interests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user interests'
        });
    }
};

/**
 * Update user's interests
 * PUT /api/news/interests
 */
const updateUserInterests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { interests } = req.body;

        if (!Array.isArray(interests)) {
            return res.status(400).json({
                success: false,
                error: 'Interests must be an array'
            });
        }

        // Validate interests against available categories
        const validCategories = Object.keys(firecrawlService.INTEREST_CATEGORIES);
        const validInterests = interests.filter(i => validCategories.includes(i));

        // Upsert user interests
        const { data, error } = await supabase
            .from('user_interests')
            .upsert({
                user_id: userId,
                interests: validInterests,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                interests: data.interests
            },
            message: 'Interests updated successfully'
        });
    } catch (error) {
        console.error('Update user interests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update interests'
        });
    }
};

/**
 * Get personalized news feed
 * GET /api/news
 */
const getNewsFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const { refresh } = req.query;

        // Get user interests
        const { data: interestsData, error: interestsError } = await supabase
            .from('user_interests')
            .select('interests')
            .eq('user_id', userId)
            .single();

        if (interestsError && interestsError.code !== 'PGRST116') {
            throw interestsError;
        }

        const interests = interestsData?.interests || [];

        if (interests.length === 0) {
            return res.json({
                success: true,
                data: {
                    articles: [],
                    needsInterests: true,
                    message: 'Please select your interests to get personalized news'
                }
            });
        }

        // Check if we have cached articles for this user
        const { data: cachedFeed, error: cacheError } = await supabase
            .from('user_news_feed')
            .select(`
        id,
        relevance_score,
        is_read,
        is_saved,
        created_at,
        news_articles (
          id,
          title,
          description,
          url,
          source,
          image_url,
          published_at,
          category
        )
      `)
            .eq('user_id', userId)
            .order('relevance_score', { ascending: false })
            .limit(50);

        // If we have recent cached articles and not forcing refresh, return them
        const hasRecentCache = cachedFeed && cachedFeed.length > 0 && !refresh;

        if (hasRecentCache) {
            const articles = cachedFeed.map(item => ({
                feedId: item.id,
                ...item.news_articles,
                relevanceScore: item.relevance_score,
                isRead: item.is_read,
                isSaved: item.is_saved
            }));

            return res.json({
                success: true,
                data: {
                    articles,
                    fromCache: true,
                    interests
                }
            });
        }

        // Fetch fresh news from Firecrawl
        if (!firecrawlService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'News service is not configured. Please add FIRECRAWL_API_KEY.'
            });
        }

        const freshArticles = await firecrawlService.fetchNewsForInterests(interests, 5);

        // Store articles and create feed entries
        for (const article of freshArticles) {
            // Upsert article (avoid duplicates by URL)
            const { data: savedArticle, error: articleError } = await supabase
                .from('news_articles')
                .upsert({
                    title: article.title,
                    description: article.description,
                    content: article.content,
                    url: article.url,
                    source: article.source,
                    image_url: article.imageUrl,
                    published_at: article.publishedAt,
                    category: article.category,
                    relevance_tags: article.relevanceTags
                }, {
                    onConflict: 'url'
                })
                .select('id')
                .single();

            if (articleError) {
                console.error('Error saving article:', articleError);
                continue;
            }

            // Create feed entry for user
            await supabase
                .from('user_news_feed')
                .upsert({
                    user_id: userId,
                    article_id: savedArticle.id,
                    relevance_score: article.relevanceScore
                }, {
                    onConflict: 'user_id,article_id'
                });
        }

        // Log the fetch
        await supabase.from('news_fetch_logs').insert({
            user_id: userId,
            category: interests.join(','),
            articles_fetched: freshArticles.length
        });

        res.json({
            success: true,
            data: {
                articles: freshArticles.map(a => ({
                    title: a.title,
                    description: a.description,
                    url: a.url,
                    source: a.source,
                    imageUrl: a.imageUrl,
                    publishedAt: a.publishedAt,
                    category: a.category,
                    relevanceScore: a.relevanceScore,
                    isRead: false,
                    isSaved: false
                })),
                fromCache: false,
                interests
            }
        });
    } catch (error) {
        console.error('Get news feed error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get news feed'
        });
    }
};

/**
 * Mark article as read
 * POST /api/news/:articleId/read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { articleId } = req.params;

        const { error } = await supabase
            .from('user_news_feed')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('article_id', articleId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark as read'
        });
    }
};

/**
 * Toggle save/bookmark article
 * POST /api/news/:articleId/save
 */
const toggleSave = async (req, res) => {
    try {
        const userId = req.user.id;
        const { articleId } = req.params;

        // Get current saved status
        const { data: current } = await supabase
            .from('user_news_feed')
            .select('is_saved')
            .eq('user_id', userId)
            .eq('article_id', articleId)
            .single();

        const newSavedStatus = !(current?.is_saved || false);

        const { error } = await supabase
            .from('user_news_feed')
            .update({ is_saved: newSavedStatus })
            .eq('user_id', userId)
            .eq('article_id', articleId);

        if (error) throw error;

        res.json({
            success: true,
            data: { isSaved: newSavedStatus }
        });
    } catch (error) {
        console.error('Toggle save error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle save'
        });
    }
};

/**
 * Get saved articles
 * GET /api/news/saved
 */
const getSavedArticles = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('user_news_feed')
            .select(`
        id,
        created_at,
        news_articles (
          id,
          title,
          description,
          url,
          source,
          image_url,
          published_at,
          category
        )
      `)
            .eq('user_id', userId)
            .eq('is_saved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const articles = data.map(item => ({
            feedId: item.id,
            ...item.news_articles,
            savedAt: item.created_at
        }));

        res.json({
            success: true,
            data: { articles }
        });
    } catch (error) {
        console.error('Get saved articles error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get saved articles'
        });
    }
};

module.exports = {
    getCategories,
    getUserInterests,
    updateUserInterests,
    getNewsFeed,
    markAsRead,
    toggleSave,
    getSavedArticles
};
