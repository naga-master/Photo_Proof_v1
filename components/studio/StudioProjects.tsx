import React, { useState, useMemo } from 'react';
import type { Album, DashboardView, Client, ServicePackage } from '../../types';
import { PlusIcon } from '../icons';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { ImagePlaceholder } from '../common/ImagePlaceholder';

interface StudioProjectsProps {
  albums: Album[];
  clients: Client[];
  packages: ServicePackage[];
  setView: (view: DashboardView) => void;
  onManageProject: (album: Album) => void;
  onGenerateInvoice: (album: Album) => void;
}

const StudioProjects: React.FC<StudioProjectsProps> = ({ albums, clients, packages, setView, onManageProject, onGenerateInvoice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const getClientName = (clientId: number) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  };

  // Filter and sort albums
  const filteredAndSortedAlbums = useMemo(() => {
    let result = [...albums];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(album => {
        const titleMatch = album.title.toLowerCase().includes(searchLower);
        const clientName = getClientName(album.clientId).toLowerCase();
        const clientMatch = clientName.includes(searchLower);
        const dateMatch = album.shootDate?.toLowerCase().includes(searchLower);
        return titleMatch || clientMatch || dateMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(album => {
        if (statusFilter === 'published') return !album.isLocked;
        if (statusFilter === 'private') return album.isLocked;
        if (statusFilter === 'archived') return album.isLocked; // You may have an archived field
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      } else {
        // Sort by date (newest first)
        const dateA = new Date(a.shootDate || 0).getTime();
        const dateB = new Date(b.shootDate || 0).getTime();
        return dateB - dateA;
      }
    });

    return result;
  }, [albums, searchTerm, statusFilter, sortBy]);

  return (
    <div className="p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-600">Manage all your photography projects and galleries.</p>
        </div>
        <button onClick={() => setView('upload')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
            <PlusIcon className="w-5 h-5" />
            <span>New Project</span>
        </button>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input 
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
          />
          <div className="flex gap-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
            >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="private">Private</option>
                <option value="archived">Archived</option>
            </select>
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
               className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
             >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
            </select>
          </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedAlbums.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No projects found matching your filters.' 
                      : 'No projects yet. Create your first project!'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedAlbums.map((album) => {
                  const commentCount = (album.photos || []).reduce((acc, photo) => acc + (photo.comments?.length || 0), 0);
                  console.log(`[StudioProjects] Rendering project ${album.id}:`, {
                    title: album.title,
                    coverPhotoSrc: album.coverPhotoSrc,
                    isPlaceholder: album.coverPhotoSrc?.includes('placeholder')
                  });
                  return (
                    <tr key={album.id} onClick={() => onManageProject(album)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {album.coverPhotoId ? (
                              <AuthenticatedImage
                                photoId={album.coverPhotoId}
                                quality="thumbnail"
                                alt={album.title}
                                className="h-10 w-10 rounded-md object-cover"
                                aspectRatio="1/1"
                                colorVariant="auto"
                              />
                            ) : (
                              <ImagePlaceholder
                                aspectRatio="1/1"
                                showShimmer={false}
                                className="h-10 w-10 rounded-md"
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{album.title}</div>
                            <div className="text-sm text-gray-500">Client: {getClientName(album.clientId)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${album.isLocked ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {album.isLocked ? 'Private' : 'Published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{album.photoCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{commentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onGenerateInvoice(album); }} 
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                          title="Generate Invoice"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudioProjects;
