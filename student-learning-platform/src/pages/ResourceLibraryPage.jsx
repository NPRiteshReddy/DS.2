import { useState, useEffect } from 'react';
import {
    Plus,
    Folder,
    Link,
    FileText,
    Star,
    Search,
    Trash2,
    Edit,
    ExternalLink,
    Grid,
    List,
    Filter,
    X,
    FolderPlus
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const typeIcons = {
    link: Link,
    note: FileText,
    pdf: FileText,
    file: FileText
};

const typeColors = {
    link: 'text-blue-400 bg-blue-500/20',
    note: 'text-yellow-400 bg-yellow-500/20',
    pdf: 'text-red-400 bg-red-500/20',
    file: 'text-gray-400 bg-gray-500/20'
};

const ResourceLibraryPage = () => {
    const { token } = useAuth();
    const [resources, setResources] = useState([]);
    const [folders, setFolders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [currentFolder, setCurrentFolder] = useState(null);

    // Modal states
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    // Form data
    const [resourceForm, setResourceForm] = useState({
        title: '', type: 'link', url: '', content: '', description: '', tags: []
    });
    const [folderName, setFolderName] = useState('');

    useEffect(() => {
        fetchData();
    }, [currentFolder, filterType]);

    const fetchData = async () => {
        try {
            const params = new URLSearchParams();
            if (currentFolder) params.append('folderId', currentFolder);
            if (filterType !== 'all') params.append('type', filterType);
            if (searchQuery) params.append('search', searchQuery);

            const [resourcesRes, foldersRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/resources?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/resources/folders`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/resources/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (resourcesRes.data.success) setResources(resourcesRes.data.data);
            if (foldersRes.data.success) setFolders(foldersRes.data.data);
            if (statsRes.data.success) setStats(statsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveResource = async () => {
        try {
            const payload = {
                ...resourceForm,
                folderId: currentFolder
            };

            if (editingResource) {
                await axios.put(`${API_URL}/resources/${editingResource.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/resources`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowResourceModal(false);
            setEditingResource(null);
            setResourceForm({ title: '', type: 'link', url: '', content: '', description: '', tags: [] });
            fetchData();
        } catch (err) {
            console.error('Failed to save resource:', err);
        }
    };

    const deleteResource = async (id) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await axios.delete(`${API_URL}/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Failed to delete resource:', err);
        }
    };

    const toggleFavorite = async (id) => {
        try {
            await axios.post(`${API_URL}/resources/${id}/favorite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const createFolder = async () => {
        try {
            await axios.post(`${API_URL}/resources/folders`, { name: folderName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowFolderModal(false);
            setFolderName('');
            fetchData();
        } catch (err) {
            console.error('Failed to create folder:', err);
        }
    };

    const deleteFolder = async (id) => {
        if (!confirm('Delete this folder? Resources inside will be moved to root.')) return;
        try {
            await axios.delete(`${API_URL}/resources/folders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (currentFolder === id) setCurrentFolder(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete folder:', err);
        }
    };

    const filteredResources = resources.filter(r => {
        if (!searchQuery) return true;
        return r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
                        <h1 className="text-3xl font-bold text-white mb-2">Resource Library</h1>
                        <p className="text-gray-400">Organize your learning materials</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                        >
                            <FolderPlus className="w-5 h-5" />
                            New Folder
                        </button>
                        <button
                            onClick={() => { setEditingResource(null); setResourceForm({ title: '', type: 'link', url: '', content: '', description: '', tags: [] }); setShowResourceModal(true); }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Resource
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total || 0, type: 'all' },
                        { label: 'Links', value: stats.links || 0, type: 'link' },
                        { label: 'Notes', value: stats.notes || 0, type: 'note' },
                        { label: 'Files', value: stats.files || 0, type: 'file' }
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            onClick={() => setFilterType(stat.type)}
                            className={`bg-gray-800/50 border rounded-lg p-4 text-left transition-colors ${filterType === stat.type ? 'border-indigo-500' : 'border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </button>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Folders */}
                {!currentFolder && folders.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => setCurrentFolder(folder.id)}
                                className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 text-left group"
                            >
                                <Folder className="w-6 h-6 text-yellow-400" />
                                <span className="text-white flex-1 truncate">{folder.name}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </button>
                        ))}
                    </div>
                )}

                {/* Current Folder */}
                {currentFolder && (
                    <button
                        onClick={() => setCurrentFolder(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                    >
                        <X className="w-4 h-4" />
                        Back to all resources
                    </button>
                )}

                {/* Resources Grid/List */}
                {filteredResources.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">No resources yet</h3>
                        <p className="text-gray-500">Add links, notes, or files to get started</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResources.map((resource) => {
                            const Icon = typeIcons[resource.type] || FileText;
                            return (
                                <div key={resource.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => toggleFavorite(resource.id)} className={`p-1 ${resource.is_favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>
                                                <Star className="w-4 h-4" fill={resource.is_favorite ? 'currentColor' : 'none'} />
                                            </button>
                                            <button onClick={() => { setResourceForm(resource); setEditingResource(resource); setShowResourceModal(true); }} className="p-1 text-gray-500 hover:text-white">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteResource(resource.id)} className="p-1 text-gray-500 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-white mb-1 line-clamp-1">{resource.title}</h3>
                                    {resource.description && <p className="text-gray-400 text-sm line-clamp-2">{resource.description}</p>}
                                    {resource.url && (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 text-sm mt-2 hover:underline">
                                            <ExternalLink className="w-3 h-3" /> Open link
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredResources.map((resource) => {
                            const Icon = typeIcons[resource.type] || FileText;
                            return (
                                <div key={resource.id} className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600">
                                    <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{resource.title}</h3>
                                        {resource.description && <p className="text-gray-500 text-sm truncate">{resource.description}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        {resource.url && (
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-400">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button onClick={() => toggleFavorite(resource.id)} className={`p-2 ${resource.is_favorite ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            <Star className="w-4 h-4" fill={resource.is_favorite ? 'currentColor' : 'none'} />
                                        </button>
                                        <button onClick={() => deleteResource(resource.id)} className="p-2 text-gray-400 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Resource Modal */}
                {showResourceModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                                    <div className="flex gap-2">
                                        {['link', 'note'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setResourceForm({ ...resourceForm, type })}
                                                className={`flex-1 py-2 rounded-lg capitalize ${resourceForm.type === type ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={resourceForm.title}
                                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="Resource title"
                                    />
                                </div>
                                {resourceForm.type === 'link' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">URL *</label>
                                        <input
                                            type="url"
                                            value={resourceForm.url}
                                            onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}
                                {resourceForm.type === 'note' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                                        <textarea
                                            value={resourceForm.content}
                                            onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                            placeholder="Your notes..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={resourceForm.description}
                                        onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="Optional description"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button onClick={() => setShowResourceModal(false)} className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                                <button onClick={saveResource} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Folder Modal */}
                {showFolderModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-sm">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-semibold text-white">New Folder</h2>
                            </div>
                            <div className="p-6">
                                <input
                                    type="text"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="Folder name"
                                />
                            </div>
                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
                                <button onClick={createFolder} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceLibraryPage;
