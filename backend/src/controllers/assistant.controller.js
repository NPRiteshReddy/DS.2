/**
 * AI Assistant Controller
 * Handles AI chat for study assistance using OpenAI
 */

const { supabase } = require('../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an expert AI study assistant for students. You help with:
- Explaining complex concepts in simple terms
- Answering questions about any subject
- Creating quizzes and practice questions
- Summarizing content
- Providing study tips and strategies
- Helping with homework and assignments

Be encouraging, patient, and educational. Use examples and analogies when helpful.
Format your responses with markdown for better readability.
If asked to create a quiz, format it clearly with numbered questions.`;

/**
 * Create a new chat session
 * POST /api/assistant/sessions
 */
const createSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, contextType, contextId } = req.body;

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: userId,
                title: title || 'New Chat',
                context_type: contextType,
                context_id: contextId
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ success: false, error: 'Failed to create session' });
    }
};

/**
 * Get all chat sessions
 * GET /api/assistant/sessions
 */
const getSessions = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ success: false, error: 'Failed to get sessions' });
    }
};

/**
 * Get session with messages
 * GET /api/assistant/sessions/:id
 */
const getSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (sessionError) throw sessionError;

        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        res.json({
            success: true,
            data: { ...session, messages }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, error: 'Failed to get session' });
    }
};

/**
 * Delete a session
 * DELETE /api/assistant/sessions/:id
 */
const deleteSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete session' });
    }
};

/**
 * Send a message and get AI response
 * POST /api/assistant/sessions/:id/chat
 */
const chat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: sessionId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Get existing messages for context
        const { data: existingMessages } = await supabase
            .from('chat_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(20);

        // Save user message
        await supabase
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message
            });

        // Build messages array for OpenAI
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(existingMessages || []).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1500
        });

        const assistantMessage = completion.choices[0].message.content;
        const tokensUsed = completion.usage?.total_tokens;

        // Save assistant message
        const { data: savedMessage, error: saveError } = await supabase
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role: 'assistant',
                content: assistantMessage,
                tokens_used: tokensUsed
            })
            .select()
            .single();

        if (saveError) throw saveError;

        // Update session timestamp and title if first message
        if (!existingMessages || existingMessages.length === 0) {
            const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
            await supabase
                .from('chat_sessions')
                .update({ title, updated_at: new Date().toISOString() })
                .eq('id', sessionId);
        } else {
            await supabase
                .from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId);
        }

        res.json({
            success: true,
            data: {
                message: savedMessage,
                tokensUsed
            }
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ success: false, error: 'Failed to get AI response' });
    }
};

/**
 * Quick actions - generate quiz, explain, summarize
 * POST /api/assistant/quick-action
 */
const quickAction = async (req, res) => {
    try {
        const { action, content, subject } = req.body;

        let prompt;
        switch (action) {
            case 'quiz':
                prompt = `Create a 5-question multiple choice quiz about: ${subject || content}. Format each question with 4 options (A, B, C, D) and indicate the correct answer.`;
                break;
            case 'explain':
                prompt = `Explain this concept in simple terms with examples: ${content}`;
                break;
            case 'summarize':
                prompt = `Summarize the following content in bullet points: ${content}`;
                break;
            case 'flashcards':
                prompt = `Create 5 flashcards (question and answer pairs) for studying: ${subject || content}. Format as "Q: [question]" and "A: [answer]" for each.`;
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        res.json({
            success: true,
            data: {
                result: completion.choices[0].message.content,
                tokensUsed: completion.usage?.total_tokens
            }
        });
    } catch (error) {
        console.error('Quick action error:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
};

module.exports = {
    createSession,
    getSessions,
    getSession,
    deleteSession,
    chat,
    quickAction
};
