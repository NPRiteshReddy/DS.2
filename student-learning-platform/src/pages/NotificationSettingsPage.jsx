import { useState, useEffect } from 'react';
import {
    Settings,
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    Check,
    X,
    Save,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NotificationSettingsPage = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [preferences, setPreferences] = useState({
        emailEnabled: true,
        whatsappEnabled: false,
        whatsappPhone: '',
        inAppEnabled: true
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications/preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                setPreferences({
                    emailEnabled: data.email_enabled ?? true,
                    whatsappEnabled: data.whatsapp_enabled ?? false,
                    whatsappPhone: data.whatsapp_phone || '',
                    inAppEnabled: data.in_app_enabled ?? true
                });
            }
        } catch (err) {
            console.error('Failed to fetch preferences:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        // Validate WhatsApp phone if enabled
        if (preferences.whatsappEnabled && !preferences.whatsappPhone) {
            setError('Please enter your WhatsApp number to enable WhatsApp notifications');
            setSaving(false);
            return;
        }

        try {
            await axios.put(
                `${API_URL}/notifications/preferences`,
                preferences,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save settings. Please try again.');
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
        <div className="min-h-screen bg-gray-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/assignments"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Settings className="w-6 h-6" />
                            Notification Settings
                        </h1>
                        <p className="text-gray-400 mt-1">Choose how you want to receive reminders</p>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Notification Channels */}
                <div className="space-y-4">
                    {/* In-App Notifications */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">In-App Notifications</h3>
                                    <p className="text-gray-400 text-sm">Get notified in the app with the bell icon</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, inAppEnabled: !preferences.inAppEnabled })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${preferences.inAppEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.inAppEnabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Email Notifications</h3>
                                    <p className="text-gray-400 text-sm">Receive reminders via email</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, emailEnabled: !preferences.emailEnabled })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${preferences.emailEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.emailEnabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* WhatsApp Notifications */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">WhatsApp Notifications</h3>
                                    <p className="text-gray-400 text-sm">Get reminders on WhatsApp</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, whatsappEnabled: !preferences.whatsappEnabled })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${preferences.whatsappEnabled ? 'bg-green-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.whatsappEnabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* WhatsApp Phone Input */}
                        {preferences.whatsappEnabled && (
                            <div className="mt-4 pl-16">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Smartphone className="w-4 h-4 inline mr-1" />
                                    WhatsApp Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={preferences.whatsappPhone}
                                    onChange={(e) => setPreferences({ ...preferences, whatsappPhone: e.target.value })}
                                    placeholder="+91 9876543210"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                                />
                                <p className="text-gray-500 text-xs mt-2">
                                    Include country code (e.g., +91 for India, +1 for US)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm">
                        <strong className="text-gray-300">Note:</strong> You'll receive reminders based on the timing you set when creating assignments (1 hour, 1 day, 3 days, or 1 week before due date).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;
