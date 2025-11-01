import React from 'react';
import type { Album, DashboardView, Client } from '../../types';
import { PlusIcon } from '../icons';

interface StudioProjectsProps {
  albums: Album[];
  clients: Client[];
  setView: (view: DashboardView) => void;
  onManageProject: (album: Album) => void;
}

const StudioProjects: React.FC<StudioProjectsProps> = ({ albums, clients, setView, onManageProject }) => {
  const getClientName = (clientId: number) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  }

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
            className="flex-grow bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-400 sm:text-sm"
          />
          <div className="flex gap-4">
            <select className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-400 sm:text-sm">
                <option>All Statuses</option>
                <option>Published</option>
                <option>Draft</option>
                <option>Archived</option>
            </select>
             <select className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-400 sm:text-sm">
                <option>Sort by Date</option>
                <option>Sort by Name</option>
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
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {albums.map((album) => {
                const commentCount = (album.photos || []).reduce((acc, photo) => acc + (photo.comments?.length || 0), 0);
                return (
                  <tr key={album.id} onClick={() => onManageProject(album)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-md object-cover" src={album.coverPhotoSrc} alt={album.title} />
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
                      <button onClick={(e) => { e.stopPropagation(); onManageProject(album); }} className="text-indigo-600 hover:text-indigo-900">Manage</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudioProjects;
