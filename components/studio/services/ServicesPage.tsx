

import React, { useState, useMemo } from 'react';
import type { ServicePackage } from '../../../types';
import { PlusIcon, CheckIcon } from '../../icons';

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
    const [featuresText, setFeaturesText] = useState(pkg.features.join('\n'));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPkg(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };
    
    const handleSave = () => {
        onSave({ ...pkg, features: featuresText.split('\n').filter(f => f.trim() !== '') });
        onClose();
    };

    if (!isOpen) return null;

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";

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
    packages: ServicePackage[];
    onUpdatePackages: (packages: ServicePackage[]) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ packages, onUpdatePackages }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

    const groupedPackages = useMemo(() => {
        // Fix: By typing the initial value of `reduce`, TypeScript correctly infers the
        // accumulator's type. This prevents `pkgs` from being `unknown` when iterating.
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

    const handleSavePackage = (pkg: ServicePackage) => {
        const existingIndex = packages.findIndex(p => p.id === pkg.id);
        let newPackages;
        if (existingIndex > -1) {
            newPackages = [...packages];
            newPackages[existingIndex] = pkg;
        } else {
            newPackages = [...packages, pkg];
        }
        onUpdatePackages(newPackages);
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

            <div className="space-y-12">
                {Object.entries(groupedPackages).map(([category, pkgs]) => (
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
                                                    <span className="text-sm text-gray-700">{feature}</span>
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
