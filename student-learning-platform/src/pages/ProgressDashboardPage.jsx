import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Flame,
    Trophy,
    Target,
    Zap,
    Star,
    Award,
    Clock,
    Calendar,
    TrendingUp,
    Medal,
    Lock,
    CheckCircle,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const achievementIcons = {
    video: '🎬', film: '🎥', headphones: '🎧', clipboard: '📋',
    'check-circle': '✅', layers: '🃏', brain: '🧠', flame: '🔥',
    trophy: '🏆', clock: '⏰', target: '🎯', zap: '⚡', award: '🏅'
};

const ProgressDashboardPage = () => {
    const { token } = useAuth();
    const [progress, setProgress] = useState(null);
    const [achievements, setAchievements] = useState({ achievements: [], earned: 0, total: 0 });
    const [activity, setActivity] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [progressRes, achievementsRes, activityRes, leaderboardRes] = await Promise.all([
                axios.get(`${API_URL}/progress`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/progress/achievements`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/progress/activity?days=30`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/progress/leaderboard?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (progressRes.data.success) setProgress(progressRes.data.data);
            if (achievementsRes.data.success) setAchievements(achievementsRes.data.data);
            if (activityRes.data.success) setActivity(activityRes.data.data);
            if (leaderboardRes.data.success) setLeaderboard(leaderboardRes.data.data);
        } catch (err) {
            console.error('Failed to fetch progress:', err);
        } finally {
            setLoading(false);
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
        <div className="min-h-screen bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
                    <p className="text-gray-400">Track your learning journey</p>
                </div>

                {/* Level & XP Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{progress?.level || 1}</span>
                                </div>
                                <div>
                                    <p className="text-white/70 text-sm">Level</p>
                                    <p className="text-2xl font-bold text-white">
                                        {progress?.level === 1 ? 'Beginner' :
                                            progress?.level < 5 ? 'Learner' :
                                                progress?.level < 10 ? 'Scholar' : 'Master'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-2 text-yellow-300">
                                <Zap className="w-5 h-5" />
                                <span className="text-2xl font-bold">{progress?.total_xp || 0}</span>
                                <span className="text-white/70">XP</span>
                            </div>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/70">Level {progress?.level || 1}</span>
                            <span className="text-white/70">Level {(progress?.level || 1) + 1}</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                                style={{ width: `${progress?.xpPercentage || 0}%` }}
                            />
                        </div>
                        <p className="text-white/70 text-sm mt-2 text-center">
                            {progress?.xpProgress || 0} / {progress?.xpNeeded || 100} XP to next level
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Current Streak', value: progress?.current_streak || 0, icon: Flame, color: 'text-orange-400', suffix: 'days' },
                        { label: 'Longest Streak', value: progress?.longest_streak || 0, icon: Trophy, color: 'text-yellow-400', suffix: 'days' },
                        { label: 'Study Time', value: Math.floor((progress?.study_minutes || 0) / 60), icon: Clock, color: 'text-blue-400', suffix: 'hours' },
                        { label: 'Achievements', value: achievements.earned, icon: Medal, color: 'text-purple-400', suffix: `/ ${achievements.total}` }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                            <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                            <p className="text-2xl font-bold text-white">
                                {stat.value} <span className="text-sm text-gray-500 font-normal">{stat.suffix}</span>
                            </p>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                    {[
                        { id: 'overview', label: 'Activity' },
                        { id: 'achievements', label: 'Achievements' },
                        { id: 'leaderboard', label: 'Leaderboard' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Activity Calendar */}
                {activeTab === 'overview' && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                            Last 30 Days
                        </h3>

                        {/* Activity Grid */}
                        <div className="grid grid-cols-10 gap-1">
                            {Array.from({ length: 30 }).map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (29 - i));
                                const dateStr = date.toISOString().split('T')[0];
                                const dayActivity = activity.find(a => a.date === dateStr);
                                const xp = dayActivity?.xp_earned || 0;

                                let bgClass = 'bg-gray-700';
                                if (xp > 0) bgClass = 'bg-green-900';
                                if (xp > 50) bgClass = 'bg-green-700';
                                if (xp > 100) bgClass = 'bg-green-500';
                                if (xp > 200) bgClass = 'bg-green-400';

                                return (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded ${bgClass}`}
                                        title={`${dateStr}: ${xp} XP`}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                            <span>Less</span>
                            <div className="w-3 h-3 bg-gray-700 rounded" />
                            <div className="w-3 h-3 bg-green-900 rounded" />
                            <div className="w-3 h-3 bg-green-700 rounded" />
                            <div className="w-3 h-3 bg-green-500 rounded" />
                            <span>More</span>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
                            {[
                                { label: 'Videos Created', value: progress?.videos_created || 0 },
                                { label: 'Audios Created', value: progress?.audios_created || 0 },
                                { label: 'Assignments Done', value: progress?.assignments_completed || 0 },
                                { label: 'Cards Reviewed', value: progress?.cards_reviewed || 0 }
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-gray-500 text-sm">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Achievements Grid */}
                {activeTab === 'achievements' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.achievements?.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`relative bg-gray-800/50 border rounded-xl p-5 ${achievement.earned ? 'border-yellow-500/50' : 'border-gray-700 opacity-60'
                                    }`}
                            >
                                {achievement.earned && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-gray-900" />
                                    </div>
                                )}
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${achievement.earned ? 'bg-yellow-500/20' : 'bg-gray-700'
                                        }`}>
                                        {achievement.earned ? achievementIcons[achievement.icon] || '🏆' : <Lock className="w-5 h-5 text-gray-500" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{achievement.name}</h4>
                                        <p className="text-gray-400 text-sm">{achievement.description}</p>
                                        <p className="text-yellow-400 text-sm mt-1">+{achievement.xp_reward} XP</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Leaderboard */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Top Learners
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {leaderboard.map((entry) => (
                                <div key={entry.userId} className="flex items-center p-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${entry.rank === 1 ? 'bg-yellow-500 text-gray-900' :
                                            entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                                                entry.rank === 3 ? 'bg-orange-600 text-white' :
                                                    'bg-gray-700 text-gray-300'
                                        }`}>
                                        {entry.rank}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{entry.name}</p>
                                        <p className="text-gray-500 text-sm">Level {entry.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-yellow-400 font-semibold">{entry.xp} XP</p>
                                        <p className="text-gray-500 text-sm flex items-center gap-1">
                                            <Flame className="w-3 h-3 text-orange-400" />
                                            {entry.streak} day streak
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                    {[
                        { to: '/study', label: 'Study Planner', desc: 'Focus with Pomodoro' },
                        { to: '/flashcards', label: 'Flashcards', desc: 'Review your cards' },
                        { to: '/assignments', label: 'Assignments', desc: 'Track deadlines' }
                    ].map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                        >
                            <div>
                                <p className="font-medium text-white">{link.label}</p>
                                <p className="text-gray-500 text-sm">{link.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressDashboardPage;
