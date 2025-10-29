import React from 'react';
import type { Photo } from '../../types';
import { CloseIcon, XCircleIcon, ShoppingCartIcon } from '../icons';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: Photo[];
  onRemoveFromCompare: (photoId: number) => void;
  onNavigateToStore: () => void;
}

const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, compareList, onRemoveFromCompare, onNavigateToStore }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Compare Photos</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4">
          {compareList.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No photos selected for comparison.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-${compareList.length} gap-4 h-full`}>
                {compareList.map(photo => (
                    <div key={photo.id} className="relative group flex flex-col gap-4">
                        <div className="relative">
                            <img src={photo.src} alt={photo.alt} className="w-full h-auto max-h-[70vh] object-contain" />
                            <button 
                                onClick={() => onRemoveFromCompare(photo.id)}
                                className="absolute top-2 right-2 p-1 bg-white/70 rounded-full text-gray-600 hover:text-red-500 hover:bg-white"
                            >
                                <XCircleIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">{photo.alt}</p>
                            <button 
                              onClick={onNavigateToStore}
                              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700"
                            >
                              <ShoppingCartIcon className="w-4 h-4"/>
                              Order Prints
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompareModal;
