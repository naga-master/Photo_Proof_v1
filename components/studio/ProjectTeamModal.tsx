import React, { useState, useEffect } from 'react';
import { XCircleIcon, PlusIcon } from '../icons';
import { apiClient } from '../../lib/api-client';

interface TeamMember {
    id: number;
    user_id: string;
    name: string;
    email: string;
    role: string;
    assigned_at: string | null;
}

interface StudioUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface ProjectTeamModalProps {
    projectId: string;
    projectTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

const ProjectTeamModal: React.FC<ProjectTeamModalProps> = ({
    projectId,
    projectTitle,
    isOpen,
    onClose,
}) => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [studioUsers, setStudioUsers] = useState<StudioUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('editor');

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            fetchStudioUsers();
        }
    }, [isOpen, projectId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ members: TeamMember[]; total: number }>(
                `/v2/projects/${projectId}/members`
            );
            setMembers(response.members);
        } catch (err: any) {
            setError(err.message || 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudioUsers = async () => {
        try {
            console.log('[ProjectTeamModal] Fetching studio users...');
            const response = await apiClient.get<StudioUser[]>('/api/studio/users');
            console.log('[ProjectTeamModal] Studio users response:', response);
            setStudioUsers(response || []);
        } catch (err) {
            console.error('[ProjectTeamModal] Failed to load studio users:', err);
        }
    };

    const handleAddMember = async () => {
        console.log('[ProjectTeamModal] handleAddMember called, selectedUserId:', selectedUserId);
        if (!selectedUserId) {
            console.log('[ProjectTeamModal] No user selected, returning');
            return;
        }

        try {
            setSaving(true);
            console.log('[ProjectTeamModal] Adding member:', { projectId, user_id: selectedUserId, role: selectedRole });
            await apiClient.post(`/v2/projects/${projectId}/members`, {
                user_id: selectedUserId,
                role: selectedRole,
            });
            console.log('[ProjectTeamModal] Member added successfully');
            await fetchMembers();
            setSelectedUserId('');
            setSelectedRole('editor');
        } catch (err: any) {
            console.error('[ProjectTeamModal] Error adding member:', err);
            setError(err.message || 'Failed to add member');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Remove this member from the project?')) return;

        try {
            setSaving(true);
            await apiClient.delete(`/v2/projects/${projectId}/members/${userId}`);
            await fetchMembers();
        } catch (err: any) {
            setError(err.message || 'Failed to remove member');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            setSaving(true);
            await apiClient.patch(`/v2/projects/${projectId}/members/${userId}`, {
                user_id: userId,
                role: newRole,
            });
            await fetchMembers();
        } catch (err: any) {
            setError(err.message || 'Failed to update role');
        } finally {
            setSaving(false);
        }
    };

    const availableUsers = studioUsers.filter(
        (user) => !members.some((m) => m.user_id === user.id)
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-800';
            case 'editor':
                return 'bg-blue-100 text-blue-800';
            case 'viewer':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Manage Team</h2>
                            <p className="text-sm text-gray-500 mt-1">{projectTitle}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                            <button onClick={() => setError(null)} className="float-right text-red-500 hover:text-red-700">×</button>
                        </div>
                    )}

                    {/* Add Member Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Team Member</h3>
                        <div className="space-y-2">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">Select a user...</option>
                                {availableUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedUserId || saving}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </div>
                        {availableUsers.length === 0 && (
                            <p className="text-xs text-gray-500 mt-2">All studio users are already assigned to this project.</p>
                        )}
                    </div>

                    {/* Members List */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Team ({members.length})</h3>
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No team members assigned yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                disabled={saving}
                                                className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getRoleBadgeColor(member.role)} cursor-pointer`}
                                            >
                                                <option value="owner">Owner</option>
                                                <option value="editor">Editor</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                disabled={saving}
                                                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                title="Remove from project"
                                            >
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectTeamModal;
