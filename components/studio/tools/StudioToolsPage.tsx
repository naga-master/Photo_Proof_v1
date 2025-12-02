import React, { useState, useEffect } from 'react';
import AIPhotoBooth from './AIPhotoBooth';
import HistoricImager from './HistoricImager';
import VirtualTryOn from './VirtualTryOn';
import { apiClient } from '../../../lib/api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AITool {
    id: string;
    name: string;
    description: string;
    thumbnail_path: string;
    tool_id: string;
    is_active: boolean;
    order_index: number;
}

type ToolId = 'photoBooth' | 'historicImager' | 'virtualTryOn';

const StudioToolsPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [tools, setTools] = useState<AITool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTools = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<{ tools: AITool[]; total: number }>('/v2/ai-tools', { active_only: 'true' });
                setTools(data.tools || []);
            } catch (err: any) {
                console.error('Error fetching AI tools:', err);
                if (err.status === 403) {
                    setError('You do not have permission to access AI tools.');
                } else {
                    setError('Failed to load AI tools. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTools();
    }, []);

    const renderActiveTool = () => {
        switch(activeTool) {
            case 'photoBooth':
                return <AIPhotoBooth onBack={() => setActiveTool(null)} />;
            case 'historicImager':
                return <HistoricImager onBack={() => setActiveTool(null)} />;
            case 'virtualTryOn':
                return <VirtualTryOn onBack={() => setActiveTool(null)} />;
            default:
                return null;
        }
    }

    if (activeTool) {
        return (
            <div className="h-full flex items-center justify-center">
                {renderActiveTool()}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI Tools Suite</h1>
                    <p className="mt-1 text-gray-600">Enhance your workflow with powerful AI-driven features.</p>
                </header>
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-600">Loading AI tools...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI Tools Suite</h1>
                    <p className="mt-1 text-gray-600">Enhance your workflow with powerful AI-driven features.</p>
                </header>
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-600">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">AI Tools Suite</h1>
                <p className="mt-1 text-gray-600">Enhance your workflow with powerful AI-driven features.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tools.map(tool => (
                    <div key={tool.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <img 
                            src={`${API_URL}/uploads/${tool.thumbnail_path}`} 
                            alt={tool.name} 
                            className="h-48 w-full object-cover"
                            onError={(e) => {
                                // Fallback to a placeholder if image fails to load
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23ddd" width="800" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="30" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        <div className="p-6 flex-1 flex flex-col">
                            <h2 className="text-xl font-semibold text-gray-800">{tool.name}</h2>
                            <p className="mt-2 text-gray-600 flex-1">{tool.description}</p>
                            <button 
                                onClick={() => setActiveTool(tool.tool_id as ToolId)}
                                className="mt-6 w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                            >
                                Launch Tool
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudioToolsPage;
