import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    Database,
    MessageSquare,
    Eye,
    FileText,
    Settings,
    Shield,
    ChevronRight,
    Check,
    Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Interest category icons
const categoryIcons = {
    'AI/ML': Brain,
    'Data Science': Database,
    'LLMs': MessageSquare,
    'Computer Vision': Eye,
    'Research Papers': FileText,
    'MLOps': Settings,
    'AI Ethics': Shield
};

// Category descriptions
const categoryDescriptions = {
    'AI/ML': 'Machine learning, neural networks, deep learning',
    'Data Science': 'Data analysis, statistics, visualization',
    'LLMs': 'Large language models, GPT, transformers',
    'Computer Vision': 'Image recognition, object detection',
    'Research Papers': 'Academic research, arxiv papers',
    'MLOps': 'Model deployment, ML pipelines',
    'AI Ethics': 'AI safety, responsible AI, alignment'
};

const InterestsPage = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [categories, setCategories] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchUserInterests();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/news/categories`);
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            // Use default categories if API fails
            setCategories(Object.keys(categoryIcons).map(name => ({ name })));
        }
    };

    const fetchUserInterests = async () => {
        try {
            const response = await axios.get(`${API_URL}/news/interests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success && response.data.data.interests) {
                setSelectedInterests(response.data.data.interests);
            }
        } catch (err) {
            console.error('Failed to fetch user interests:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest) => {
        setSelectedInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            } else {
                return [...prev, interest];
            }
        });
    };

    const handleSave = async () => {
        if (selectedInterests.length < 1) {
            setError('Please select at least one interest');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await axios.put(
                `${API_URL}/news/interests`,
                { interests: selectedInterests },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate('/news');
        } catch (err) {
            setError('Failed to save interests. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Personalized News</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        What interests you?
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Select topics you're interested in to get personalized AI news delivered to your feed.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
                        {error}
                    </div>
                )}

                {/* Interest Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {categories.map((category) => {
                        const Icon = categoryIcons[category.name] || Brain;
                        const isSelected = selectedInterests.includes(category.name);

                        return (
                            <button
                                key={category.name}
                                onClick={() => toggleInterest(category.name)}
                                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                                        ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                                    }
                `}
                            >
                                {/* Checkmark */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${isSelected ? 'bg-indigo-500' : 'bg-gray-700'}
                `}>
                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
                                </div>

                                {/* Content */}
                                <h3 className={`font-semibold text-lg mb-2 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                    {category.name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {categoryDescriptions[category.name] || 'Related news and updates'}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Selected Count */}
                <div className="text-center mb-8">
                    <span className="text-gray-400">
                        {selectedInterests.length} {selectedInterests.length === 1 ? 'topic' : 'topics'} selected
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || selectedInterests.length === 0}
                        className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${selectedInterests.length > 0
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }
            `}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue to News Feed
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterestsPage;
