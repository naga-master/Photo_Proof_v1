import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock apiClient before importing uploadService
vi.mock('../../lib/api-client', () => ({
    apiClient: {
        post: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

import { uploadService } from '../../services/uploadService';
import { apiClient } from '../../lib/api-client';

describe('uploadService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(() => 'test-token'),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getPresignedUrl', () => {
        it('calls API with correct parameters', async () => {
            const mockResponse = {
                upload_url: 'http://example.com/upload',
                photo_id: 123,
                token: 'test-token-123',
                expires_at: '2024-01-01T00:00:00Z',
                method: 'PUT',
            };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await uploadService.getPresignedUrl({
                project_id: '1',
                filename: 'test.jpg',
                content_type: 'image/jpeg',
                file_size: 1024,
                folder_id: 'folder-1',
            });

            expect(apiClient.post).toHaveBeenCalledWith('/v2/upload/presigned', {
                project_id: '1',
                filename: 'test.jpg',
                content_type: 'image/jpeg',
                file_size: 1024,
                folder_id: 'folder-1',
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getBatchPresignedUrls', () => {
        it('calls API with batch request', async () => {
            const mockResponse = {
                tokens: [
                    { upload_url: 'url1', photo_id: 1, token: 'token1', expires_at: '', method: 'PUT' },
                    { upload_url: 'url2', photo_id: 2, token: 'token2', expires_at: '', method: 'PUT' },
                ],
                session_id: 'session-123',
                total_files: 2,
            };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            const result = await uploadService.getBatchPresignedUrls({
                project_id: 1,
                folder_id: 'folder-1',
                files: [
                    { filename: 'test1.jpg', content_type: 'image/jpeg', file_size: 1024 },
                    { filename: 'test2.jpg', content_type: 'image/jpeg', file_size: 2048 },
                ],
            });

            expect(apiClient.post).toHaveBeenCalledWith('/v2/upload/batch/presigned', expect.objectContaining({
                project_id: 1,
                files: expect.arrayContaining([
                    expect.objectContaining({ filename: 'test1.jpg' }),
                    expect.objectContaining({ filename: 'test2.jpg' }),
                ]),
            }));
            expect(result.tokens).toHaveLength(2);
            expect(result.session_id).toBe('session-123');
        });
    });

    describe('createUploadSession', () => {
        it('creates session with project and file count', async () => {
            const mockResponse = { session_id: 'session-456', project_id: '1' };
            vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

            await uploadService.createUploadSession('1', 10);

            expect(apiClient.post).toHaveBeenCalledWith('/v2/upload/session', {
                project_id: '1',
                total_files: 10,
            });
        });
    });

    describe('verifyBatchUpload', () => {
        it('verifies batch upload status', async () => {
            const mockResponse = {
                session_id: 'session-123',
                total_files: 10,
                completed: 8,
                failed: 1,
                pending: 1,
                status: 'in_progress',
            };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await uploadService.verifyBatchUpload('session-123');

            expect(apiClient.get).toHaveBeenCalledWith('/v2/upload/batch/verify/session-123');
            expect(result.completed).toBe(8);
            expect(result.failed).toBe(1);
        });
    });

    describe('uploadFile', () => {
        it('uploads file using XHR with progress tracking', async () => {
            // Create mock XHR
            const mockXHR = {
                open: vi.fn(),
                send: vi.fn(),
                setRequestHeader: vi.fn(),
                upload: {
                    addEventListener: vi.fn(),
                },
                addEventListener: vi.fn(),
                status: 200,
                responseText: JSON.stringify({ id: 123, src: '/photo/123.jpg' }),
            };

            vi.stubGlobal('XMLHttpRequest', vi.fn(() => mockXHR));

            const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            const onProgress = vi.fn();

            // Start upload (will be pending)
            const uploadPromise = uploadService.uploadFile(file, 'test-token', onProgress);

            // Simulate XHR load event
            const loadHandler = mockXHR.addEventListener.mock.calls.find(
                call => call[0] === 'load'
            )?.[1];
            
            if (loadHandler) {
                loadHandler();
            }

            const result = await uploadPromise;

            expect(mockXHR.open).toHaveBeenCalledWith('PUT', 'http://localhost:8000/v2/upload/test-token');
            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
            expect(result.id).toBe(123);
        });
    });
});
