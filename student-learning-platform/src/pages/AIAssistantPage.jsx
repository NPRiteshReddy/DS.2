import { useState, useEffect, useRef } from 'react';
import {
    Send,
    Plus,
    MessageSquare,
    Trash2,
    Sparkles,
    BookOpen,
    FileText,
    Layers,
    Loader2,
    ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AIAssistantPage = () => {
    const { token } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const response = await axios.get(`${API_URL}/assistant/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };

    const createSession = async () => {
        try {
            const response = await axios.post(
                `${API_URL}/assistant/sessions`,
                { title: 'New Chat' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setCurrentSession(response.data.data);
                setMessages([]);
                fetchSessions();
            }
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            const response = await axios.get(`${API_URL}/assistant/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCurrentSession(response.data.data);
                setMessages(response.data.data.messages || []);
            }
        } catch (err) {
            console.error('Failed to load session:', err);
        }
    };

    const deleteSession = async (sessionId) => {
        try {
            await axios.delete(`${API_URL}/assistant/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (currentSession?.id === sessionId) {
                setCurrentSession(null);
                setMessages([]);
            }
            fetchSessions();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        // Create session if none exists
        let sessionId = currentSession?.id;
        if (!sessionId) {
            try {
                const response = await axios.post(
                    `${API_URL}/assistant/sessions`,
                    { title: input.substring(0, 50) },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    sessionId = response.data.data.id;
                    setCurrentSession(response.data.data);
                    fetchSessions();
                }
            } catch (err) {
                console.error('Failed to create session:', err);
                return;
            }
        }

        const userMessage = { role: 'user', content: input, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/assistant/sessions/${sessionId}/chat`,
                { message: input },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessages(prev => [...prev, response.data.data.message]);
                fetchSessions();
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                created_at: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const quickAction = async (action, content) => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/assistant/quick-action`,
                { action, content: content || 'general knowledge' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Add to current session or create new one
                await createSession();
                setMessages([
                    { role: 'user', content: `Generate a ${action} about: ${content || 'general topic'}`, created_at: new Date().toISOString() },
                    { role: 'assistant', content: response.data.data.result, created_at: new Date().toISOString() }
                ]);
            }
        } catch (err) {
            console.error('Quick action failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
                <div className="p-4">
                    <button
                        onClick={createSession}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700 ${currentSession?.id === session.id ? 'bg-gray-700' : ''
                                }`}
                            onClick={() => loadSession(session.id)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm truncate">{session.title}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 mr-2"
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                    <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
                    <h1 className="text-white font-medium">AI Study Assistant</h1>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Sparkles className="w-16 h-16 text-indigo-400/30 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you learn?</h2>
                            <p className="text-gray-400 mb-8">Ask me anything or try a quick action below</p>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
                                {[
                                    { action: 'quiz', label: 'Generate Quiz', icon: BookOpen, prompt: 'Enter a topic for the quiz' },
                                    { action: 'explain', label: 'Explain Concept', icon: FileText, prompt: 'What concept to explain?' },
                                    { action: 'flashcards', label: 'Create Flashcards', icon: Layers, prompt: 'Topic for flashcards?' },
                                    { action: 'summarize', label: 'Summarize', icon: FileText, prompt: 'What to summarize?' }
                                ].map(({ action, label, icon: Icon, prompt }) => (
                                    <button
                                        key={action}
                                        onClick={() => {
                                            const topic = window.prompt(prompt);
                                            if (topic) quickAction(action, topic);
                                        }}
                                        className="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-indigo-500 transition-colors"
                                    >
                                        <Icon className="w-6 h-6 text-indigo-400" />
                                        <span className="text-gray-300 text-sm">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-100'
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span className="text-gray-400 text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            rows={1}
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPage;
