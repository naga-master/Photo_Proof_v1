/**
 * Comment Events - Event emitter for comment changes
 * Used to notify App.tsx when comments are added/deleted so it can update totalComments
 */

export type CommentEventType = 'comment-added' | 'comment-deleted';

export interface CommentEvent {
  type: CommentEventType;
  projectId: string;
  photoId: string;
}

type CommentEventListener = (event: CommentEvent) => void;

class CommentEventEmitter {
  private listeners: Set<CommentEventListener> = new Set();

  subscribe(listener: CommentEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: CommentEvent): void {
    console.log('[CommentEvents] Emitting event:', event);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[CommentEvents] Error in listener:', error);
      }
    });
  }
}

export const commentEvents = new CommentEventEmitter();
