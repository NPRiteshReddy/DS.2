import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Settings,
    Coffee,
    Brain,
    Clock,
    Target,
    Flame,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Volume2,
    VolumeX
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StudyPlannerPage = () => {
    const { token } = useAuth();
    const [settings, setSettings] = useState({
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
        soundEnabled: true
    });

    // Timer state
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [timerMode, setTimerMode] = useState('work'); // work, break, longBreak
    const [completedPomodoros, setCompletedPomodoros] = useState(0);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Stats state
    const [todayStats, setTodayStats] = useState({ total_study_minutes: 0, pomodoros_completed: 0 });
    const [weeklyStats, setWeeklyStats] = useState({ days: [], totals: {} });
    const [recentSessions, setRecentSessions] = useState([]);

    // UI state
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);

    const intervalRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        fetchSettings();
        fetchStats();
        fetchSessions();
    }, []);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft]);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${API_URL}/study/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const s = response.data.data;
                setSettings({
                    workDuration: s.work_duration,
                    breakDuration: s.break_duration,
                    longBreakDuration: s.long_break_duration,
                    sessionsBeforeLongBreak: s.sessions_before_long_break,
                    soundEnabled: s.sound_enabled
                });
                setTimeLeft(s.work_duration * 60);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const [todayRes, weeklyRes] = await Promise.all([
                axios.get(`${API_URL}/study/today`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/study/weekly`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (todayRes.data.success) setTodayStats(todayRes.data.data);
            if (weeklyRes.data.success) setWeeklyStats(weeklyRes.data.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await axios.get(`${API_URL}/study/sessions?limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setRecentSessions(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };

    const startTimer = async () => {
        try {
            const response = await axios.post(
                `${API_URL}/study/sessions`,
                {
                    type: timerMode === 'work' ? 'pomodoro' : timerMode === 'break' ? 'break' : 'long_break',
                    durationMinutes: timerMode === 'work' ? settings.workDuration :
                        timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setCurrentSessionId(response.data.data.id);
                setIsRunning(true);
            }
        } catch (err) {
            console.error('Failed to start session:', err);
            setIsRunning(true); // Start anyway for offline use
        }
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = async () => {
        setIsRunning(false);

        if (currentSessionId) {
            try {
                await axios.post(
                    `${API_URL}/study/sessions/${currentSessionId}/cancel`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error('Failed to cancel session:', err);
            }
        }

        setCurrentSessionId(null);
        setTimeLeft(
            timerMode === 'work' ? settings.workDuration * 60 :
                timerMode === 'break' ? settings.breakDuration * 60 :
                    settings.longBreakDuration * 60
        );
    };

    const handleTimerComplete = async () => {
        setIsRunning(false);

        // Play sound
        if (settings.soundEnabled) {
            playNotificationSound();
        }

        // Complete session
        if (currentSessionId) {
            try {
                await axios.post(
                    `${API_URL}/study/sessions/${currentSessionId}/complete`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                fetchStats();
                fetchSessions();
            } catch (err) {
                console.error('Failed to complete session:', err);
            }
        }

        setCurrentSessionId(null);

        // Handle mode transition
        if (timerMode === 'work') {
            const newCount = completedPomodoros + 1;
            setCompletedPomodoros(newCount);

            if (newCount % settings.sessionsBeforeLongBreak === 0) {
                setTimerMode('longBreak');
                setTimeLeft(settings.longBreakDuration * 60);
            } else {
                setTimerMode('break');
                setTimeLeft(settings.breakDuration * 60);
            }
        } else {
            setTimerMode('work');
            setTimeLeft(settings.workDuration * 60);
        }
    };

    const skipToNext = () => {
        handleTimerComplete();
    };

    const switchMode = (mode) => {
        setTimerMode(mode);
        setIsRunning(false);
        setTimeLeft(
            mode === 'work' ? settings.workDuration * 60 :
                mode === 'break' ? settings.breakDuration * 60 :
                    settings.longBreakDuration * 60
        );
    };

    const playNotificationSound = () => {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const saveSettings = async () => {
        try {
            await axios.put(
                `${API_URL}/study/settings`,
                settings,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowSettings(false);

            // Reset timer with new duration if not running
            if (!isRunning) {
                setTimeLeft(
                    timerMode === 'work' ? settings.workDuration * 60 :
                        timerMode === 'break' ? settings.breakDuration * 60 :
                            settings.longBreakDuration * 60
                );
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = timerMode === 'work'
        ? 1 - (timeLeft / (settings.workDuration * 60))
        : timerMode === 'break'
            ? 1 - (timeLeft / (settings.breakDuration * 60))
            : 1 - (timeLeft / (settings.longBreakDuration * 60));

    const modeColors = {
        work: 'from-red-500 to-orange-500',
        break: 'from-green-500 to-emerald-500',
        longBreak: 'from-blue-500 to-cyan-500'
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Study Planner</h1>
                        <p className="text-gray-400">Focus with the Pomodoro Technique</p>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Timer Section */}
                    <div className="md:col-span-2">
                        {/* Mode Tabs */}
                        <div className="flex gap-2 mb-6">
                            {[
                                { mode: 'work', label: 'Focus', icon: Brain },
                                { mode: 'break', label: 'Break', icon: Coffee },
                                { mode: 'longBreak', label: 'Long Break', icon: Coffee }
                            ].map(({ mode, label, icon: Icon }) => (
                                <button
                                    key={mode}
                                    onClick={() => switchMode(mode)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${timerMode === mode
                                            ? `bg-gradient-to-r ${modeColors[mode]} text-white`
                                            : 'bg-gray-800 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Timer Display */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-6">
                            <div className="relative flex items-center justify-center">
                                {/* Progress Ring */}
                                <svg className="w-64 h-64 transform -rotate-90">
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-gray-700"
                                    />
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="url(#gradient)"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 120}
                                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor={timerMode === 'work' ? '#ef4444' : timerMode === 'break' ? '#22c55e' : '#3b82f6'} />
                                            <stop offset="100%" stopColor={timerMode === 'work' ? '#f97316' : timerMode === 'break' ? '#10b981' : '#06b6d4'} />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Time Display */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-bold text-white font-mono">
                                        {formatTime(timeLeft)}
                                    </span>
                                    <span className="text-gray-400 mt-2 capitalize">
                                        {timerMode === 'work' ? 'Focus Time' : timerMode === 'break' ? 'Short Break' : 'Long Break'}
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={resetTimer}
                                    className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={isRunning ? pauseTimer : startTimer}
                                    className={`p-5 rounded-full text-white transition-all transform hover:scale-105 bg-gradient-to-r ${modeColors[timerMode]}`}
                                >
                                    {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                                </button>

                                <button
                                    onClick={skipToNext}
                                    className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pomodoro Count */}
                            <div className="flex items-center justify-center gap-2 mt-6">
                                {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${i < (completedPomodoros % settings.sessionsBeforeLongBreak)
                                                ? 'bg-red-500'
                                                : 'bg-gray-600'
                                            }`}
                                    />
                                ))}
                                <span className="text-gray-400 text-sm ml-2">
                                    {completedPomodoros} pomodoros today
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-4">
                        {/* Today's Stats */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-400" />
                                Today
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Focus Time</span>
                                    <span className="text-white font-medium">
                                        {Math.floor(todayStats.total_study_minutes / 60)}h {todayStats.total_study_minutes % 60}m
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Pomodoros</span>
                                    <span className="text-white font-medium">{todayStats.pomodoros_completed}</span>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Stats */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-400" />
                                This Week
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total Focus</span>
                                    <span className="text-white font-medium">
                                        {Math.floor((weeklyStats.totals?.totalMinutes || 0) / 60)}h
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Pomodoros</span>
                                    <span className="text-white font-medium">{weeklyStats.totals?.totalPomodoros || 0}</span>
                                </div>
                            </div>

                            {/* Mini Bar Chart */}
                            <div className="flex items-end gap-1 mt-4 h-16">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const dayData = weeklyStats.days?.[i];
                                    const height = dayData ? Math.min((dayData.total_study_minutes / 120) * 100, 100) : 5;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t"
                                            style={{ height: `${height}%` }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Mon</span>
                                <span>Sun</span>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <Link
                            to="/assignments"
                            className="block bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">View Assignments</span>
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">Timer Settings</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Focus Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.workDuration}
                                        onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
                                        min="1"
                                        max="60"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Short Break (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.breakDuration}
                                        onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 5 })}
                                        min="1"
                                        max="30"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Long Break (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.longBreakDuration}
                                        onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                                        min="1"
                                        max="60"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Sessions before long break
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.sessionsBeforeLongBreak}
                                        onChange={(e) => setSettings({ ...settings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                                        min="1"
                                        max="10"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Sound notifications</span>
                                    <button
                                        onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                                        className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                    >
                                        {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSettings}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyPlannerPage;
