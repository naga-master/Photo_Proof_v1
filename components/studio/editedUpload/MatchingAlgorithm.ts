/**
 * Filename Matching Algorithm
 * Client-side implementation matching backend logic
 */

export interface MatchResult {
  matched: Array<{
    editedFilename: string;
    photoId: number;
    originalFilename: string;
    confidence: number;
    matchReason: string;
  }>;
  unmatched: Array<{
    editedFilename: string;
    suggestions: Array<{
      photoId: number;
      filename: string;
      confidence: number;
    }>;
  }>;
}

export interface OriginalPhoto {
  id: number;
  original_filename: string;
}

/**
 * Match edited filenames to original photos using multiple strategies
 */
export function matchFilenames(
  editedFiles: File[],
  originalPhotos: OriginalPhoto[],
  confidenceThreshold: number = 0.7
): MatchResult {
  const matched: MatchResult['matched'] = [];
  const unmatched: MatchResult['unmatched'] = [];

  // Create lookup for faster searching
  const photosByFilename = new Map<string, OriginalPhoto>();
  originalPhotos.forEach(photo => {
    photosByFilename.set(normalizeFilename(photo.original_filename), photo);
  });

  for (const file of editedFiles) {
    const editedFilename = file.name;
    const editedNormalized = normalizeFilename(editedFilename);
    const editedBase = getBasename(editedFilename);

    let bestMatch: OriginalPhoto | null = null;
    let confidence = 0.0;
    let matchReason = '';

    // Priority 1: Exact match (100%)
    if (photosByFilename.has(editedNormalized)) {
      bestMatch = photosByFilename.get(editedNormalized)!;
      confidence = 1.0;
      matchReason = 'exact';
    }

    // Priority 2: Suffix patterns (95%)
    if (!bestMatch) {
      const suffixPatterns = [
        /_edited$/i,
        /_edit$/i,
        /-edited$/i,
        /-edit$/i,
        /_final$/i,
        /-final$/i,
        / edited$/i,
        / edit$/i,
        /_v\d+$/i,
        /-v\d+$/i,
        / \(\d+\)$/i,
        /_corrected$/i,
        /-corrected$/i,
        /_retouched$/i,
      ];

      for (const pattern of suffixPatterns) {
        const cleanBase = editedBase.replace(pattern, '');
        const cleanNormalized = normalizeFilename(cleanBase + getExtension(editedFilename));

        if (photosByFilename.has(cleanNormalized)) {
          bestMatch = photosByFilename.get(cleanNormalized)!;
          confidence = 0.95;
          matchReason = 'suffix_pattern';
          break;
        }
      }
    }

    // Priority 3: Extension-agnostic match (85%)
    if (!bestMatch) {
      for (const [origFilename, photo] of photosByFilename.entries()) {
        const origBase = getBasename(photo.original_filename);
        if (normalizeFilename(origBase) === normalizeFilename(editedBase)) {
          bestMatch = photo;
          confidence = 0.85;
          matchReason = 'extension_difference';
          break;
        }
      }
    }

    // If we found a high-confidence match
    if (bestMatch && confidence >= confidenceThreshold) {
      matched.push({
        editedFilename,
        photoId: bestMatch.id,
        originalFilename: bestMatch.original_filename,
        confidence,
        matchReason,
      });
    } else {
      // Generate suggestions for manual mapping
      const suggestions = generateSuggestions(editedFilename, originalPhotos, 5);
      unmatched.push({
        editedFilename,
        suggestions,
      });
    }
  }

  return { matched, unmatched };
}

/**
 * Normalize filename for comparison (lowercase, strip whitespace)
 */
function normalizeFilename(filename: string): string {
  return filename.toLowerCase().trim();
}

/**
 * Get filename without extension
 */
function getBasename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0) {
    return filename.substring(0, lastDotIndex);
  }
  return filename;
}

/**
 * Get file extension including dot
 */
function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0) {
    return filename.substring(lastDotIndex);
  }
  return '';
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns float between 0.0 (no similarity) and 1.0 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Quick check for identical strings
  if (s1 === s2) return 1.0;

  // Check for substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length);
    const longer = Math.max(s1.length, s2.length);
    return shorter / longer;
  }

  // Levenshtein distance calculation
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
  if (len2 === 0) return 0.0;

  // Create matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1.0 : 1.0 - distance / maxLen;
}

/**
 * Generate filename match suggestions for manual mapping
 */
function generateSuggestions(
  editedFilename: string,
  originalPhotos: OriginalPhoto[],
  maxSuggestions: number = 5
): Array<{ photoId: number; filename: string; confidence: number }> {
  const editedBase = getBasename(editedFilename);
  const suggestions: Array<{ photoId: number; filename: string; confidence: number }> = [];

  for (const photo of originalPhotos) {
    const origBase = getBasename(photo.original_filename);
    const similarity = calculateSimilarity(editedBase, origBase);

    if (similarity > 0.3) {
      // Minimum threshold for suggestions
      suggestions.push({
        photoId: photo.id,
        filename: photo.original_filename,
        confidence: Math.round(similarity * 100) / 100, // Round to 2 decimals
      });
    }
  }

  // Sort by confidence and limit
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Get confidence badge color based on confidence level
 */
export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 1.0) return 'bg-green-100 text-green-800';
  if (confidence >= 0.9) return 'bg-blue-100 text-blue-800';
  if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Get confidence badge text
 */
export function getConfidenceBadgeText(confidence: number): string {
  if (confidence >= 1.0) return 'Exact Match';
  if (confidence >= 0.9) return 'High Confidence';
  if (confidence >= 0.8) return 'Good Match';
  return 'Low Confidence';
}

/**
 * Format confidence percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
