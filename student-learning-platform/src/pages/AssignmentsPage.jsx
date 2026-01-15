import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Filter,
    Search,
    MoreVertical,
    Trash2,
    Edit,
    ChevronDown,
    BookOpen,
    Bell
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Priority colors
const priorityColors = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30'
};

// Status icons and colors
const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    in_progress: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    overdue: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' }
};

const AssignmentsPage = () => {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseName: '',
        dueDate: '',
        priority: 'medium',
        reminders: ['1day']
    });

    useEffect(() => {
        fetchAssignments();
        fetchStats();
    }, [filterStatus]);

    const fetchAssignments = async () => {
        try {
            const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
            const response = await axios.get(`${API_URL}/assignments${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setAssignments(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/assignments/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAssignment) {
                await axios.put(
                    `${API_URL}/assignments/${editingAssignment.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${API_URL}/assignments`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setShowModal(false);
            setEditingAssignment(null);
            resetForm();
            fetchAssignments();
            fetchStats();
        } catch (err) {
            console.error('Failed to save assignment:', err);
        }
    };

    const handleComplete = async (id) => {
        try {
            await axios.post(
                `${API_URL}/assignments/${id}/complete`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchAssignments();
            fetchStats();
        } catch (err) {
            console.error('Failed to complete assignment:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            await axios.delete(`${API_URL}/assignments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAssignments();
            fetchStats();
        } catch (err) {
            console.error('Failed to delete assignment:', err);
        }
    };

    const openEditModal = (assignment) => {
        setEditingAssignment(assignment);
        setFormData({
            title: assignment.title,
            description: assignment.description || '',
            courseName: assignment.course_name || '',
            dueDate: assignment.due_date.slice(0, 16),
            priority: assignment.priority,
            reminders: ['1day']
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            courseName: '',
            dueDate: '',
            priority: 'medium',
            reminders: ['1day']
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeRemaining = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;

        if (diff < 0) return 'Overdue';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return `${hours}h remaining`;

        const days = Math.floor(hours / 24);
        return `${days}d remaining`;
    };

    const filteredAssignments = assignments.filter(a => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return a.title.toLowerCase().includes(query) ||
                a.course_name?.toLowerCase().includes(query);
        }
        return true;
    });

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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Assignments</h1>
                        <p className="text-gray-400">Track your assignments and deadlines</p>
                    </div>
                    <button
                        onClick={() => { setShowModal(true); setEditingAssignment(null); resetForm(); }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Assignment
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total || 0, color: 'text-white' },
                        { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-400' },
                        { label: 'Completed', value: stats.completed || 0, color: 'text-green-400' },
                        { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-400' }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {['all', 'pending', 'in_progress', 'completed', 'overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filterStatus === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignments List */}
                {filteredAssignments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No assignments</h3>
                        <p className="text-gray-500">Click "Add Assignment" to create one</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment) => {
                            const StatusIcon = statusConfig[assignment.status]?.icon || Clock;
                            const statusColor = statusConfig[assignment.status]?.color || 'text-gray-400';

                            return (
                                <div
                                    key={assignment.id}
                                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[assignment.priority]}`}>
                                                    {assignment.priority}
                                                </span>
                                                <span className={`flex items-center gap-1 text-xs ${statusColor}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {assignment.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {assignment.course_name && (
                                                <p className="text-gray-400 text-sm mb-2">{assignment.course_name}</p>
                                            )}

                                            {assignment.description && (
                                                <p className="text-gray-500 text-sm mb-3">{assignment.description}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(assignment.due_date)}
                                                </span>
                                                <span className={`flex items-center gap-1 ${assignment.status === 'overdue' ? 'text-red-400' : 'text-gray-400'
                                                    }`}>
                                                    <Clock className="w-4 h-4" />
                                                    {getTimeRemaining(assignment.due_date)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {assignment.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleComplete(assignment.id)}
                                                    className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                                    title="Mark as completed"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(assignment)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(assignment.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-lg">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">
                                    {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="Assignment title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                                    <input
                                        type="text"
                                        value={formData.courseName}
                                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., CS101 - Data Structures"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="Assignment details..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <Bell className="w-4 h-4 inline mr-1" />
                                        Remind me
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: '1hour', label: '1 hour before' },
                                            { value: '1day', label: '1 day before' },
                                            { value: '3days', label: '3 days before' },
                                            { value: '1week', label: '1 week before' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.reminders;
                                                    if (current.includes(option.value)) {
                                                        setFormData({ ...formData, reminders: current.filter(r => r !== option.value) });
                                                    } else {
                                                        setFormData({ ...formData, reminders: [...current, option.value] });
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formData.reminders.includes(option.value)
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-700 text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setEditingAssignment(null); }}
                                        className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        {editingAssignment ? 'Save Changes' : 'Add Assignment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentsPage;
