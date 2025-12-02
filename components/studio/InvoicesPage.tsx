import React, { useState, useEffect, useMemo } from 'react';
import type { Invoice, InvoiceItem, Client, Album, InvoiceTemplateId, InvoiceInitialData, BillingConfiguration, ServicePackage } from '../../types';
import { PlusIcon, XCircleIcon, StarIcon } from '../icons';
import InvoiceRenderer from './invoices/InvoiceRenderer';

// Helper function for GST-inclusive calculation (reverse calculation)
const calculateGSTBreakdown = (totalPrice: number, gstPercentage: number) => {
    if (gstPercentage <= 0) {
        return { baseAmount: totalPrice, gstAmount: 0, totalPrice };
    }
    const baseAmount = totalPrice / (1 + gstPercentage / 100);
    const gstAmount = totalPrice - baseAmount;
    return { baseAmount, gstAmount, totalPrice };
};

// TODO: Fetch invoice templates from /api/invoices/templates
const invoiceTemplates = [
    { 
        id: 'modern', 
        name: 'Modern', 
        description: 'Clean and contemporary design',
        imageUrl: '/invoice-modern.png',
        isPremium: false
    },
    { 
        id: 'classic', 
        name: 'Classic', 
        description: 'Traditional business invoice',
        imageUrl: '/invoice-classic.png',
        isPremium: false
    },
    { 
        id: 'minimal', 
        name: 'Minimal', 
        description: 'Simple and elegant',
        imageUrl: '/invoice-minimal.png',
        isPremium: false
    }
];

interface InvoicesPageProps {
    clients: Client[];
    albums: Album[];
    packages: ServicePackage[];
    invoices: Invoice[];
    onSaveInvoice: (invoice: Invoice) => void;
    initialData: InvoiceInitialData | null;
    clearInitialData: () => void;
    defaultTemplateId: InvoiceTemplateId;
    onSetDefaultTemplate: (templateId: InvoiceTemplateId) => void;
    logo: string | null;
    brandColor: string;
    studioDisplayImage?: string | null;
    onInvoiceSaved?: () => void;
}

const getNextInvoiceNumber = (invoices: Invoice[]) => {
    const lastNum = invoices.reduce((max, inv) => {
        const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `INV-${String(lastNum + 1).padStart(4, '0')}`;
};

const InvoiceEditor: React.FC<InvoicesPageProps> = (props) => {
    const { clients, albums, packages, invoices, onSaveInvoice, initialData, clearInitialData, defaultTemplateId, onSetDefaultTemplate, logo, brandColor, studioDisplayImage, onInvoiceSaved } = props;

    const displayLogo = studioDisplayImage || logo;

    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [billingConfig, setBillingConfig] = useState<BillingConfiguration | null>(null);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    
    // Load billing config from localStorage or initialData
    useEffect(() => {
        if (initialData?.billingConfig) {
            setBillingConfig(initialData.billingConfig);
        } else {
            const savedConfig = localStorage.getItem('billingConfig');
            if (savedConfig) {
                try {
                    setBillingConfig(JSON.parse(savedConfig));
                } catch (e) {
                    console.error('Failed to parse billing config:', e);
                }
            }
        }
    }, [initialData?.billingConfig]);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const futureDate = dueDate.toISOString().split('T')[0];

    // Get GST rate from billing config (default to 18% for photography services in India)
    const gstEnabled = billingConfig?.tax?.enableGST !== false;
    const gstPercentage = billingConfig?.tax?.gstPercentage ?? 18;
    const gstRate = gstEnabled ? gstPercentage / 100 : 0;
    const taxLabel = gstEnabled ? `GST (${gstPercentage}%)` : 'Tax';
    const currencySymbol = billingConfig?.currencySymbol || '₹'; // Default to Rupee for India

    const createNewInvoice = (): Invoice => ({
        id: `inv_${Date.now()}`,
        invoiceNumber: getNextInvoiceNumber(invoices),
        invoiceDate: today,
        dueDate: futureDate,
        items: [{ id: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }],
        status: 'Draft' as const,
        template: defaultTemplateId,
        clientName: '',
        clientAddress: '',
        subtotal: 0,
        tax: 0,
        taxRate: gstPercentage,
        taxLabel: taxLabel,
        currencySymbol: currencySymbol,
        total: 0,
    });
    
    // Recalculate totals when items or GST rate changes
    useEffect(() => {
        if (!currentInvoice) return;
        const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * gstRate;
        const total = subtotal + tax;
        const newTaxLabel = gstEnabled ? `GST (${gstPercentage}%)` : 'Tax';
        
        if (currentInvoice.subtotal !== subtotal || currentInvoice.tax !== tax || currentInvoice.total !== total || currentInvoice.taxLabel !== newTaxLabel) {
            setCurrentInvoice(inv => inv ? { ...inv, subtotal, tax, taxRate: gstPercentage, taxLabel: newTaxLabel, total } : null);
        }
    }, [currentInvoice?.items, gstRate, gstPercentage, gstEnabled]);


    // Process initialData when it changes - use billing config from initialData directly
    useEffect(() => {
        if (initialData) {
            const { client, project } = initialData;
            const pkg = initialData.package;
            const config = initialData.billingConfig;
            
            // Use GST settings from initialData's billingConfig directly (avoids race condition)
            const gstEnabledLocal = config?.tax?.enableGST !== false;
            const gstPercentageLocal = config?.tax?.gstPercentage ?? 18;
            const taxLabelLocal = gstEnabledLocal ? `GST (${gstPercentageLocal}%)` : 'Tax';
            const currencySymbolLocal = config?.currencySymbol || '₹'; // Default to Rupee for India
            
            // Determine price: use package price if available, otherwise project price
            const totalPrice = pkg?.price ?? project.price ?? 0;
            
            // Calculate GST-inclusive breakdown
            // The package price includes GST, so we reverse-calculate the base amount
            const { baseAmount } = calculateGSTBreakdown(totalPrice, gstEnabledLocal ? gstPercentageLocal : 0);
            
            // Create description with package name if available
            const description = pkg 
                ? `${pkg.name} - "${project.title}"`
                : `Services for "${project.title}"`;
            
            console.log('[InvoiceEditor] Processing initialData:', {
                packageId: project.packageId,
                packageName: pkg?.name,
                packagePrice: pkg?.price,
                projectPrice: project.price,
                totalPrice,
                gstPercentageLocal,
                baseAmount,
            });
            
            // Set selected package in dropdown (if package exists)
            setSelectedPackageId(pkg?.id || '');
            
            setCurrentInvoice({
                id: `inv_${Date.now()}`,
                invoiceNumber: getNextInvoiceNumber(invoices),
                invoiceDate: today,
                dueDate: futureDate,
                status: 'Draft' as const,
                template: defaultTemplateId,
                clientId: client.id,
                projectId: project.id,
                clientName: client.name,
                clientAddress: client.address || '',
                subtotal: 0,
                tax: 0,
                taxRate: gstPercentageLocal,
                taxLabel: taxLabelLocal,
                currencySymbol: currencySymbolLocal,
                total: 0,
                items: [{
                    id: `item_${Date.now()}`,
                    description: description,
                    quantity: 1,
                    unitPrice: Math.round(baseAmount * 100) / 100, // Round to 2 decimal places
                }]
            });
            clearInitialData();
        } else if (!currentInvoice) {
            setCurrentInvoice(createNewInvoice());
        }
    }, [initialData]);
    
    const handleInvoiceChange = (field: keyof Invoice, value: any) => {
        if (!currentInvoice) return;
        setCurrentInvoice(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
        if (!currentInvoice) return;
        const newItems = currentInvoice.items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        );
        handleInvoiceChange('items', newItems);
    };

    const addItem = () => {
        if (!currentInvoice) return;
        const newItem: InvoiceItem = { id: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 };
        handleInvoiceChange('items', [...currentInvoice.items, newItem]);
    };

    const removeItem = (itemId: string) => {
        if (!currentInvoice) return;
        handleInvoiceChange('items', currentInvoice.items.filter(item => item.id !== itemId));
    };
    
    const handleClientSelect = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
             handleInvoiceChange('clientId', client.id);
             handleInvoiceChange('clientName', client.name);
             handleInvoiceChange('clientAddress', client.address || '123 Main St\nAnytown, USA 12345');
        } else {
             handleInvoiceChange('clientId', undefined);
             handleInvoiceChange('clientName', '');
             handleInvoiceChange('clientAddress', '');
        }
    }
    
    // Handle package selection - update invoice with package pricing
    const handlePackageSelect = (packageId: string) => {
        setSelectedPackageId(packageId);
        if (!currentInvoice) return;
        
        const pkg = packages.find(p => p.id === packageId);
        if (pkg) {
            // Calculate GST-inclusive breakdown
            const { baseAmount } = calculateGSTBreakdown(pkg.price, gstEnabled ? gstPercentage : 0);
            
            // Get project title for description
            const project = albums.find(a => a.id === currentInvoice.projectId);
            const description = project 
                ? `${pkg.name} - "${project.title}"`
                : pkg.name;
            
            // Update the first item with package details
            const newItems = [...currentInvoice.items];
            if (newItems.length > 0) {
                newItems[0] = {
                    ...newItems[0],
                    description: description,
                    unitPrice: Math.round(baseAmount * 100) / 100,
                };
            } else {
                newItems.push({
                    id: `item_${Date.now()}`,
                    description: description,
                    quantity: 1,
                    unitPrice: Math.round(baseAmount * 100) / 100,
                });
            }
            handleInvoiceChange('items', newItems);
        }
    };
    
    const filteredProjects = useMemo(() => {
        if (!currentInvoice?.clientId) return [];
        return albums.filter(a => a.clientId === currentInvoice.clientId);
    }, [currentInvoice?.clientId, albums]);

    const handleSaveInvoice = () => {
        if (currentInvoice) {
            onSaveInvoice(currentInvoice);
            if (onInvoiceSaved) {
                onInvoiceSaved();
            }
        }
    };

    const inputClasses = "block w-full bg-white text-slate-900 border-slate-300 rounded-md shadow-sm sm:text-sm focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-200 outline-none transition-colors";
    
    if (!currentInvoice) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row h-full animate-fade-in bg-slate-100">
            <div className="w-full lg:w-3/5 flex-shrink-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Create Invoice</h1>
                        <p className="mt-1 text-slate-600">Fill in the details to generate a new invoice.</p>
                    </div>
                    <button onClick={handleSaveInvoice} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                        Save Invoice
                    </button>
                </header>

                <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Client</label>
                                <select value={currentInvoice.clientId || ''} onChange={e => handleClientSelect(e.target.value)} className={`mt-1 ${inputClasses}`}>
                                    <option value="">Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Project (Optional)</label>
                                <select value={currentInvoice.projectId || ''} onChange={e => handleInvoiceChange('projectId', e.target.value || undefined)} className={`mt-1 ${inputClasses}`} disabled={!currentInvoice.clientId}>
                                    <option value="">Select a project</option>
                                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Service Package
                                    <span className="text-xs text-slate-500 ml-1">(Auto-fills pricing)</span>
                                </label>
                                <select 
                                    value={selectedPackageId} 
                                    onChange={e => handlePackageSelect(e.target.value)} 
                                    className={`mt-1 ${inputClasses}`}
                                >
                                    <option value="">Select a package</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} - ₹{pkg.price?.toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-200 rounded-lg">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Invoice #</label>
                                <input type="text" value={currentInvoice.invoiceNumber} onChange={e => handleInvoiceChange('invoiceNumber', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Invoice Date</label>
                                <input type="date" value={currentInvoice.invoiceDate} onChange={e => handleInvoiceChange('invoiceDate', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Due Date</label>
                                <input type="date" value={currentInvoice.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Items</h3>
                        <div className="space-y-4">
                            {currentInvoice.items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-x-4 items-start">
                                    <div className="col-span-12 sm:col-span-6">
                                        <label className="text-xs text-slate-500 sm:hidden">Description</label>
                                        <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputClasses} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                         <label className="text-xs text-slate-500 sm:hidden">Qty</label>
                                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={inputClasses} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                         <label className="text-xs text-slate-500 sm:hidden">Price</label>
                                        <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={inputClasses} />
                                    </div>
                                    <div className="col-span-3 sm:col-span-1 text-right font-medium self-center pt-5 sm:pt-0">
                                        <span className="sm:hidden text-xs text-slate-500">Total: </span>{currentInvoice.currencySymbol || '₹'}{(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                    <div className="col-span-1 text-right self-center pt-5 sm:pt-0">
                                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><XCircleIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"><PlusIcon className="w-4 h-4"/> Add Item</button>
                    </div>
                    
                    <div className="p-6 bg-white border border-slate-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Template</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {invoiceTemplates.map(template => (
                                <div key={template.id} className="relative">
                                    <button
                                        onClick={() => handleInvoiceChange('template', template.id)}
                                        className={`w-full border-2 rounded-lg overflow-hidden transition-all ${currentInvoice.template === template.id ? 'border-slate-800 shadow-md' : 'border-slate-200 hover:border-slate-400'}`}
                                    >
                                        <img src={template.imageUrl} alt={template.name} className="h-24 w-full object-cover object-top" />
                                        <div className="p-2 text-center bg-white">
                                            <p className="font-semibold text-sm">{template.name}</p>
                                        </div>
                                    </button>
                                     <button
                                        onClick={() => onSetDefaultTemplate(template.id)}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${defaultTemplateId === template.id ? 'bg-yellow-400 text-white' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
                                        title="Set as Default"
                                    >
                                        <StarIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-2/5 p-4 sm:p-6 lg:p-8 bg-slate-200 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-2xl scale-95 origin-top">
                    <InvoiceRenderer
                        invoice={currentInvoice}
                        logo={displayLogo}
                        brandColor={brandColor}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;