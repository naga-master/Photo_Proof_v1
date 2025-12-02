import React, { useState, useMemo } from 'react';
import type { Album, DashboardView, Client, ServicePackage } from '../../types';
import { PlusIcon } from '../icons';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { ImagePlaceholder } from '../common/ImagePlaceholder';
import { CanCreate } from '../AccessGate';
import { useAccessControl } from '../../contexts/AccessControlContext';

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
  const { hasPermission } = useAccessControl();

  const getClientName = (clientId: string | number) => {
    return clients.find(c => String(c.id) === String(clientId))?.name || 'N/A';
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
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all your photography projects and galleries.</p>
        </div>
        <CanCreate module="projects">
          <button onClick={() => setView('upload')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-all duration-fast shadow-sm hover:shadow-md">
              <PlusIcon className="w-5 h-5" />
              <span>New Project</span>
          </button>
        </CanCreate>
      </header>

      <div className="mb-6 flex flex-col gap-3">
          <input 
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-fast"
          />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-fast"
            >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="private">Private</option>
                <option value="archived">Archived</option>
            </select>
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
               className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-fast"
             >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
            </select>
          </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
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
                  const commentCount = album.totalComments || 0;
                  console.log(`[StudioProjects] Rendering project ${album.id}:`, {
                    title: album.title,
                    coverPhotoSrc: album.coverPhotoSrc,
                    isPlaceholder: album.coverPhotoSrc?.includes('placeholder')
                  });
                  return (
                    <tr key={album.id} onClick={() => onManageProject(album)} className="hover:bg-gray-50 transition-all duration-fast cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {album.coverPhotoId ? (
                              <AuthenticatedImage
                                photoId={album.coverPhotoId}
                                quality="thumbnail"
                                alt={album.title}
                                className="h-10 w-10 rounded-lg object-cover"
                                aspectRatio="1/1"
                                colorVariant="auto"
                              />
                            ) : (
                              <ImagePlaceholder
                                aspectRatio="1/1"
                                showShimmer={false}
                                className="h-10 w-10 rounded-lg"
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
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${album.isLocked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {album.isLocked ? 'Private' : 'Published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{album.photoCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{commentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {hasPermission('canCreateInvoices') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onGenerateInvoice(album); }} 
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all duration-fast"
                            title="Generate Invoice"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid gap-4">
        {filteredAndSortedAlbums.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'No projects found matching your filters.' 
                : 'No projects yet. Create your first project!'}
            </p>
          </div>
        ) : (
          filteredAndSortedAlbums.map((album) => {
            const commentCount = album.totalComments || 0;
            return (
              <div 
                key={album.id}
                onClick={() => onManageProject(album)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden active:scale-[0.98] transition-all duration-fast cursor-pointer"
              >
                {/* Cover Image */}
                <div className="aspect-video relative bg-gray-100">
                  {album.coverPhotoId ? (
                    <AuthenticatedImage
                      photoId={album.coverPhotoId}
                      quality="medium"
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      aspectRatio="16/9"
                      showShimmer={false}
                      className="w-full h-full"
                    />
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                      album.isLocked 
                        ? 'bg-amber-500/90 text-white' 
                        : 'bg-emerald-500/90 text-white'
                    }`}>
                      {album.isLocked ? 'Private' : 'Published'}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-0.5 truncate">{album.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{getClientName(album.clientId)}</p>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {album.photoCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {commentCount}
                      </span>
                    </div>
                  </div>

                  {hasPermission('canCreateInvoices') && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onGenerateInvoice(album); 
                      }} 
                      className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-all duration-fast flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Invoice
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudioProjects;
