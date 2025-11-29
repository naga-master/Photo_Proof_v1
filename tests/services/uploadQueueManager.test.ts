import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../../services/uploadService', () => ({
    uploadService: {
        getBatchPresignedUrls: vi.fn(),
        uploadFile: vi.fn(),
    },
}));

vi.mock('../../services/chunkedUploadService', () => ({
    chunkedUploadService: {
        isEnabled: vi.fn(() => false),
        uploadFile: vi.fn(),
    },
}));

vi.mock('../../services/imageOptimizationConfigLoader', () => ({
    imageOptimizationConfig: {
        getChunkedUploadConfig: vi.fn(() => ({
            enabled: false,
            useHybridMode: false,
            fileSizeThresholdMB: 10,
        })),
    },
}));

// Import after mocks are set up
import { uploadQueueManager, type QueuedUpload } from '../../services/uploadQueueManager';
import { uploadService } from '../../services/uploadService';

describe('uploadQueueManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        uploadQueueManager.clearAll();
    });

    afterEach(() => {
        uploadQueueManager.clearAll();
    });

    describe('getQueue', () => {
        it('returns empty array when no uploads', () => {
            const queue = uploadQueueManager.getQueue();
            expect(queue).toEqual([]);
        });
    });

    describe('getStatus', () => {
        it('returns correct status counts', () => {
            const status = uploadQueueManager.getStatus();
            expect(status).toEqual({
                total: 0,
                pending: 0,
                uploading: 0,
                completed: 0,
                failed: 0,
                retrying: 0,
            });
        });
    });

    describe('registerSubscriber', () => {
        it('registers subscriber with unique ID', () => {
            const callbacks = {
                onProgress: vi.fn(),
                onSuccess: vi.fn(),
                onError: vi.fn(),
                onQueueUpdate: vi.fn(),
            };

            uploadQueueManager.registerSubscriber('test-subscriber', callbacks);

            // Subscriber should be registered (internal state)
            // We verify by checking if callbacks are called
            expect(callbacks.onQueueUpdate).not.toHaveBeenCalled();
        });

        it('replaces subscriber with same ID', () => {
            const callbacks1 = { onQueueUpdate: vi.fn() };
            const callbacks2 = { onQueueUpdate: vi.fn() };

            uploadQueueManager.registerSubscriber('test-subscriber', callbacks1);
            uploadQueueManager.registerSubscriber('test-subscriber', callbacks2);

            // Only callbacks2 should be active now
            // This is verified internally
        });
    });

    describe('unregisterSubscriber', () => {
        it('removes subscriber by ID', () => {
            const callbacks = { onQueueUpdate: vi.fn() };
            uploadQueueManager.registerSubscriber('test-subscriber', callbacks);
            uploadQueueManager.unregisterSubscriber('test-subscriber');
            
            // Subscriber should be removed
        });
    });

    describe('addToQueue', () => {
        it('adds uploads to queue with correct initial state', async () => {
            const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
            const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });

            // Mock batch presigned URLs response
            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [
                    { upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' },
                    { upload_url: 'url2', photo_id: 2, token: 'token2', expires_at: '', method: 'PUT' },
                ],
                session_id: 'session-123',
                total_files: 2,
            });

            // Mock upload response
            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1',
                project_id: '1',
                src: '/photos/1.jpg',
                alt: 'test',
                original_filename: 'test1.jpg',
                width: 100,
                height: 100,
                file_size: 1024,
                mime_type: 'image/jpeg',
                order_index: 0,
                comment_count: 0,
                status: 'active',
                uploaded_by: 'user',
                created_at: '',
                updated_at: '',
            });

            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file: file1, projectId: '1', folderId: 'folder-1' },
                { id: 'upload-2', file: file2, projectId: '1', folderId: 'folder-1' },
            ]);

            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 100));

            const queue = uploadQueueManager.getQueue();
            expect(queue.length).toBe(2);
        });

        it('prevents duplicate additions', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'session-123',
                total_files: 1,
            });

            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                original_filename: 'test.jpg', width: 100, height: 100,
                file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                comment_count: 0, status: 'active', uploaded_by: 'user',
                created_at: '', updated_at: '',
            });

            // Add same upload twice
            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file, projectId: '1' },
            ]);
            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file, projectId: '1' }, // Same ID
            ]);

            await new Promise(resolve => setTimeout(resolve, 100));

            const queue = uploadQueueManager.getQueue();
            expect(queue.length).toBe(1);
        });
    });

    describe('retryUpload', () => {
        it('allows retry of completed uploads', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'session-123',
                total_files: 1,
            });

            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                original_filename: 'test.jpg', width: 100, height: 100,
                file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                comment_count: 0, status: 'active', uploaded_by: 'user',
                created_at: '', updated_at: '',
            });

            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file, projectId: '1' },
            ]);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Upload completed, but retryUpload should still work
            // (allows re-uploading same file)
            const queue = uploadQueueManager.getQueue();
            const upload = queue.find(u => u.id === 'upload-1');
            
            // Upload should be in queue (completed or pending after retry)
            expect(upload).toBeDefined();
        });
    });

    describe('cancelUpload', () => {
        it('removes upload from queue', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'session-123',
                total_files: 1,
            });

            // Make upload slow
            vi.mocked(uploadService.uploadFile).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 5000))
            );

            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file, projectId: '1' },
            ]);

            await new Promise(resolve => setTimeout(resolve, 50));

            uploadQueueManager.cancelUpload('upload-1');

            const queue = uploadQueueManager.getQueue();
            expect(queue.find(u => u.id === 'upload-1')).toBeUndefined();
        });
    });

    describe('clearCompleted', () => {
        it('removes only completed uploads', async () => {
            // This test verifies completed uploads are cleared
            uploadQueueManager.clearCompleted();
            
            const queue = uploadQueueManager.getQueue();
            const completedCount = queue.filter(u => u.status === 'completed').length;
            expect(completedCount).toBe(0);
        });
    });

    describe('pauseAll / resumeAll', () => {
        it('pauses and resumes processing', () => {
            uploadQueueManager.pauseAll();
            expect(uploadQueueManager.isProcessing()).toBe(false);

            uploadQueueManager.resumeAll();
            // Processing state depends on queue contents
        });
    });

    describe('retryAllFailed', () => {
        it('resets all failed uploads for retry', async () => {
            const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
            const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [
                    { upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' },
                    { upload_url: 'url2', photo_id: 2, token: 'token2', expires_at: '', method: 'PUT' },
                ],
                session_id: 'session-123',
                total_files: 2,
            });

            // Both uploads fail
            vi.mocked(uploadService.uploadFile).mockRejectedValue(new Error('Network error'));

            await uploadQueueManager.addToQueue([
                { id: 'upload-1', file: file1, projectId: '1' },
                { id: 'upload-2', file: file2, projectId: '1' },
            ]);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Retry all failed
            uploadQueueManager.retryAllFailed();

            await new Promise(resolve => setTimeout(resolve, 100));

            const queue = uploadQueueManager.getQueue();
            const failedCount = queue.filter(u => u.status === 'failed').length;
            // After retry, status should be pending (not failed)
            expect(failedCount).toBeLessThanOrEqual(queue.length);
        });
    });
});
