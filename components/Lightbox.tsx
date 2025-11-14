import React, { useEffect, useState, useRef } from 'react';
import type { Photo, Comment } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, HeartIcon, HeartFilledIcon, DownloadIcon, ChatBubbleIcon, CheckIcon, PlayIcon, PauseIcon } from './icons';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAddComment: (photoId: string, commentText: string, parentId?: number) => void | Promise<void>;
  onLoadComments: (photoId: string) => Promise<void>;
  isSlideshowActive: boolean;
  setSlideshowActive: (isActive: boolean) => void;
  favorites: string[];
  selections: string[];
  toggleFavorite: (photoId: string) => void;
  toggleSelection: (photoId: string) => void;
  onDownload: (photoSrc: string, photoAlt: string) => void;
}

const CommentForm: React.FC<{
    photoId: string;
    parentId?: number;
    onAddComment: (photoId: string, commentText: string, parentId?: number) => void | Promise<void>;
    onCancel?: () => void;
    isReply?: boolean;
}> = ({ photoId, parentId, onAddComment, onCancel, isReply = false }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isReply){
            inputRef.current?.focus();
        }
    }, [isReply]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (comment.trim() && !isSubmitting) {
            setIsSubmitting(true);
            try {
                console.log('[CommentForm] Submitting comment:', { photoId, text: comment.trim(), parentId });
                await onAddComment(photoId, comment.trim(), parentId);
                console.log('[CommentForm] Comment submitted successfully');
                setComment('');
                if(onCancel) onCancel();
            } catch (error: any) {
                console.error('[CommentForm] Failed to add comment:', error);
                // Keep the input text on error so user can retry
                // Error is already shown by toast in App.tsx
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${isReply ? 'p-2 bg-gray-100 rounded-md' : 'p-4 border-t bg-gray-50'}`}>
            <textarea
                ref={inputRef as any}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isReply ? "Write a reply..." : "Add a comment..."}
                rows={isReply ? 2 : 3}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors bg-white text-gray-900 resize-none"
            />
            <div className="flex justify-end gap-2">
                {isReply && onCancel && (
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={isSubmitting || !comment.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Sending...' : 'Send'}
                </button>
            </div>
        </form>
    );
};

const CommentThread: React.FC<{
    comment: Comment;
    replyingTo: number | null;
    setReplyingTo: (id: number | null) => void;
    photoId: string;
    onAddComment: (photoId: string, commentText: string, parentId?: number) => void | Promise<void>;
    isReply?: boolean;
    depth?: number;
    allComments?: Comment[];
    messageRefs?: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
    scrollToMessage?: (messageId: number) => void;
}> = ({ comment, replyingTo, setReplyingTo, photoId, onAddComment, isReply = false, depth = 0, allComments = [], messageRefs, scrollToMessage }) => {

    const isReplying = replyingTo === comment.id;
    
    // Find the original message this is replying to
    const replyToId = (comment as any).replyToId;
    let originalMessage: Comment | null = null;
    
    if (replyToId && allComments.length > 0) {
        // Search in parent comments
        originalMessage = allComments.find(c => c.id === replyToId) || null;
        
        // If not found, search in replies
        if (!originalMessage) {
            for (const parentComment of allComments) {
                if (parentComment.replies) {
                    originalMessage = parentComment.replies.find(r => r.id === replyToId) || null;
                    if (originalMessage) break;
                }
            }
        }
    }

    return (
        <div 
            className="flex flex-col transition-colors duration-300"
            ref={(el) => {
                if (messageRefs && messageRefs.current) {
                    messageRefs.current[comment.id] = el;
                }
            }}
        >
            <div className="flex items-start gap-2 hover:bg-gray-50 rounded-lg p-1.5 -ml-1.5 transition-colors">
                {/* Avatar placeholder */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${comment.author === 'Studio' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                    {comment.author.charAt(0)}
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    
                    {/* WhatsApp-style quoted message - clickable to scroll to original */}
                    {isReply && originalMessage && (
                        <div 
                            onClick={() => scrollToMessage && scrollToMessage(originalMessage!.id)}
                            className="mt-1 mb-2 border-l-4 border-green-500 bg-gray-100 rounded px-2 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-xs font-semibold text-green-600">{originalMessage.author}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{originalMessage.text}</p>
                        </div>
                    )}
                    
                    <p className="text-sm text-gray-800 mt-0.5 break-words">{comment.text}</p>
                    
                    <button onClick={() => setReplyingTo(comment.id)} className="text-xs font-medium text-blue-600 hover:underline mt-1">
                        Reply
                    </button>
                </div>
            </div>

            {/* Show replies - all at same visual level (flat hierarchy) */}
            {comment.replies && comment.replies.length > 0 && (
                <div className={`mt-2 space-y-2 ${depth === 0 ? 'pl-10 border-l-2 border-gray-200 ml-4' : ''}`}>
                    {comment.replies.map(reply => (
                        <CommentThread 
                            key={reply.id} 
                            comment={reply}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            photoId={photoId}
                            onAddComment={onAddComment}
                            isReply={true}
                            depth={depth === 0 ? 1 : depth}
                            allComments={[comment, ...(comment.replies || [])]}
                            messageRefs={messageRefs}
                            scrollToMessage={scrollToMessage}
                        />
                    ))}
                </div>
            )}
            
            {/* Reply form */}
            {isReplying && (
                <div className={`mt-2 ${depth === 0 ? 'pl-10 ml-4' : ''}`}>
                    <CommentForm
                        photoId={photoId}
                        parentId={comment.id}
                        onAddComment={onAddComment}
                        onCancel={() => setReplyingTo(null)}
                        isReply
                    />
                </div>
            )}
        </div>
    );
};

const CommentsPanel: React.FC<{ photo: Photo; onAddComment: (photoId: string, commentText: string, parentId?: number) => void | Promise<void>; }> = ({ photo, onAddComment }) => {
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [lastRepliedTo, setLastRepliedTo] = useState<number | null>(null);
    const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const previousCommentCount = useRef(0);

    // Scroll to the comment that was just replied to (not to bottom)
    useEffect(() => {
        if (photo.comments && photo.comments.length > previousCommentCount.current) {
            // New comment added
            if (lastRepliedTo !== null) {
                // This was a reply - scroll to the parent comment
                setTimeout(() => {
                    scrollToMessage(lastRepliedTo);
                    setLastRepliedTo(null);
                }, 100);
            } else {
                // This was a root comment - scroll to bottom
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
        previousCommentCount.current = photo.comments?.length || 0;
    }, [photo.comments, lastRepliedTo]);

    const scrollToMessage = (messageId: number) => {
        const messageElement = messageRefs.current[messageId];
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a highlight effect
            messageElement.classList.add('bg-yellow-100');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100');
            }, 1500);
        }
    };
    
    // Wrapper for onAddComment that tracks which comment was replied to
    const handleAddComment = async (photoId: string, commentText: string, parentId?: number) => {
        if (parentId) {
            setLastRepliedTo(parentId);
        }
        await onAddComment(photoId, commentText, parentId);
    };

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <h3 className="p-4 text-lg font-semibold border-b text-gray-800">Comments</h3>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(!photo.comments || photo.comments.length === 0) && (
                    <p className="text-sm text-gray-500 text-center mt-4">No comments yet.</p>
                )}
                {photo.comments?.map(comment => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        photoId={photo.id}
                        onAddComment={handleAddComment}
                        allComments={photo.comments}
                        messageRefs={messageRefs}
                        scrollToMessage={scrollToMessage}
                     />
                ))}
                <div ref={commentsEndRef} />
            </div>
            <CommentForm photoId={photo.id} onAddComment={handleAddComment} />
        </div>
    );
};


const Lightbox: React.FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev, onAddComment, onLoadComments, isSlideshowActive, setSlideshowActive, favorites, selections, toggleFavorite, toggleSelection, onDownload }) => {
  const currentPhoto = photos[currentIndex];
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onPrev, onNext]);
  
  // Reset comment visibility when photo changes
  useEffect(() => {
    setShowComments(false);
  }, [currentIndex]);
  
  // Load comments when comment panel is opened
  useEffect(() => {
    const loadComments = async () => {
      if (showComments && currentPhoto && (!currentPhoto.comments || currentPhoto.comments.length === 0)) {
        setCommentsLoading(true);
        await onLoadComments(currentPhoto.id);
        setCommentsLoading(false);
      }
    };
    
    loadComments();
  }, [showComments, currentPhoto?.id]);
  
  useEffect(() => {
    let timer: number;
    if (isSlideshowActive) {
      timer = window.setTimeout(() => {
        onNext();
      }, 3000);
    }
    return () => window.clearTimeout(timer);
  }, [isSlideshowActive, currentIndex, onNext]);

  if (!currentPhoto) return null;

  const isFavorite = favorites.includes(currentPhoto.id);
  const isSelection = selections.includes(currentPhoto.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center transition-all duration-300" onClick={(e) => e.stopPropagation()} style={{ paddingRight: showComments ? '320px' : '0' }}>
        
        <div className="max-w-[90vw] max-h-[85vh] animate-slide-up">
            <img src={currentPhoto.src} alt={currentPhoto.alt} className="w-auto h-auto max-w-full max-h-[85vh] object-contain" />
        </div>
        
        <div 
          className="absolute top-0 left-0 h-16 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center px-4 text-white transition-all duration-300"
          style={{ right: showComments ? '320px' : '0' }}
        >
          <span className="text-sm font-medium">{currentIndex + 1} of {photos.length}</span>
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setSlideshowActive(!isSlideshowActive)} className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none border-0" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label={isSlideshowActive ? "Pause slideshow" : "Play slideshow"}>
                {isSlideshowActive ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
             </button>
             <button onClick={() => toggleSelection(currentPhoto.id)} className={`p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none border-0 ${isSelection ? 'bg-blue-600/50' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label="Select">
                <CheckIcon className="w-6 h-6" />
             </button>
             <button onClick={() => toggleFavorite(currentPhoto.id)} className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 border-0" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label="Favorite">
                {isFavorite ? <HeartFilledIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
             </button>
             <button onClick={() => onDownload(currentPhoto.src, currentPhoto.alt)} className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none border-0" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label="Download">
                <DownloadIcon className="w-6 h-6" />
             </button>
             <button onClick={() => setShowComments(!showComments)} className="p-2 rounded-full hover:bg-white/20 transition-colors relative focus:outline-none border-0" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label="Comments">
                <ChatBubbleIcon className="w-6 h-6" />
                {currentPhoto.comments && currentPhoto.comments.length > 0 && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 border-2 border-black/50"></span>
                )}
             </button>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none border-0" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} aria-label="Close">
                <CloseIcon className="w-6 h-6" />
             </button>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }} 
          className="absolute top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors z-10"
          style={{ right: showComments ? 'calc(320px + 1rem)' : '1rem' }}
          aria-label="Next image"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      </div>

      <div 
        className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${showComments ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
         {currentPhoto && <CommentsPanel photo={currentPhoto} onAddComment={onAddComment} />}
      </div>
    </div>
  );
};

export default Lightbox;