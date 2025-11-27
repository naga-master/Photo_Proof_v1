/**
 * Duplicate Detection Modal
 * Shows when duplicates are detected (photos, folders, or clients)
 */

import React from 'react';
import { DuplicateInfo } from '../services/photoService';

interface Props {
  duplicateInfo: DuplicateInfo;
  onAction: (action: 'skip' | 'replace' | 'use_existing' | 'create_anyway' | 'rename') => void;
  onClose: () => void;
}

export function DuplicateDetectionModal({ duplicateInfo, onAction, onClose }: Props) {
  const { type, message, existing_photo, existing_folder, existing_client } = duplicateInfo;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slideUp border-2"
        style={{ borderColor: 'rgba(var(--brand-primary-rgb), 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with brand color gradient */}
        <div className="studio-brand-bg px-6 py-4">
          <div className="flex items-center text-white">
            {/* Better warning icon */}
            <svg className="w-8 h-8 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-bold">Duplicate Detected</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Message */}
          <p className="text-gray-800 text-base leading-relaxed mb-5">{message}</p>

        {/* Photo Duplicate */}
        {type === 'photo_content' && existing_photo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-4">
              <img 
                src={existing_photo.thumbnail_url} 
                alt={existing_photo.filename}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {existing_photo.filename}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded: {new Date(existing_photo.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

          {/* Folder Duplicate */}
          {type === 'folder_name' && existing_folder && (
            <div 
              className="border-2 rounded-xl p-5 mb-5"
              style={{ 
                backgroundColor: 'rgba(var(--brand-primary-rgb), 0.05)',
                borderColor: 'rgba(var(--brand-primary-rgb), 0.2)'
              }}
            >
              <div className="flex items-start space-x-3 mb-4">
                {/* Folder icon */}
                <svg className="w-6 h-6 studio-brand-text flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    {existing_folder.name}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-5L9 1H4zm8 10a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{existing_folder.photo_count}</span>
                    <span className="ml-1">photo{existing_folder.photo_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div 
                className="bg-white/90 backdrop-blur rounded-lg px-4 py-3 border"
                style={{ borderColor: 'rgba(var(--brand-primary-rgb), 0.15)' }}
              >
                <p className="text-sm text-gray-700 leading-relaxed">
                  💡 <span className="font-medium">Tip:</span> Choose a unique name for your folder to continue.
                </p>
              </div>
            </div>
          )}

        {/* Client Phone Duplicate */}
        {type === 'client_phone' && existing_client && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Existing client:</span> {existing_client.name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Email:</span> {existing_client.email}
            </p>
          </div>
        )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 mt-6">
            {type === 'photo_content' && (
              <>
                <button
                  onClick={() => onAction('skip')}
                  className="px-5 py-3 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-150 shadow-sm border border-gray-200"
                >
                  Skip This Photo
                </button>
                <button
                  onClick={() => onAction('replace')}
                  className="px-5 py-3 btn-primary text-white rounded-xl font-medium active:scale-[0.98] transition-all duration-150 shadow-lg"
                >
                  Replace Existing Photo
                </button>
              </>
            )}

            {type === 'folder_name' && (
              <button
                onClick={onClose}
                className="w-full btn-primary px-5 py-3.5 text-white rounded-xl font-semibold active:scale-[0.98] transition-all duration-150 shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Got it, I'll rename the folder</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {type === 'client_phone' && (
              <>
                <button
                  onClick={() => onAction('use_existing')}
                  className="px-5 py-3 btn-primary text-white rounded-xl font-medium active:scale-[0.98] transition-all duration-150 shadow-lg"
                >
                  Use Existing Client
                </button>
                <button
                  onClick={() => onAction('create_anyway')}
                  className="px-5 py-3 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-150 shadow-sm border border-gray-200"
                >
                  Create New Anyway
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
