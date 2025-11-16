import React, { useEffect, useState, useCallback } from 'react';
import type { MappingDetails } from './EditedUploadContext';

interface ConnectionLinesProps {
  selectedFile: File | null;
  hoveredPhotoId: number | null;
  mappings: Map<string, MappingDetails>;
  leftPanelRef: React.RefObject<HTMLDivElement>;
  middlePanelRef: React.RefObject<HTMLDivElement>;
  rightPanelRef: React.RefObject<HTMLDivElement>;
}

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Connection Lines Component
 * Draws animated SVG lines showing relationships between panels
 * - Blue dashed line: Selected file → Hovered photo (potential mapping)
 * - Green solid line: Mapping card → Source file and photo (confirmed mapping)
 */
const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  selectedFile,
  hoveredPhotoId,
  mappings,
  leftPanelRef,
  middlePanelRef,
  rightPanelRef,
}) => {
  const [filePositions, setFilePositions] = useState<Map<string, ElementPosition>>(new Map());
  const [photoPositions, setPhotoPositions] = useState<Map<number, ElementPosition>>(new Map());
  const [mappingPositions, setMappingPositions] = useState<Map<string, ElementPosition>>(new Map());
  
  // Calculate element positions
  const updatePositions = useCallback(() => {
    // Get file card positions
    const fileCards = leftPanelRef.current?.querySelectorAll('[data-file-name]');
    const newFilePositions = new Map<string, ElementPosition>();
    
    fileCards?.forEach((card) => {
      const filename = card.getAttribute('data-file-name');
      if (filename) {
        const rect = card.getBoundingClientRect();
        newFilePositions.set(filename, {
          x: rect.left + rect.width,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    
    // Get photo card positions
    const photoCards = rightPanelRef.current?.querySelectorAll('[data-photo-id]');
    const newPhotoPositions = new Map<number, ElementPosition>();
    
    photoCards?.forEach((card) => {
      const photoIdStr = card.getAttribute('data-photo-id');
      if (photoIdStr) {
        const photoId = Number(photoIdStr);
        const rect = card.getBoundingClientRect();
        newPhotoPositions.set(photoId, {
          x: rect.left,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    
    // Get mapping card positions
    const mappingCards = middlePanelRef.current?.querySelectorAll('[data-mapping-file]');
    const newMappingPositions = new Map<string, ElementPosition>();
    
    mappingCards?.forEach((card) => {
      const filename = card.getAttribute('data-mapping-file');
      if (filename) {
        const rect = card.getBoundingClientRect();
        newMappingPositions.set(filename, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    
    setFilePositions(newFilePositions);
    setPhotoPositions(newPhotoPositions);
    setMappingPositions(newMappingPositions);
  }, [leftPanelRef, middlePanelRef, rightPanelRef]);
  
  // Update positions on mount and when dependencies change
  useEffect(() => {
    updatePositions();
    
    // Update on window resize (debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updatePositions, 200);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Update on scroll (for scrollable panels)
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    
    leftPanel?.addEventListener('scroll', updatePositions);
    rightPanel?.addEventListener('scroll', updatePositions);
    
    // Use RAF for smoother updates
    const rafId = requestAnimationFrame(updatePositions);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      leftPanel?.removeEventListener('scroll', updatePositions);
      rightPanel?.removeEventListener('scroll', updatePositions);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(rafId);
    };
  }, [updatePositions, leftPanelRef, rightPanelRef, selectedFile, hoveredPhotoId, mappings]);
  
  // Generate SVG path for cubic bezier curve
  const generatePath = (start: ElementPosition, end: ElementPosition): string => {
    const startX = start.x;
    const startY = start.y;
    const endX = end.x;
    const endY = end.y;
    
    // Control points for smooth curve
    const controlX1 = startX + (endX - startX) * 0.3;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.7;
    const controlY2 = endY;
    
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };
  
  // Render hover line (blue dashed)
  const renderHoverLine = () => {
    if (!selectedFile || !hoveredPhotoId) return null;
    
    const filePos = filePositions.get(selectedFile.name);
    const photoPos = photoPositions.get(hoveredPhotoId);
    
    if (!filePos || !photoPos) return null;
    
    const path = generatePath(filePos, photoPos);
    
    return (
      <g key="hover-line" className="opacity-0 animate-[fadeIn_0.2s_ease-in_forwards]">
        <path
          d={path}
          stroke="#3B82F6"
          strokeWidth="3"
          strokeDasharray="8 4"
          fill="none"
          opacity="0.8"
          className="animate-pulse"
        />
        {/* Arrowhead */}
        <circle
          cx={photoPos.x}
          cy={photoPos.y}
          r="4"
          fill="#3B82F6"
          className="animate-pulse"
        />
      </g>
    );
  };
  
  // Render confirmed mapping lines (green solid)
  const renderMappingLines = () => {
    const lines: JSX.Element[] = [];
    
    mappings.forEach((details, filename) => {
      const mappingPos = mappingPositions.get(filename);
      const filePos = filePositions.get(filename);
      const photoPos = photoPositions.get(details.photoId);
      
      if (!mappingPos) return;
      
      // Line from mapping card to file (if visible)
      if (filePos) {
        const path = generatePath(
          { ...filePos, x: filePos.x, y: filePos.y },
          mappingPos
        );
        
        lines.push(
          <path
            key={`mapping-to-file-${filename}`}
            d={path}
            stroke="#10B981"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            className="transition-opacity duration-200"
          />
        );
      }
      
      // Line from mapping card to photo (if visible)
      if (photoPos) {
        const path = generatePath(
          mappingPos,
          photoPos
        );
        
        lines.push(
          <path
            key={`mapping-to-photo-${filename}`}
            d={path}
            stroke="#10B981"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            className="transition-opacity duration-200"
          />
        );
        
        // Add arrowhead at photo end
        lines.push(
          <circle
            key={`mapping-arrow-${filename}`}
            cx={photoPos.x}
            cy={photoPos.y}
            r="3"
            fill="#10B981"
            opacity="0.8"
          />
        );
      }
    });
    
    return lines;
  };
  
  return (
    <svg
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Render confirmed mapping lines first (behind) */}
      {renderMappingLines()}
      
      {/* Render hover line last (on top) */}
      {renderHoverLine()}
    </svg>
  );
};

export default ConnectionLines;
