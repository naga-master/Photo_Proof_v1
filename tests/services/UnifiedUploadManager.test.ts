import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
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

vi.mock('../../services/uploadHistoryStore', () => ({
    uploadHistoryStore: {
        addEntry: vi.fn(),
    },
}));

vi.mock('../../services/notificationService', () => ({
    notificationService: {
        requestPermission: vi.fn().mockResolvedValue(true),
        notifyUploadComplete: vi.fn(),
    },
}));

vi.mock('uuid', () => ({
    v4: vi.fn(() => 'test-session-id'),
}));

import { unifiedUploadManager } from '../../services/UnifiedUploadManager';
import { uploadService } from '../../services/uploadService';
import { uploadHistoryStore } from '../../services/uploadHistoryStore';

describe('UnifiedUploadManager', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        unifiedUploadManager.clearAll();
        await unifiedUploadManager.init();
    });

    afterEach(() => {
        unifiedUploadManager.clearAll();
    });

    describe('init', () => {
        it('initializes without error', async () => {
            // Already initialized in beforeEach
            expect(true).toBe(true);
        });
    });

    describe('startUpload', () => {
        it('creates a new session with files', async () => {
            const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
            const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [
                    { upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' },
                    { upload_url: 'url2', photo_id: 2, token: 'token2', expires_at: '', method: 'PUT' },
                ],
                session_id: 'backend-session',
                total_files: 2,
            });

            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                original_filename: 'test.jpg', width: 100, height: 100,
                file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                comment_count: 0, status: 'active', uploaded_by: 'user',
                created_at: '', updated_at: '',
            });

            const sessionId = await unifiedUploadManager.startUpload({
                files: [file1, file2],
                projectId: '1',
                projectName: 'Test Project',
            });

            expect(sessionId).toBe('test-session-id');

            const session = unifiedUploadManager.getSession(sessionId);
            expect(session).not.toBeNull();
            expect(session?.totalFiles).toBe(2);
            expect(session?.projectName).toBe('Test Project');
        });

        it('throws error with empty files', async () => {
            await expect(unifiedUploadManager.startUpload({
                files: [],
                projectId: '1',
            })).rejects.toThrow('No files to upload');
        });
    });

    describe('getSession', () => {
        it('returns null for non-existent session', () => {
            const session = unifiedUploadManager.getSession('non-existent');
            expect(session).toBeNull();
        });
    });

    describe('getAllSessions', () => {
        it('returns empty array when no sessions', () => {
            const sessions = unifiedUploadManager.getAllSessions();
            expect(sessions).toEqual([]);
        });
    });

    describe('subscribe', () => {
        it('calls subscriber with current state', () => {
            const callback = vi.fn();
            const unsubscribe = unifiedUploadManager.subscribe(callback);

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                sessions: expect.any(Map),
                isActive: expect.any(Boolean),
            }));

            unsubscribe();
        });

        it('returns unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = unifiedUploadManager.subscribe(callback);

            expect(typeof unsubscribe).toBe('function');
            unsubscribe();
        });
    });

    describe('pauseSession / resumeSession', () => {
        it('pauses and resumes session', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'backend-session',
                total_files: 1,
            });

            // Slow upload to test pause
            vi.mocked(uploadService.uploadFile).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 5000))
            );

            const sessionId = await unifiedUploadManager.startUpload({
                files: [file],
                projectId: '1',
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            unifiedUploadManager.pauseSession(sessionId);
            let session = unifiedUploadManager.getSession(sessionId);
            expect(session?.status).toBe('paused');

            unifiedUploadManager.resumeSession(sessionId);
            session = unifiedUploadManager.getSession(sessionId);
            expect(session?.status).toBe('active');
        });
    });

    describe('cancelSession', () => {
        it('removes session', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'backend-session',
                total_files: 1,
            });

            vi.mocked(uploadService.uploadFile).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 5000))
            );

            const sessionId = await unifiedUploadManager.startUpload({
                files: [file],
                projectId: '1',
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            unifiedUploadManager.cancelSession(sessionId);

            const session = unifiedUploadManager.getSession(sessionId);
            expect(session).toBeNull();
        });
    });

    describe('clearCompleted', () => {
        it('removes completed sessions', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'backend-session',
                total_files: 1,
            });

            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                original_filename: 'test.jpg', width: 100, height: 100,
                file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                comment_count: 0, status: 'active', uploaded_by: 'user',
                created_at: '', updated_at: '',
            });

            await unifiedUploadManager.startUpload({
                files: [file],
                projectId: '1',
            });

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 500));

            unifiedUploadManager.clearCompleted();

            const sessions = unifiedUploadManager.getAllSessions();
            const completedCount = sessions.filter(s => s.status === 'completed').length;
            expect(completedCount).toBe(0);
        });
    });

    describe('setOnSessionComplete', () => {
        it('calls callback when session completes', async () => {
            const callback = vi.fn();
            unifiedUploadManager.setOnSessionComplete(callback);

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'backend-session',
                total_files: 1,
            });

            vi.mocked(uploadService.uploadFile).mockResolvedValue({
                id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                original_filename: 'test.jpg', width: 100, height: 100,
                file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                comment_count: 0, status: 'active', uploaded_by: 'user',
                created_at: '', updated_at: '',
            });

            await unifiedUploadManager.startUpload({
                files: [file],
                projectId: '1',
                projectName: 'Test Project',
            });

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 500));

            expect(callback).toHaveBeenCalledWith('1', 'Test Project', 'success');
        });
    });

    describe('retryFailed', () => {
        it('retries failed uploads', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(uploadService.getBatchPresignedUrls).mockResolvedValue({
                tokens: [{ upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' }],
                session_id: 'backend-session',
                total_files: 1,
            });

            // First upload fails, then succeeds
            vi.mocked(uploadService.uploadFile)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue({
                    id: '1', project_id: '1', src: '/photos/1.jpg', alt: 'test',
                    original_filename: 'test.jpg', width: 100, height: 100,
                    file_size: 1024, mime_type: 'image/jpeg', order_index: 0,
                    comment_count: 0, status: 'active', uploaded_by: 'user',
                    created_at: '', updated_at: '',
                });

            const sessionId = await unifiedUploadManager.startUpload({
                files: [file],
                projectId: '1',
            });

            // Wait for initial failure
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Retry
            await unifiedUploadManager.retryFailed(sessionId);

            // Wait for retry
            await new Promise(resolve => setTimeout(resolve, 500));

            const session = unifiedUploadManager.getSession(sessionId);
            // Session should be retrying or completed
            expect(session).not.toBeNull();
        });
    });
});
