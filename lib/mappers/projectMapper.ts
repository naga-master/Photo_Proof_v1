/**
 * Project/Album Mapper
 * Transforms backend project responses to frontend Album type
 */

import type { Album, LayoutId } from '../../types';
import { getCoverPhotoVariantUrl, type Project as BackendProject } from '../../services/projectService';

export const normalizePaymentStatus = (status?: string | null): Album['paymentStatus'] => {
    if (!status) return undefined;
    switch (status.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'unpaid':
            return 'Unpaid';
        case 'due':
        case 'overdue':
            return 'Due';
        default:
            return undefined;
    }
};

export const mapProjectToAlbum = (project: BackendProject): Album => {
    return {
        id: String(project.id),
        title: project.title ?? 'Untitled Project',
        clientId: project.client_id ? String(project.client_id) : '',
        shootDate: project.shoot_date ?? project.created_at,
        coverPhotoId: project.cover_photo_id ? String(project.cover_photo_id) : null,
        coverPhotoSrc: getCoverPhotoVariantUrl(project, 'medium'),
        photoCount: project.photo_count ?? 0,
        totalComments: project.total_comments ?? 0,
        isLocked: project.is_locked ?? false,
        layout: project.layout as LayoutId | undefined,
        paymentStatus: normalizePaymentStatus(project.payment_status),
        price: project.price ? Number(project.price) : undefined,
        packageId: project.package_id ?? undefined,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        photos: [],
        folders: project.has_folders ? [] : undefined,
    };
};
