import React, { useState, useMemo, useEffect } from 'react';
import type { ServicePackage } from '../../../types';
import { PlusIcon, CheckIcon } from '../../icons';
import { servicePackageService } from '../../../services/servicePackageService';
import type { ServicePackage as ApiServicePackage } from '../../../services/servicePackageService';
import DynamicPackageForm from './DynamicPackageForm';
import RestrictionBadges from './RestrictionBadges';

interface ServicesPageProps {
    packages?: ServicePackage[];
    onUpdatePackages?: (packages: ServicePackage[]) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ packages: propPackages, onUpdatePackages }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
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

    const handleFormSubmit = async (values: Record<string, any>) => {
        try {
            const { package_type_id, name, category, description, price, features, ...otherValues } = values;

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

            const packageData = {
                name,
                category: category || 'Custom',
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

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
                    <p className="mt-1 text-gray-600">Manage your service offerings and pricing.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
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
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden">
                                                {pkg.description}
                                            </p>
                                            <p className="text-4xl font-extrabold text-gray-900 my-4">
                                                {formatCurrency(pkg.price)}
                                            </p>
                                            <RestrictionBadges
                                                restrictions={pkg.restrictions}
                                                lifecycleConfig={pkg.lifecycleConfig}
                                            />
                                        </div>
                                        <div className="p-6 bg-gray-50 flex-1">
                                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-3">
                                                What's included
                                            </p>
                                            <ul className="space-y-2">
                                                {pkg.features.slice(0, 5).map((feature, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <CheckIcon className="w-4 h-4 text-green-500 mt-1 mr-3 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700">{feature.name}</span>
                                                    </li>
                                                ))}
                                                {pkg.features.length > 5 && (
                                                    <li className="text-sm text-gray-500 italic">
                                                        +{pkg.features.length - 5} more features
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-white border-t">
                                            <button
                                                onClick={() => handleEdit(pkg)}
                                                className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                            >
                                                Edit Package
                                            </button>
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
        </div>
    );
};

export default ServicesPage;
