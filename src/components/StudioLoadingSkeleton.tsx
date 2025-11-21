import React from 'react';

export function StudioLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar skeleton */}
      <div className="h-16 bg-gray-200 animate-pulse" />
      
      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="space-y-4">
          {/* Title skeleton */}
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          
          {/* Subtitle skeleton */}
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          
          {/* Content blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Additional content */}
          <div className="space-y-2 mt-8">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-500">
        Loading studio theme...
      </div>
    </div>
  );
}
