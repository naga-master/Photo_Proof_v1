import React, { useState, useMemo, useEffect } from 'react';
import type { ServicePackage } from '../../../types';
import { PlusIcon, CheckIcon, PhotoIcon, BookOpenIcon, ClockIcon, ArchiveBoxIcon, TrashIcon } from '../../icons';
import { servicePackageService } from '../../../services/servicePackageService';
import type { ServicePackage as ApiServicePackage } from '../../../services/servicePackageService';
import { packageTypeService } from '../../../services/packageTypeService';
import DynamicPackageForm from './DynamicPackageForm';

interface ServicesPageProps {
    packages?: ServicePackage[];
    onUpdatePackages?: (packages: ServicePackage[]) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ packages: propPackages, onUpdatePackages }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
    const [deletingPackage, setDeletingPackage] = useState<ServicePackage | null>(null);
    const [packages, setPackages] = useState<ServicePackage[]>(propPackages || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to convert API package to frontend format
    const convertApiPackageToFrontend = (apiPkg: ApiServicePackage): ServicePackage => {
        return {
            id: apiPkg.id,
            name: apiPkg.name,
            category: apiPkg.category,
            description: apiPkg.description || '',
            price: Number(apiPkg.price),
            isPredefined: (apiPkg as any).is_predefined ?? false,
            packageTypeId: apiPkg.package_type_id || null,
            features: (apiPkg.features || []).map(feature => ({
                name: feature.name,
                included: feature.included,
                details: feature.details ?? null,
            })),
            deliverables: apiPkg.deliverables || [],
            restrictions: apiPkg.restrictions || null,
            lifecycleConfig: apiPkg.lifecycle_config || null,
        };
    };

    // Extract form values from package for editing
    const extractFormValues = (pkg: ServicePackage): Record<string, any> => {
        const values: Record<string, any> = {
            name: pkg.name,
            category: pkg.category,
            description: pkg.description,
            price: pkg.price,
            features: pkg.features.map(f => f.name).join('\n'),
        };

        // Merge restrictions into form values
        if (pkg.restrictions) {
            Object.assign(values, pkg.restrictions);
        }

        // Merge lifecycle config into form values
        if (pkg.lifecycleConfig) {
            Object.assign(values, pkg.lifecycleConfig);
        }

        return values;
    };

    // Fetch packages from API
    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await servicePackageService.getServicePackages();
            const frontendPackages = response.packages.map(convertApiPackageToFrontend);
            setPackages(frontendPackages);
            if (onUpdatePackages) {
                onUpdatePackages(frontendPackages);
            }
        } catch (err) {
            console.error('Failed to fetch service packages:', err);
            setError('Failed to load service packages. Using offline data.');
            if (propPackages) {
                setPackages(propPackages);
            }
        } finally {
            setLoading(false);
        }
    };

    const groupedPackages = useMemo(() => {
        return packages.reduce((acc, pkg) => {
            (acc[pkg.category] = acc[pkg.category] || []).push(pkg);
            return acc;
        }, {} as Record<string, ServicePackage[]>);
    }, [packages]);

    const handleCreateNew = () => {
        setEditingPackage(null);
        setModalOpen(true);
    };

    const handleEdit = (pkg: ServicePackage) => {
        setEditingPackage(pkg);
        setModalOpen(true);
    };

    const handleDelete = (pkg: ServicePackage) => {
        setDeletingPackage(pkg);
    };

    const confirmDelete = async () => {
        if (!deletingPackage) return;
        try {
            await servicePackageService.deleteServicePackage(deletingPackage.id);
            const newPackages = packages.filter(p => p.id !== deletingPackage.id);
            setPackages(newPackages);
            if (onUpdatePackages) {
                onUpdatePackages(newPackages);
            }
            setDeletingPackage(null);
        } catch (err) {
            console.error('Failed to delete package:', err);
            alert('Failed to delete package. Please try again.');
        }
    };

    const handleFormSubmit = async (values: Record<string, any>) => {
        try {
            const { package_type_id, name, description, price, features, ...otherValues } = values;

            // Parse features from textarea
            const featuresList = features
                ? features
                      .split('\n')
                      .map((line: string) => line.trim())
                      .filter((line: string) => line !== '')
                      .map((name: string) => ({ name, included: true, details: null }))
                : [];

            // Separate restrictions and lifecycle_config
            const restrictions: Record<string, any> = {};
            const lifecycle_config: Record<string, any> = {};

            const lifecycleFields = [
                'editing_period_months',
                'retention_years',
                'retention_months',
                'archival_enabled',
                'archival_years',
                'archival_months',
            ];

            Object.entries(otherValues).forEach(([key, value]) => {
                if (lifecycleFields.includes(key)) {
                    lifecycle_config[key] = value;
                } else if (value !== null && value !== undefined && value !== '') {
                    restrictions[key] = value;
                }
            });

            // Derive category from package type
            let categoryName = 'Custom';
            if (package_type_id && package_type_id !== 'custom-package') {
                try {
                    const packageType = await packageTypeService.getPackageType(package_type_id);
                    categoryName = packageType.display_name || 'Custom';
                } catch {
                    // Fallback to formatting the ID
                    categoryName = package_type_id
                        .split('-')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
            }

            const packageData = {
                name,
                category: categoryName,
                description: description || '',
                price: Number(price),
                package_type_id,
                features: featuresList,
                deliverables: [],
                restrictions: Object.keys(restrictions).length > 0 ? restrictions : null,
                lifecycle_config: Object.keys(lifecycle_config).length > 0 ? lifecycle_config : null,
            };

            if (editingPackage) {
                // Update existing package
                const updatedPkg = await servicePackageService.updateServicePackage(
                    editingPackage.id,
                    packageData
                );
                const frontendPkg = convertApiPackageToFrontend(updatedPkg);

                const newPackages = packages.map(p => (p.id === editingPackage.id ? frontendPkg : p));
                setPackages(newPackages);
                if (onUpdatePackages) {
                    onUpdatePackages(newPackages);
                }
            } else {
                // Create new package
                const createdPkg = await servicePackageService.createServicePackage(packageData);
                const frontendPkg = convertApiPackageToFrontend(createdPkg);

                const newPackages = [...packages, frontendPkg];
                setPackages(newPackages);
                if (onUpdatePackages) {
                    onUpdatePackages(newPackages);
                }
            }

            setModalOpen(false);
            setEditingPackage(null);
        } catch (err) {
            console.error('Failed to save service package:', err);
            alert('Failed to save service package. Please try again.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Generate display features from restrictions and lifecycle config
    const generateDisplayFeatures = (
        restrictions: Record<string, any> | null,
        lifecycleConfig: Record<string, any> | null
    ): { name: string }[] => {
        const features: { name: string }[] = [];
        if (!restrictions) return features;

        // Map field names to readable labels
        const fieldLabels: Record<string, (v: any) => string | null> = {
            // Product photography
            product_count: (v) => `${v} Products`,
            images_per_product: (v) => `${v} Images/Product`,
            turnaround_days: (v) => `${v} Day Turnaround`,
            revision_rounds: (v) => `${v} Revisions`,
            // Maternity/Newborn
            maternity_sessions: (v) => `${v} Maternity Sessions`,
            newborn_sessions: (v) => `${v} Newborn Sessions`,
            // Event
            coverage_hours: (v) => `${v} Hours Coverage`,
            photographer_count: (v) => `${v} Photographers`,
            // Corporate
            headshot_count: (v) => `${v} Headshots`,
            session_hours: (v) => `${v} Hour Session`,
            // Portrait
            outfit_changes: (v) => `${v} Outfit Changes`,
            backdrop_options: (v) => `${v} Backdrop Options`,
            // Wedding
            candid_photo_count: (v) => `${v} Candid Photos`,
            candid_video_count: (v) => `${v} Candid Videos`,
            traditional_photo_count: (v) => `${v} Traditional Photos`,
            traditional_video_count: (v) => `${v} Traditional Videos`,
            frame_count: (v) => `${v} Framed Photos`,
            album_pages: (v) => `${v} Album Pages`,
            // Common prints
            print_count: (v) => `${v} Prints`,
            // Boolean features
            video_support_enabled: (v) => v ? 'Video Support' : null,
            reception_coverage: (v) => v ? 'Reception Coverage' : null,
            wedding_coverage: (v) => v ? 'Wedding Ceremony' : null,
            prewedding_coverage: (v) => v ? 'Pre-Wedding Shoot' : null,
            outdoor_coverage: (v) => v ? 'Outdoor Shoot' : null,
            whatsapp_integration: (v) => v ? 'WhatsApp Notifications' : null,
            three_sixty_view: (v) => v ? '360° View' : null,
            drone_coverage: (v) => v ? 'Drone Coverage' : null,
            same_day_preview: (v) => v ? 'Same-Day Preview' : null,
            live_streaming: (v) => v ? 'Live Streaming' : null,
            photo_booth: (v) => v ? 'Photo Booth' : null,
            video_highlights: (v) => v ? 'Video Highlights' : null,
            high_res_access: (v) => v ? 'High Resolution Files' : null,
            team_photo: (v) => v ? 'Team Photo' : null,
            onsite_enabled: (v) => v ? 'On-site Service' : null,
            studio_enabled: (v) => v ? 'Studio Session' : null,
            wardrobe_access: (v) => v ? 'Wardrobe Access' : null,
            props_included: (v) => v ? 'Props Included' : null,
            family_photos: (v) => v ? 'Family Photos' : null,
            milestone_sessions: (v) => v ? 'Milestone Sessions' : null,
            pendrive_enabled: (v) => v ? 'Pendrive Included' : null,
            dvd_enabled: (v) => v ? 'DVD Included' : null,
            model_mannequin: (v) => v ? 'Model/Mannequin' : null,
            outdoor_session: (v) => v ? 'Outdoor Session' : null,
            home_session: (v) => v ? 'Home Session' : null,
            digital_files_all: (v) => v ? 'All Digital Files' : null,
            // Select fields with values
            retouching_level: (v) => v ? `${v.charAt(0).toUpperCase() + v.slice(1)} Retouching` : null,
            usage_rights: (v) => v ? `${v.charAt(0).toUpperCase() + v.slice(1)} Usage Rights` : null,
            customer_support: (v) => v ? `${v === '24x7' ? '24/7' : v.replace('_', ' ')} Support` : null,
        };

        Object.entries(restrictions).forEach(([key, value]) => {
            // Skip null, undefined, empty string, false, and 0 values
            if (value === null || value === undefined || value === '' || value === false || value === 0) {
                return;
            }
            if (fieldLabels[key]) {
                const label = fieldLabels[key](value);
                if (label) {
                    features.push({ name: label });
                }
            }
        });

        return features;
    };

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
                    <p className="mt-1 text-gray-600">Manage your service offerings and pricing.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>New Package</span>
                </button>
            </header>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading service packages...</div>
                </div>
            )}

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800">{error}</p>
                </div>
            )}

            {!loading && packages.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No service packages yet.</p>
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Create Your First Package</span>
                    </button>
                </div>
            )}

            {!loading && packages.length > 0 && (
                <div className="space-y-12">
                    {Object.entries(groupedPackages).map(([category, pkgs]: [string, ServicePackage[]]) => (
                        <div key={category}>
                            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">{category}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {pkgs.map(pkg => (
                                    <div
                                        key={pkg.id}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        {/* Top Section: Package Info + Features */}
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                                {pkg.description}
                                            </p>
                                            
                                            <p className="text-sm font-semibold text-gray-600 mb-3">What's included</p>
                                            {(() => {
                                                const allFeatures = [
                                                    ...pkg.features,
                                                    ...generateDisplayFeatures(pkg.restrictions, pkg.lifecycleConfig)
                                                ];
                                                return (
                                                    <ul className="space-y-2">
                                                        {allFeatures.map((feature, i) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                                <CheckIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                                                <span>{feature.name}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                );
                                            })()}
                                        </div>
                                        
                                        {/* Nested Card: Pricing + Limits */}
                                        <div className="mx-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-3xl font-extrabold text-gray-900">
                                                    {formatCurrency(pkg.price)}
                                                </p>
                                                <span className="w-4 h-4 rounded-full border-4 border-indigo-500"></span>
                                            </div>
                                            
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {pkg.restrictions?.photo_selection_limit && (
                                                    <div className="flex items-center gap-2">
                                                        <PhotoIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{pkg.restrictions.photo_selection_limit} Photos</span>
                                                    </div>
                                                )}
                                                {pkg.restrictions?.album_enabled && (
                                                    <div className="flex items-center gap-2">
                                                        <BookOpenIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{pkg.restrictions.album_quality || 'Standard'} Album</span>
                                                    </div>
                                                )}
                                                {pkg.lifecycleConfig?.editing_period_months && (
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{pkg.lifecycleConfig.editing_period_months} months editing</span>
                                                    </div>
                                                )}
                                                {pkg.lifecycleConfig?.retention_years && (
                                                    <div className="flex items-center gap-2">
                                                        <ArchiveBoxIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{pkg.lifecycleConfig.retention_years} year retention</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => handleEdit(pkg)}
                                                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
                                                >
                                                    Edit Package
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pkg)}
                                                    className="px-4 py-3 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Package"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic Package Form Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b flex-shrink-0">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                {editingPackage ? 'Edit Package' : 'Create New Package'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {editingPackage
                                    ? 'Update package details and restrictions'
                                    : 'Select a package type and configure your offering'}
                            </p>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <DynamicPackageForm
                                key={editingPackage?.id || 'new-package'}
                                packageTypeId={editingPackage?.packageTypeId}
                                initialValues={editingPackage ? extractFormValues(editingPackage) : {}}
                                onSubmit={handleFormSubmit}
                                onCancel={() => {
                                    setModalOpen(false);
                                    setEditingPackage(null);
                                }}
                                submitLabel={editingPackage ? 'Update Package' : 'Create Package'}
                                isEditMode={!!editingPackage}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingPackage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    onClick={() => setDeletingPackage(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900">Delete Package?</h3>
                        <p className="mt-2 text-gray-600">
                            Are you sure you want to delete "{deletingPackage.name}"? This action cannot be undone.
                        </p>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setDeletingPackage(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
