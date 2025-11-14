/**
 * Download Helper Utility
 * 
 * Provides cross-browser compatible image download functionality.
 * Handles CORS issues, network errors, and provides fallbacks.
 */

export interface DownloadOptions {
  filename?: string;
  showNotification?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Download an image file with proper browser handling
 * 
 * @param url - The image URL to download
 * @param options - Download options
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function downloadImage(
  url: string,
  options: DownloadOptions = {}
): Promise<boolean> {
  const {
    filename,
    showNotification = true,
    onSuccess,
    onError
  } = options;

  try {
    console.log('[DownloadHelper] Starting download:', url);

    // Method 1: Try fetch + blob approach (best for same-origin)
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'image/*',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Determine filename
      let downloadFilename = filename;
      if (!downloadFilename) {
        // Extract from URL or use default
        const urlPath = new URL(url, window.location.origin).pathname;
        downloadFilename = urlPath.split('/').pop() || 'photo.jpg';
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

      console.log('[DownloadHelper] ✅ Download successful:', downloadFilename);
      
      if (onSuccess) onSuccess();
      
      return true;

    } catch (fetchError: any) {
      console.warn('[DownloadHelper] Fetch method failed:', fetchError.message);
      
      // Method 2: Try proxy/alternative approach if fetch fails
      if (fetchError.message.includes('CORS') || fetchError.message.includes('NetworkError')) {
        console.log('[DownloadHelper] Attempting proxy method...');
        return await downloadWithProxy(url, filename || 'photo.jpg');
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[DownloadHelper] ❌ Download failed:', error);
    
    if (onError) {
      onError(error);
    }

    // Method 3: Last resort - open in new tab
    console.log('[DownloadHelper] Using fallback: opening in new tab');
    window.open(url, '_blank');
    
    return false;
  }
}

/**
 * Download using proxy approach (for CORS issues)
 * This converts the image to base64 and downloads it
 */
async function downloadWithProxy(url: string, filename: string): Promise<boolean> {
  try {
    // Create an image element to load the image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Request CORS
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);

        console.log('[DownloadHelper] ✅ Proxy download successful');
        resolve(true);
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.error('[DownloadHelper] Proxy method failed:', error);
    return false;
  }
}

/**
 * Sanitize filename for download
 * Removes special characters and spaces
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with dash
    .replace(/--+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Extract filename from photo alt text or URL
 */
export function getFilenameFromPhoto(photoSrc: string, photoAlt?: string): string {
  let filename = photoAlt || 'photo';
  
  // Sanitize and ensure .jpg extension
  filename = sanitizeFilename(filename);
  
  if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    // Try to extract extension from URL
    const urlMatch = photoSrc.match(/\.([a-z]{3,4})(?:\?|$)/i);
    const extension = urlMatch ? urlMatch[1] : 'jpg';
    filename += '.' + extension;
  }
  
  return filename;
}

/**
 * Check if browser supports modern download methods
 */
export function isBrowserSupported(): {
  fetch: boolean;
  blob: boolean;
  canvas: boolean;
  download: boolean;
} {
  return {
    fetch: typeof fetch !== 'undefined',
    blob: typeof Blob !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
    canvas: typeof document !== 'undefined' && typeof document.createElement === 'function',
    download: (() => {
      const a = document.createElement('a');
      return typeof a.download !== 'undefined';
    })()
  };
}

/**
 * Main export: Download handler to be used in components
 */
export async function handlePhotoDownload(
  photoSrc: string,
  photoAlt?: string,
  showToast?: (message: string, type: 'success' | 'error') => void
): Promise<void> {
  const filename = getFilenameFromPhoto(photoSrc, photoAlt);
  
  const success = await downloadImage(photoSrc, {
    filename,
    onSuccess: () => {
      if (showToast) {
        showToast('Photo downloaded successfully', 'success');
      }
    },
    onError: (error) => {
      if (showToast) {
        showToast('Failed to download photo. Opening in new tab instead.', 'error');
      }
    }
  });

  if (!success && !showToast) {
    console.log('[DownloadHelper] Download completed via fallback');
  }
}
