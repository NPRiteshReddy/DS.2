/**
 * Flashcards Controller
 * Handles flashcard decks and cards with spaced repetition (SM-2)
 */

const { supabase } = require('../config/database');

// ============================================================================
// SM-2 Spaced Repetition Algorithm
// ============================================================================
const calculateNextReview = (quality, repetitions, easeFactor, interval) => {
    // quality: 0-5 (0-2 = fail, 3-5 = pass)
    let newRepetitions = repetitions;
    let newInterval = interval;
    let newEaseFactor = easeFactor;

    if (quality < 3) {
        // Failed - reset
        newRepetitions = 0;
        newInterval = 1;
    } else {
        // Passed
        if (repetitions === 0) {
            newInterval = 1;
        } else if (repetitions === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * easeFactor);
        }
        newRepetitions = repetitions + 1;
    }

    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
        repetitions: newRepetitions,
        easeFactor: Math.round(newEaseFactor * 100) / 100,
        interval: newInterval,
        nextReview: nextReview.toISOString().split('T')[0]
    };
};

// ============================================================================
// Deck Operations
// ============================================================================

/**
 * Create a new deck
 * POST /api/flashcards/decks
 */
const createDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, category, color } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const { data, error } = await supabase
            .from('flashcard_decks')
            .insert({
                user_id: userId,
                title,
                description,
                category,
                color: color || 'indigo'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Deck created'
        });
    } catch (error) {
        console.error('Create deck error:', error);
        res.status(500).json({ success: false, error: 'Failed to create deck' });
    }
};

/**
 * Get all decks for user
 * GET /api/flashcards/decks
 */
const getDecks = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('flashcard_decks')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Get cards due for each deck
        const decksWithStats = await Promise.all(data.map(async (deck) => {
            const { count } = await supabase
                .from('flashcards')
                .select('*', { count: 'exact', head: true })
                .eq('deck_id', deck.id)
                .lte('next_review', new Date().toISOString().split('T')[0]);

            return { ...deck, cards_due: count || 0 };
        }));

        res.json({ success: true, data: decksWithStats });
    } catch (error) {
        console.error('Get decks error:', error);
        res.status(500).json({ success: false, error: 'Failed to get decks' });
    }
};

/**
 * Get single deck with cards
 * GET /api/flashcards/decks/:id
 */
const getDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: deck, error: deckError } = await supabase
            .from('flashcard_decks')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (deckError) throw deckError;

        const { data: cards, error: cardsError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('deck_id', id)
            .order('created_at', { ascending: true });

        if (cardsError) throw cardsError;

        res.json({
            success: true,
            data: { ...deck, cards }
        });
    } catch (error) {
        console.error('Get deck error:', error);
        res.status(500).json({ success: false, error: 'Failed to get deck' });
    }
};

/**
 * Update deck
 * PUT /api/flashcards/decks/:id
 */
const updateDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, category, color } = req.body;

        const { data, error } = await supabase
            .from('flashcard_decks')
            .update({ title, description, category, color })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Update deck error:', error);
        res.status(500).json({ success: false, error: 'Failed to update deck' });
    }
};

/**
 * Delete deck
 * DELETE /api/flashcards/decks/:id
 */
const deleteDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('flashcard_decks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Deck deleted' });
    } catch (error) {
        console.error('Delete deck error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete deck' });
    }
};

// ============================================================================
// Card Operations
// ============================================================================

/**
 * Add card to deck
 * POST /api/flashcards/decks/:id/cards
 */
const addCard = async (req, res) => {
    try {
        const { id: deckId } = req.params;
        const { front, back } = req.body;

        if (!front || !back) {
            return res.status(400).json({ success: false, error: 'Front and back are required' });
        }

        const { data, error } = await supabase
            .from('flashcards')
            .insert({
                deck_id: deckId,
                front,
                back
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Add card error:', error);
        res.status(500).json({ success: false, error: 'Failed to add card' });
    }
};

/**
 * Update card
 * PUT /api/flashcards/cards/:id
 */
const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { front, back } = req.body;

        const { data, error } = await supabase
            .from('flashcards')
            .update({ front, back })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ success: false, error: 'Failed to update card' });
    }
};

/**
 * Delete card
 * DELETE /api/flashcards/cards/:id
 */
const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Card deleted' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete card' });
    }
};

// ============================================================================
// Study Operations
// ============================================================================

/**
 * Get cards due for review
 * GET /api/flashcards/decks/:id/study
 */
const getStudyCards = async (req, res) => {
    try {
        const { id: deckId } = req.params;
        const { limit = 20 } = req.query;
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('deck_id', deckId)
            .lte('next_review', today)
            .order('next_review', { ascending: true })
            .limit(parseInt(limit));

        if (error) throw error;

        // Update deck last_studied_at
        await supabase
            .from('flashcard_decks')
            .update({ last_studied_at: new Date().toISOString() })
            .eq('id', deckId);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get study cards error:', error);
        res.status(500).json({ success: false, error: 'Failed to get study cards' });
    }
};

/**
 * Review a card (SM-2 update)
 * POST /api/flashcards/cards/:id/review
 */
const reviewCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { quality } = req.body; // 0-5

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ success: false, error: 'Quality must be 0-5' });
        }

        // Get current card data
        const { data: card, error: cardError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('id', id)
            .single();

        if (cardError) throw cardError;

        // Calculate next review using SM-2
        const updated = calculateNextReview(
            quality,
            card.repetitions,
            card.ease_factor,
            card.interval_days
        );

        // Update card
        const { data, error } = await supabase
            .from('flashcards')
            .update({
                repetitions: updated.repetitions,
                ease_factor: updated.easeFactor,
                interval_days: updated.interval,
                next_review: updated.nextReview,
                difficulty: quality < 3 ? card.difficulty + 1 : card.difficulty,
                last_reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log the review
        await supabase
            .from('flashcard_reviews')
            .insert({
                user_id: userId,
                card_id: id,
                deck_id: card.deck_id,
                quality
            });

        res.json({
            success: true,
            data,
            message: quality >= 3 ? 'Great job!' : 'Keep practicing!'
        });
    } catch (error) {
        console.error('Review card error:', error);
        res.status(500).json({ success: false, error: 'Failed to review card' });
    }
};

/**
 * Get overall flashcard stats
 * GET /api/flashcards/stats
 */
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Get total decks and cards
        const { data: decks } = await supabase
            .from('flashcard_decks')
            .select('id, cards_count')
            .eq('user_id', userId);

        const totalDecks = decks?.length || 0;
        const totalCards = decks?.reduce((sum, d) => sum + (d.cards_count || 0), 0) || 0;

        // Get cards due today
        const deckIds = decks?.map(d => d.id) || [];
        let cardsDue = 0;
        if (deckIds.length > 0) {
            const { count } = await supabase
                .from('flashcards')
                .select('*', { count: 'exact', head: true })
                .in('deck_id', deckIds)
                .lte('next_review', today);
            cardsDue = count || 0;
        }

        // Get reviews today
        const { count: reviewsToday } = await supabase
            .from('flashcard_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today);

        res.json({
            success: true,
            data: {
                totalDecks,
                totalCards,
                cardsDue,
                reviewsToday: reviewsToday || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
};

module.exports = {
    createDeck,
    getDecks,
    getDeck,
    updateDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    getStudyCards,
    reviewCard,
    getStats
};
