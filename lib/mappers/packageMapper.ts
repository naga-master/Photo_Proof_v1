/**
 * Service Package Mapper
 * Transforms backend service package responses to frontend ServicePackage type
 */

import type { ServicePackage } from '../../types';
import type { ServicePackage as BackendServicePackage } from '../../services/servicePackageService';

export const mapServicePackageResponse = (pkg: BackendServicePackage): ServicePackage => ({
    id: pkg.id,
    name: pkg.name,
    category: pkg.category,
    description: pkg.description,
    price: Number(pkg.price),
    isPredefined: (pkg as any).is_predefined ?? false,
    features: (pkg.features || []).map((feature) => ({
        name: feature.name,
        included: feature.included,
        details: feature.details ?? null,
    })),
    deliverables: pkg.deliverables ?? [],
});
