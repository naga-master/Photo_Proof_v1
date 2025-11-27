

import React, { useState, useMemo, useEffect } from 'react';
import type { ServicePackage } from '../../../types';
import { PlusIcon, CheckIcon } from '../../icons';
import { servicePackageService } from '../../../services/servicePackageService';
import type { ServicePackage as ApiServicePackage } from '../../../services/servicePackageService';

interface PackageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pkg: ServicePackage) => void;
    existingPackage: ServicePackage | null;
}

const PackageEditorModal: React.FC<PackageEditorModalProps> = ({ isOpen, onClose, onSave, existingPackage }) => {
    const [pkg, setPkg] = useState<ServicePackage>({
        id: existingPackage?.id || `custom-${Date.now()}`,
        name: existingPackage?.name || '',
        category: existingPackage?.category || '',
        description: existingPackage?.description || '',
        price: existingPackage?.price || 0,
        features: existingPackage?.features || [],
        isPredefined: existingPackage?.isPredefined || false,
    });
    const [featuresText, setFeaturesText] = useState(pkg.features.map(f => f.name).join('\n'));

    // Update state when existingPackage changes or modal opens
    useEffect(() => {
        if (isOpen) {
            if (existingPackage) {
                setPkg({
                    id: existingPackage.id,
                    name: existingPackage.name,
                    category: existingPackage.category,
                    description: existingPackage.description,
                    price: existingPackage.price,
                    features: existingPackage.features,
                    isPredefined: existingPackage.isPredefined,
                });
                setFeaturesText(existingPackage.features.map(f => f.name).join('\n'));
            } else {
                // Reset to empty for new package
                setPkg({
                    id: `custom-${Date.now()}`,
                    name: '',
                    category: '',
                    description: '',
                    price: 0,
                    features: [],
                    isPredefined: false,
                });
                setFeaturesText('');
            }
        }
    }, [isOpen, existingPackage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPkg(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };
    
    const handleSave = () => {
        const features = featuresText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .map(name => ({ name, included: true, details: null }));

        onSave({ ...pkg, features });
        onClose();
    };

    if (!isOpen) return null;

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">{existingPackage ? 'Edit Package' : 'Create New Package'}</h2>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Package Name</label>
                            <input type="text" name="name" value={pkg.name} onChange={handleChange} className={inputClasses} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <input type="text" name="category" value={pkg.category} onChange={handleChange} className={inputClasses} placeholder="e.g., Wedding" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (INR)</label>
                        <input type="number" name="price" value={pkg.price} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={pkg.description} onChange={handleChange} rows={2} className={inputClasses}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Features (one per line)</label>
                        <textarea name="features" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={4} className={`${inputClasses} font-mono`}></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">Save Package</button>
                </div>
            </div>
        </div>
    );
};

interface ServicesPageProps {
    packages?: ServicePackage[]; // Optional now
    onUpdatePackages?: (packages: ServicePackage[]) => void; // Optional now
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
            features: (apiPkg.features || []).map(feature => ({
                name: feature.name,
                included: feature.included,
                details: feature.details ?? null,
            })),
            deliverables: apiPkg.deliverables || [],
        };
    };

    // Helper function to convert frontend package to API format
    const convertFrontendPackageToApi = (pkg: ServicePackage): any => {
        return {
            name: pkg.name,
            category: pkg.category,
            description: pkg.description,
            price: pkg.price,
            features: pkg.features.map(feature => ({
                name: feature.name,
                included: feature.included,
                details: feature.details,
            })),
            deliverables: pkg.deliverables || [],
        };
    };

    // Fetch packages from API
    useEffect(() => {
        const fetchPackages = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await servicePackageService.getServicePackages();
                const frontendPackages = response.packages.map(convertApiPackageToFrontend);
                setPackages(frontendPackages);
                // Also update parent if callback provided
                if (onUpdatePackages) {
                    onUpdatePackages(frontendPackages);
                }
            } catch (err) {
                console.error('Failed to fetch service packages:', err);
                setError('Failed to load service packages. Using offline data.');
                // Fall back to prop packages if available
                if (propPackages) {
                    setPackages(propPackages);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

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

    const handleSavePackage = async (pkg: ServicePackage) => {
        try {
            const apiData = convertFrontendPackageToApi(pkg);
            
            // Check if it's an update or create
            const isUpdate = packages.some(p => p.id === pkg.id);
            
            if (isUpdate) {
                // Update existing package
                const updatedPkg = await servicePackageService.updateServicePackage(pkg.id, apiData);
                const frontendPkg = convertApiPackageToFrontend(updatedPkg);
                
                const newPackages = packages.map(p => p.id === pkg.id ? frontendPkg : p);
                setPackages(newPackages);
                if (onUpdatePackages) {
                    onUpdatePackages(newPackages);
                }
            } else {
                // Create new package
                const createdPkg = await servicePackageService.createServicePackage(apiData);
                const frontendPkg = convertApiPackageToFrontend(createdPkg);
                
                const newPackages = [...packages, frontendPkg];
                setPackages(newPackages);
                if (onUpdatePackages) {
                    onUpdatePackages(newPackages);
                }
            }
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
    }
    
    return (
        <div className="p-8 animate-fade-in">
             <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
                    <p className="mt-1 text-gray-600">Manage your service offerings and pricing.</p>
                </div>
                <button onClick={handleCreateNew} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
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
                    <button onClick={handleCreateNew} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
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
                                    <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1 h-10">{pkg.description}</p>
                                            <p className="text-4xl font-extrabold text-gray-900 my-4">{formatCurrency(pkg.price)}</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 flex-1">
                                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-3">What's included</p>
                                            <ul className="space-y-2">
                                                {pkg.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <CheckIcon className="w-4 h-4 text-green-500 mt-1 mr-3 flex-shrink-0"/>
                                                        <span className="text-sm text-gray-700">{feature.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-white border-t">
                                            <button onClick={() => handleEdit(pkg)} className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
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

            <PackageEditorModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSavePackage}
                existingPackage={editingPackage}
            />
        </div>
    );
};

export default ServicesPage;