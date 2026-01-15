/**
 * Flashcards Routes
 * API endpoints for flashcard decks and study
 */

const express = require('express');
const router = express.Router();
const flashcardsController = require('../controllers/flashcards.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Stats
router.get('/stats', flashcardsController.getStats);

// Decks
router.post('/decks', flashcardsController.createDeck);
router.get('/decks', flashcardsController.getDecks);
router.get('/decks/:id', flashcardsController.getDeck);
router.put('/decks/:id', flashcardsController.updateDeck);
router.delete('/decks/:id', flashcardsController.deleteDeck);

// Cards within a deck
router.post('/decks/:id/cards', flashcardsController.addCard);
router.get('/decks/:id/study', flashcardsController.getStudyCards);

// Individual card operations
router.put('/cards/:id', flashcardsController.updateCard);
router.delete('/cards/:id', flashcardsController.deleteCard);
router.post('/cards/:id/review', flashcardsController.reviewCard);

module.exports = router;
