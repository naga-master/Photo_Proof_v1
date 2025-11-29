/**
 * Comment Service - Backend API Integration
 * 
 * Handles all comment-related operations with backend API
 * Includes caching strategy for optimized performance
 */

import type { Comment } from '../types';
import { apiClient } from '../lib/api-client';
import { commentEvents } from './commentEvents';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Backend API response types
interface BackendCommentResponse {
    id: number;
    photo_id: number;
    user_id: string;
    text: string;
    author: 'Client' | 'Studio';
    user_name: string;
    user_avatar: string | null;
    parent_comment_id: number | null;
    reply_to_id: number | null;
    reply_to_author: string | null;
    reply_to_text: string | null;
    is_edited: boolean;
    timestamp: string;
    created_at: string;
    updated_at: string;
    replies: BackendCommentResponse[];
}

interface BackendCommentListResponse {
    comments: BackendCommentResponse[];
    total: number;
    photo_id: number;
}

interface BackendCommentCreateResponse {
    id: number;
    photo_id: number;
    user_id: string;
    text: string;
    author: 'Client' | 'Studio';
    user_name: string;
    user_avatar: string | null;
    parent_comment_id: number | null;
    reply_to_id: number | null;
    reply_to_author: string | null;
    reply_to_text: string | null;
    is_edited: boolean;
    timestamp: string;
    created_at: string;
    updated_at: string;
    replies: BackendCommentResponse[];
}

/**
 * Map backend comment response to frontend Comment type
 */
const mapBackendComment = (backendComment: BackendCommentResponse): Comment => {
    return {
        id: backendComment.id,
        author: backendComment.author,
        userName: backendComment.user_name,
        text: backendComment.text,
        timestamp: backendComment.timestamp,
        replies: backendComment.replies.map(mapBackendComment),
        // Add replyToId for WhatsApp-style context
        ...(backendComment.reply_to_id && { replyToId: backendComment.reply_to_id })
    };
};

/**
 * Get cache key for photo comments
 */
const getCacheKey = (photoId: number): string => {
    return `comments:photo-${photoId}`;
};

/**
 * Check memory cache for comments
 */
const getFromMemoryCache = (photoId: number): Comment[] | null => {
    if ((window as any).__cache) {
        const cached = (window as any).__cache.get(getCacheKey(photoId));
        if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[CommentService] ✅ Memory cache hit for photo ${photoId}`);
            return cached.data;
        }
    }
    return null;
};

/**
 * Check IndexedDB cache for comments
 */
const getFromIndexedDB = async (photoId: number): Promise<Comment[] | null> => {
    if ((window as any).__indexedDB) {
        try {
            const cached = await (window as any).__indexedDB.get(getCacheKey(photoId));
            if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log(`[CommentService] ✅ IndexedDB cache hit for photo ${photoId}`);
                return cached.data;
            }
        } catch (error) {
            console.error('[CommentService] IndexedDB read error:', error);
        }
    }
    return null;
};

/**
 * Store comments in cache
 */
const storeInCache = async (photoId: number, comments: Comment[]): Promise<void> => {
    const cacheData = {
        data: comments,
        timestamp: Date.now()
    };
    
    // Store in memory cache
    if ((window as any).__cache) {
        (window as any).__cache.set(getCacheKey(photoId), cacheData);
        console.log(`[CommentService] ✅ Stored in memory cache for photo ${photoId}`);
    }
    
    // Store in IndexedDB
    if ((window as any).__indexedDB) {
        try {
            await (window as any).__indexedDB.set(getCacheKey(photoId), cacheData);
            console.log(`[CommentService] ✅ Stored in IndexedDB for photo ${photoId}`);
        } catch (error) {
            console.error('[CommentService] IndexedDB write error:', error);
        }
    }
};

/**
 * Invalidate cache for a photo
 */
const invalidateCache = async (photoId: number): Promise<void> => {
    const cacheKey = getCacheKey(photoId);
    console.log(`[CommentService] 🗑️ Invalidating cache for photo ${photoId}, key: ${cacheKey}`);
    
    // Clear memory cache
    const cache = (window as any).__cache;
    if (cache) {
        if (typeof cache.delete === 'function') {
            const deleted = cache.delete(cacheKey);
            console.log(`[CommentService] Memory cache deleted: ${deleted}`);
        } else if (cache instanceof Map) {
            const deleted = cache.delete(cacheKey);
            console.log(`[CommentService] Memory cache Map deleted: ${deleted}`);
        } else {
            console.warn('[CommentService] Cache exists but has no delete method', typeof cache);
        }
    } else {
        console.warn('[CommentService] No memory cache found');
    }
    
    // Clear IndexedDB cache
    const indexedDB = (window as any).__indexedDB;
    if (indexedDB && typeof indexedDB.delete === 'function') {
        try {
            await indexedDB.delete(cacheKey);
            console.log(`[CommentService] IndexedDB cache deleted`);
        } catch (error) {
            console.error('[CommentService] IndexedDB delete error:', error);
        }
    }
};

class CommentService {
    /**
     * Get all comments for a photo (with caching)
     * @param photoId - The photo ID
     * @param forceRefresh - If true, bypass cache and fetch fresh data
     */
    static async getPhotoComments(photoId: number, forceRefresh: boolean = false): Promise<Comment[]> {
        console.log(`[CommentService] Fetching comments for photo ${photoId}, forceRefresh: ${forceRefresh}`);
        
        // If force refresh, invalidate cache first
        if (forceRefresh) {
            await invalidateCache(photoId);
        } else {
            // Check memory cache first
            const memoryCache = getFromMemoryCache(photoId);
            if (memoryCache) {
                return memoryCache;
            }
            
            // Check IndexedDB cache
            const indexedDBCache = await getFromIndexedDB(photoId);
            if (indexedDBCache) {
                // Store in memory for next access
                if ((window as any).__cache) {
                    (window as any).__cache.set(getCacheKey(photoId), {
                        data: indexedDBCache,
                        timestamp: Date.now()
                    });
                }
                return indexedDBCache;
            }
        }
        
        // Cache miss or force refresh - fetch from API
        console.log(`[CommentService] ⚠️ Fetching from API`);
        
        const data = await apiClient.get<BackendCommentListResponse>(
            `/api/comments/photos/${photoId}`
        );
        
        const comments = data.comments.map(mapBackendComment);
        
        // Store in cache
        await storeInCache(photoId, comments);
        
        return comments;
    }
    
    /**
     * Create a new comment or reply
     */
    static async createComment(
        photoId: number,
        text: string,
        parentCommentId?: number,
        replyToId?: number,
        projectId?: string
    ): Promise<Comment> {
        console.log(`[CommentService] Creating comment for photo ${photoId}`, {
            parentCommentId,
            replyToId,
            projectId
        });
        
        // If replyToId is provided, determine the parent comment
        // All replies should be stored under the top-level parent
        let actualParentId = parentCommentId;
        if (replyToId && !parentCommentId) {
            // This is a reply - set parent to the reply target
            actualParentId = replyToId;
        }
        
        const data = await apiClient.post<BackendCommentCreateResponse>(
            `/api/comments/`,
            {
                photo_id: photoId,
                text: text,
                parent_comment_id: actualParentId || null,
                reply_to_id: replyToId || null,
            }
        );
        
        // Invalidate cache since we have new data
        await invalidateCache(photoId);
        
        // Emit event for dashboard update
        if (projectId) {
            commentEvents.emit({
                type: 'comment-added',
                projectId,
                photoId: String(photoId)
            });
        }
        
        // Map to frontend format
        return mapBackendComment(data);
    }
    
    /**
     * Update an existing comment
     */
    static async updateComment(commentId: number, text: string, photoId: number): Promise<Comment> {
        console.log(`[CommentService] Updating comment ${commentId}`);
        
        const data = await apiClient.patch<BackendCommentCreateResponse>(
            `/api/comments/${commentId}`,
            { text }
        );
        
        // Invalidate cache
        await invalidateCache(photoId);
        
        return mapBackendComment(data);
    }
    
    /**
     * Delete a comment
     */
    static async deleteComment(commentId: number, photoId: number, projectId?: string): Promise<void> {
        console.log(`[CommentService] Deleting comment ${commentId}`);
        
        await apiClient.delete<void>(`/api/comments/${commentId}`);
        
        // Invalidate cache
        await invalidateCache(photoId);
        
        // Emit event for dashboard update
        if (projectId) {
            commentEvents.emit({
                type: 'comment-deleted',
                projectId,
                photoId: String(photoId)
            });
        }
    }
}

export default CommentService;
export { CommentService };
