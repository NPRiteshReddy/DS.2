import { useState, useEffect } from 'react';
import {
    Plus,
    Folder,
    BookOpen,
    Trash2,
    Edit,
    Play,
    RotateCcw,
    Check,
    X,
    ChevronLeft,
    Layers,
    Brain,
    Target,
    Clock
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const deckColors = {
    indigo: 'from-indigo-500 to-purple-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-fuchsia-500'
};

const FlashcardsPage = () => {
    const { token } = useAuth();
    const [view, setView] = useState('decks'); // decks, deck, study
    const [decks, setDecks] = useState([]);
    const [currentDeck, setCurrentDeck] = useState(null);
    const [studyCards, setStudyCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showDeckModal, setShowDeckModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [editingDeck, setEditingDeck] = useState(null);
    const [editingCard, setEditingCard] = useState(null);

    // Form data
    const [deckForm, setDeckForm] = useState({ title: '', description: '', category: '', color: 'indigo' });
    const [cardForm, setCardForm] = useState({ front: '', back: '' });

    useEffect(() => {
        fetchDecks();
        fetchStats();
    }, []);

    const fetchDecks = async () => {
        try {
            const response = await axios.get(`${API_URL}/flashcards/decks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) setDecks(response.data.data);
        } catch (err) {
            console.error('Failed to fetch decks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/flashcards/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) setStats(response.data.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchDeck = async (deckId) => {
        try {
            const response = await axios.get(`${API_URL}/flashcards/decks/${deckId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCurrentDeck(response.data.data);
                setView('deck');
            }
        } catch (err) {
            console.error('Failed to fetch deck:', err);
        }
    };

    const startStudy = async (deckId) => {
        try {
            const response = await axios.get(`${API_URL}/flashcards/decks/${deckId}/study`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success && response.data.data.length > 0) {
                setStudyCards(response.data.data);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setView('study');
            } else {
                alert('No cards due for review!');
            }
        } catch (err) {
            console.error('Failed to start study:', err);
        }
    };

    const reviewCard = async (quality) => {
        const card = studyCards[currentCardIndex];
        try {
            await axios.post(
                `${API_URL}/flashcards/cards/${card.id}/review`,
                { quality },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (currentCardIndex < studyCards.length - 1) {
                setCurrentCardIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                // Study session complete
                setView('decks');
                fetchDecks();
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to review card:', err);
        }
    };

    const saveDeck = async () => {
        try {
            if (editingDeck) {
                await axios.put(`${API_URL}/flashcards/decks/${editingDeck.id}`, deckForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/flashcards/decks`, deckForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowDeckModal(false);
            setEditingDeck(null);
            setDeckForm({ title: '', description: '', category: '', color: 'indigo' });
            fetchDecks();
        } catch (err) {
            console.error('Failed to save deck:', err);
        }
    };

    const deleteDeck = async (deckId) => {
        if (!confirm('Delete this deck and all its cards?')) return;
        try {
            await axios.delete(`${API_URL}/flashcards/decks/${deckId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDecks();
        } catch (err) {
            console.error('Failed to delete deck:', err);
        }
    };

    const saveCard = async () => {
        try {
            if (editingCard) {
                await axios.put(`${API_URL}/flashcards/cards/${editingCard.id}`, cardForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/flashcards/decks/${currentDeck.id}/cards`, cardForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowCardModal(false);
            setEditingCard(null);
            setCardForm({ front: '', back: '' });
            fetchDeck(currentDeck.id);
        } catch (err) {
            console.error('Failed to save card:', err);
        }
    };

    const deleteCard = async (cardId) => {
        if (!confirm('Delete this card?')) return;
        try {
            await axios.delete(`${API_URL}/flashcards/cards/${cardId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDeck(currentDeck.id);
        } catch (err) {
            console.error('Failed to delete card:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Study View
    if (view === 'study' && studyCards.length > 0) {
        const card = studyCards[currentCardIndex];
        return (
            <div className="min-h-screen bg-gray-900 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => setView('decks')} className="flex items-center gap-2 text-gray-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" /> Exit Study
                        </button>
                        <span className="text-gray-400">
                            {currentCardIndex + 1} / {studyCards.length}
                        </span>
                    </div>

                    {/* Flashcard */}
                    <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="relative h-80 cursor-pointer perspective-1000"
                    >
                        <div className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 flex items-center justify-center backface-hidden">
                                <p className="text-2xl text-white text-center font-medium">{card.front}</p>
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 flex items-center justify-center rotate-y-180 backface-hidden">
                                <p className="text-2xl text-white text-center font-medium">{card.back}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-gray-500 mt-4">Tap card to flip</p>

                    {/* Rating Buttons */}
                    {isFlipped && (
                        <div className="mt-8 space-y-4">
                            <p className="text-center text-gray-400">How well did you know this?</p>
                            <div className="flex gap-2">
                                {[
                                    { quality: 1, label: 'Again', color: 'bg-red-600 hover:bg-red-700' },
                                    { quality: 3, label: 'Hard', color: 'bg-orange-600 hover:bg-orange-700' },
                                    { quality: 4, label: 'Good', color: 'bg-green-600 hover:bg-green-700' },
                                    { quality: 5, label: 'Easy', color: 'bg-blue-600 hover:bg-blue-700' }
                                ].map(({ quality, label, color }) => (
                                    <button
                                        key={quality}
                                        onClick={() => reviewCard(quality)}
                                        className={`flex-1 py-3 rounded-lg text-white font-medium ${color}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Deck Detail View
    if (view === 'deck' && currentDeck) {
        return (
            <div className="min-h-screen bg-gray-900 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => { setView('decks'); setCurrentDeck(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                        <ChevronLeft className="w-5 h-5" /> Back to Decks
                    </button>

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{currentDeck.title}</h1>
                            {currentDeck.description && <p className="text-gray-400">{currentDeck.description}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => startStudy(currentDeck.id)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                            >
                                <Play className="w-4 h-4" /> Study
                            </button>
                            <button
                                onClick={() => { setCardForm({ front: '', back: '' }); setEditingCard(null); setShowCardModal(true); }}
                                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                <Plus className="w-4 h-4" /> Add Card
                            </button>
                        </div>
                    </div>

                    {/* Cards List */}
                    <div className="space-y-3">
                        {currentDeck.cards?.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                No cards yet. Add your first card!
                            </div>
                        ) : (
                            currentDeck.cards?.map((card) => (
                                <div key={card.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{card.front}</p>
                                            <p className="text-gray-400 text-sm mt-1">{card.back}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setCardForm({ front: card.front, back: card.back }); setEditingCard(card); setShowCardModal(true); }}
                                                className="p-2 text-gray-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteCard(card.id)} className="p-2 text-gray-400 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Add/Edit Card Modal */}
                {showCardModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">{editingCard ? 'Edit Card' : 'Add Card'}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Front (Question)</label>
                                    <textarea
                                        value={cardForm.front}
                                        onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="What is the question?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Back (Answer)</label>
                                    <textarea
                                        value={cardForm.back}
                                        onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="What is the answer?"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button onClick={() => setShowCardModal(false)} className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                                <button onClick={saveCard} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Decks List View
    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Flashcards</h1>
                        <p className="text-gray-400">Learn with spaced repetition</p>
                    </div>
                    <button
                        onClick={() => { setDeckForm({ title: '', description: '', category: '', color: 'indigo' }); setEditingDeck(null); setShowDeckModal(true); }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus className="w-5 h-5" /> New Deck
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Decks', value: stats.totalDecks || 0, icon: Folder },
                        { label: 'Total Cards', value: stats.totalCards || 0, icon: Layers },
                        { label: 'Due Today', value: stats.cardsDue || 0, icon: Clock },
                        { label: 'Reviewed Today', value: stats.reviewsToday || 0, icon: Target }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                            <stat.icon className="w-5 h-5 text-indigo-400 mb-2" />
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Decks Grid */}
                {decks.length === 0 ? (
                    <div className="text-center py-16">
                        <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">No decks yet</h3>
                        <p className="text-gray-500">Create your first flashcard deck to start learning!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck) => (
                            <div
                                key={deck.id}
                                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
                            >
                                <div className={`h-2 bg-gradient-to-r ${deckColors[deck.color] || deckColors.indigo}`} />
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-white">{deck.title}</h3>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setDeckForm({ title: deck.title, description: deck.description || '', category: deck.category || '', color: deck.color }); setEditingDeck(deck); setShowDeckModal(true); }}
                                                className="p-1 text-gray-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteDeck(deck.id)} className="p-1 text-gray-400 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {deck.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{deck.description}</p>}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{deck.cards_count || 0} cards</span>
                                        {deck.cards_due > 0 && (
                                            <span className="text-orange-400">{deck.cards_due} due</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => fetchDeck(deck.id)}
                                            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                                        >
                                            View Cards
                                        </button>
                                        <button
                                            onClick={() => startStudy(deck.id)}
                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                                        >
                                            <Play className="w-4 h-4" /> Study
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Deck Modal */}
                {showDeckModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">{editingDeck ? 'Edit Deck' : 'New Deck'}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={deckForm.title}
                                        onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="e.g., Spanish Vocabulary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={deckForm.description}
                                        onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                                    <div className="flex gap-2">
                                        {Object.keys(deckColors).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setDeckForm({ ...deckForm, color })}
                                                className={`w-8 h-8 rounded-full bg-gradient-to-r ${deckColors[color]} ${deckForm.color === color ? 'ring-2 ring-white' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button onClick={() => setShowDeckModal(false)} className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                                <button onClick={saveDeck} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
        </div>
    );
};

export default FlashcardsPage;
