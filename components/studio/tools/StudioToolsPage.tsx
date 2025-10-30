import React, { useState } from 'react';
import AIPhotoBooth from './AIPhotoBooth';
import HistoricImager from './HistoricImager';
import VirtualTryOn from './VirtualTryOn';

const tools = [
    {
        id: 'photoBooth',
        name: 'AI Photo Booth',
        description: 'Create fun, AI-generated photos with various styles.',
        imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 'historicImager',
        name: 'Historic Imager',
        description: 'Transform portraits into historical figures with AI.',
        imageUrl: 'https://images.unsplash.com/photo-1569783721833-5b86a81a3e94?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 'virtualTryOn',
        name: 'Virtual Try-On',
        description: 'See how clothing items look on models or clients.',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d916e6ca4431?q=80&w=800&auto=format&fit=crop',
    }
];

type ToolId = 'photoBooth' | 'historicImager' | 'virtualTryOn';

const StudioToolsPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);

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

    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">AI Tools Suite</h1>
                <p className="mt-1 text-gray-600">Enhance your workflow with powerful AI-driven features.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tools.map(tool => (
                    <div key={tool.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <img src={tool.imageUrl} alt={tool.name} className="h-48 w-full object-cover" />
                        <div className="p-6 flex-1 flex flex-col">
                            <h2 className="text-xl font-semibold text-gray-800">{tool.name}</h2>
                            <p className="mt-2 text-gray-600 flex-1">{tool.description}</p>
                            <button 
                                onClick={() => setActiveTool(tool.id as ToolId)}
                                className="mt-6 w-full px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
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
