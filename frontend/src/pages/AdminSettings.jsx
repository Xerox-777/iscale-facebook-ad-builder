import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Key, Facebook, Sparkles, Plus, X, Check, Trash2, Pencil, Eye, EyeOff, Star, StarOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('facebook');
    const [users, setUsers] = useState([]);
    const [facebookCredentials, setFacebookCredentials] = useState([]);
    const [geminiCredentials, setGeminiCredentials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showAddFacebookModal, setShowAddFacebookModal] = useState(false);
    const [showAddGeminiModal, setShowAddGeminiModal] = useState(false);
    const [showEditFacebookModal, setShowEditFacebookModal] = useState(false);
    const [showEditGeminiModal, setShowEditGeminiModal] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null);

    // Form states
    const [newFacebookCred, setNewFacebookCred] = useState({
        user_id: '',
        name: '',
        access_token: '',
        ad_account_id: '',
        app_id: '',
        app_secret: '',
        is_default: false,
    });
    const [newGeminiCred, setNewGeminiCred] = useState({
        user_id: '',
        name: '',
        api_key: '',
        is_default: false,
    });
    const [editFacebookCred, setEditFacebookCred] = useState(null);
    const [editGeminiCred, setEditGeminiCred] = useState(null);

    // Password visibility
    const [showTokens, setShowTokens] = useState({});

    const { authFetch } = useAuth();
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, fbRes, geminiRes] = await Promise.all([
                authFetch(`${API_URL}/users/`),
                authFetch(`${API_URL}/credentials/facebook`),
                authFetch(`${API_URL}/credentials/gemini`),
            ]);

            if (usersRes.ok) {
                setUsers(await usersRes.json());
            }
            if (fbRes.ok) {
                setFacebookCredentials(await fbRes.json());
            }
            if (geminiRes.ok) {
                setGeminiCredentials(await geminiRes.json());
            }
        } catch (err) {
            showError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const user = users.find((u) => u.id === userId);
        return user ? user.name || user.email : 'Unknown User';
    };

    // Facebook CRUD
    const handleAddFacebookCredential = async (e) => {
        e.preventDefault();
        if (!newFacebookCred.user_id || !newFacebookCred.name || !newFacebookCred.access_token || !newFacebookCred.ad_account_id) {
            showError('User, name, access token, and ad account ID are required');
            return;
        }

        try {
            const response = await authFetch(`${API_URL}/credentials/facebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFacebookCred),
            });

            if (response.ok) {
                showSuccess('Facebook credential created');
                setShowAddFacebookModal(false);
                setNewFacebookCred({ user_id: '', name: '', access_token: '', ad_account_id: '', app_id: '', app_secret: '', is_default: false });
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to create credential');
            }
        } catch (err) {
            showError('Failed to create credential');
        }
    };

    const handleUpdateFacebookCredential = async (e) => {
        e.preventDefault();
        if (!editFacebookCred) return;

        try {
            const body = {
                name: editFacebookCred.name,
                ad_account_id: editFacebookCred.ad_account_id,
                app_id: editFacebookCred.app_id,
                is_default: editFacebookCred.is_default,
            };
            if (editFacebookCred.access_token) {
                body.access_token = editFacebookCred.access_token;
            }
            if (editFacebookCred.app_secret) {
                body.app_secret = editFacebookCred.app_secret;
            }

            const response = await authFetch(`${API_URL}/credentials/facebook/${editFacebookCred.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                showSuccess('Facebook credential updated');
                setShowEditFacebookModal(false);
                setEditFacebookCred(null);
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to update credential');
            }
        } catch (err) {
            showError('Failed to update credential');
        }
    };

    const handleDeleteFacebookCredential = async () => {
        if (!credentialToDelete) return;

        try {
            const response = await authFetch(`${API_URL}/credentials/facebook/${credentialToDelete.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSuccess('Facebook credential deleted');
                setCredentialToDelete(null);
                setDeleteType(null);
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to delete credential');
            }
        } catch (err) {
            showError('Failed to delete credential');
        }
    };

    // Gemini CRUD
    const handleAddGeminiCredential = async (e) => {
        e.preventDefault();
        if (!newGeminiCred.user_id || !newGeminiCred.name || !newGeminiCred.api_key) {
            showError('User, name, and API key are required');
            return;
        }

        try {
            const response = await authFetch(`${API_URL}/credentials/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGeminiCred),
            });

            if (response.ok) {
                showSuccess('Gemini credential created');
                setShowAddGeminiModal(false);
                setNewGeminiCred({ user_id: '', name: '', api_key: '', is_default: false });
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to create credential');
            }
        } catch (err) {
            showError('Failed to create credential');
        }
    };

    const handleUpdateGeminiCredential = async (e) => {
        e.preventDefault();
        if (!editGeminiCred) return;

        try {
            const body = {
                name: editGeminiCred.name,
                is_default: editGeminiCred.is_default,
            };
            if (editGeminiCred.api_key) {
                body.api_key = editGeminiCred.api_key;
            }

            const response = await authFetch(`${API_URL}/credentials/gemini/${editGeminiCred.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                showSuccess('Gemini credential updated');
                setShowEditGeminiModal(false);
                setEditGeminiCred(null);
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to update credential');
            }
        } catch (err) {
            showError('Failed to update credential');
        }
    };

    const handleDeleteGeminiCredential = async () => {
        if (!credentialToDelete) return;

        try {
            const response = await authFetch(`${API_URL}/credentials/gemini/${credentialToDelete.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSuccess('Gemini credential deleted');
                setCredentialToDelete(null);
                setDeleteType(null);
                fetchData();
            } else {
                const data = await response.json();
                showError(data.detail || 'Failed to delete credential');
            }
        } catch (err) {
            showError('Failed to delete credential');
        }
    };

    const toggleTokenVisibility = (id) => {
        setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <svg className="animate-spin h-10 w-10 text-amber-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Key size={32} className="text-amber-600" />
                        Admin Settings
                    </h1>
                    <p className="text-gray-600 mt-2">Manage API credentials for users.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('facebook')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'facebook'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Facebook size={18} />
                    Facebook Credentials
                </button>
                <button
                    onClick={() => setActiveTab('gemini')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'gemini'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Sparkles size={18} />
                    Gemini API Keys
                </button>
            </div>

            {/* Facebook Credentials Tab */}
            {activeTab === 'facebook' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            {facebookCredentials.length} credential{facebookCredentials.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setShowAddFacebookModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus size={20} />
                            Add Credential
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ad Account</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Token</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {facebookCredentials.map((cred) => (
                                <tr key={cred.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{getUserName(cred.user_id)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {cred.is_default && (
                                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            )}
                                            {cred.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{cred.ad_account_id}</td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cred.access_token_masked}</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            cred.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {cred.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditFacebookCred({
                                                        id: cred.id,
                                                        name: cred.name,
                                                        ad_account_id: cred.ad_account_id,
                                                        app_id: cred.app_id || '',
                                                        access_token: '',
                                                        app_secret: '',
                                                        is_default: cred.is_default,
                                                    });
                                                    setShowEditFacebookModal(true);
                                                }}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCredentialToDelete(cred);
                                                    setDeleteType('facebook');
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {facebookCredentials.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No Facebook credentials configured yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Gemini Credentials Tab */}
            {activeTab === 'gemini' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            {geminiCredentials.length} credential{geminiCredentials.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setShowAddGeminiModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus size={20} />
                            Add API Key
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">API Key</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {geminiCredentials.map((cred) => (
                                <tr key={cred.id} className="hover:bg-purple-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{getUserName(cred.user_id)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {cred.is_default && (
                                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            )}
                                            {cred.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cred.api_key_masked}</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            cred.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {cred.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditGeminiCred({
                                                        id: cred.id,
                                                        name: cred.name,
                                                        api_key: '',
                                                        is_default: cred.is_default,
                                                    });
                                                    setShowEditGeminiModal(true);
                                                }}
                                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCredentialToDelete(cred);
                                                    setDeleteType('gemini');
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {geminiCredentials.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No Gemini API keys configured yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Facebook Credential Modal */}
            {showAddFacebookModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddFacebookModal(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Facebook className="text-blue-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Add Facebook Credential</h3>
                            </div>
                            <button onClick={() => setShowAddFacebookModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddFacebookCredential} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newFacebookCred.user_id}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, user_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Credential Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newFacebookCred.name}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Main Ad Account"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Access Token <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={newFacebookCred.access_token}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, access_token: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Facebook access token"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ad Account ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newFacebookCred.ad_account_id}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, ad_account_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 123456789012345"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                                <input
                                    type="text"
                                    value={newFacebookCred.app_id}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, app_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                                <input
                                    type="password"
                                    value={newFacebookCred.app_secret}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, app_secret: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Optional"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newFacebookCred.is_default}
                                    onChange={(e) => setNewFacebookCred((prev) => ({ ...prev, is_default: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Set as default credential for this user</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddFacebookModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2">
                                    <Check size={16} />
                                    Create Credential
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Facebook Credential Modal */}
            {showEditFacebookModal && editFacebookCred && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditFacebookModal(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Pencil className="text-blue-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Edit Facebook Credential</h3>
                            </div>
                            <button onClick={() => setShowEditFacebookModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateFacebookCredential} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name</label>
                                <input
                                    type="text"
                                    value={editFacebookCred.name}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Access Token <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editFacebookCred.access_token}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, access_token: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter new token to update"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Account ID</label>
                                <input
                                    type="text"
                                    value={editFacebookCred.ad_account_id}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, ad_account_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                                <input
                                    type="text"
                                    value={editFacebookCred.app_id}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, app_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    App Secret <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editFacebookCred.app_secret}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, app_secret: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter new secret to update"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editFacebookCred.is_default}
                                    onChange={(e) => setEditFacebookCred((prev) => ({ ...prev, is_default: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Set as default credential</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditFacebookModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2">
                                    <Check size={16} />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Gemini Credential Modal */}
            {showAddGeminiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddGeminiModal(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Sparkles className="text-purple-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Add Gemini API Key</h3>
                            </div>
                            <button onClick={() => setShowAddGeminiModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddGeminiCredential} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newGeminiCred.user_id}
                                    onChange={(e) => setNewGeminiCred((prev) => ({ ...prev, user_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Credential Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newGeminiCred.name}
                                    onChange={(e) => setNewGeminiCred((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Production Key"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    API Key <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={newGeminiCred.api_key}
                                    onChange={(e) => setNewGeminiCred((prev) => ({ ...prev, api_key: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Gemini API key"
                                    required
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newGeminiCred.is_default}
                                    onChange={(e) => setNewGeminiCred((prev) => ({ ...prev, is_default: e.target.checked }))}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">Set as default credential for this user</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddGeminiModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2">
                                    <Check size={16} />
                                    Create Credential
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Gemini Credential Modal */}
            {showEditGeminiModal && editGeminiCred && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditGeminiModal(false)}>
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Pencil className="text-purple-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Edit Gemini API Key</h3>
                            </div>
                            <button onClick={() => setShowEditGeminiModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateGeminiCredential} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name</label>
                                <input
                                    type="text"
                                    value={editGeminiCred.name}
                                    onChange={(e) => setEditGeminiCred((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    API Key <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editGeminiCred.api_key}
                                    onChange={(e) => setEditGeminiCred((prev) => ({ ...prev, api_key: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter new key to update"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editGeminiCred.is_default}
                                    onChange={(e) => setEditGeminiCred((prev) => ({ ...prev, is_default: e.target.checked }))}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">Set as default credential</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditGeminiModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2">
                                    <Check size={16} />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!credentialToDelete}
                onClose={() => {
                    setCredentialToDelete(null);
                    setDeleteType(null);
                }}
                onConfirm={deleteType === 'facebook' ? handleDeleteFacebookCredential : handleDeleteGeminiCredential}
                title="Delete Credential"
                message={`Are you sure you want to delete "${credentialToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
};

export default AdminSettings;
