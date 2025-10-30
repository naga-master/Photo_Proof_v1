import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Invoice, InvoiceItem, Client, Album, InvoiceTemplateId } from '../../../types';
import { PlusIcon, XCircleIcon, StarIcon, SendIcon } from '../../icons';
import { invoiceTemplates } from '../../../data/invoiceTemplates';
import InvoiceRenderer from './InvoiceRenderer';

interface InvoicesPageProps {
    clients: Client[];
    albums: Album[];
    invoices: Invoice[];
    onSaveInvoice: (invoice: Invoice) => void;
    initialData: { client: Client, project: Album } | null;
    clearInitialData: () => void;
    defaultTemplateId: InvoiceTemplateId;
    onSetDefaultTemplate: (templateId: InvoiceTemplateId) => void;
    logo: string | null;
    brandColor: string;
}

const getNextInvoiceNumber = (invoices: Invoice[]) => {
    if (!invoices || invoices.length === 0) return 'INV-0001';
    const lastNum = invoices.reduce((max, inv) => {
        const num = parseInt(inv.invoiceNumber.replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `INV-${String(lastNum + 1).padStart(4, '0')}`;
};

const InvoicesPage: React.FC<InvoicesPageProps> = (props) => {
    const { clients, albums, invoices, onSaveInvoice, initialData, clearInitialData, defaultTemplateId, onSetDefaultTemplate, logo, brandColor } = props;

    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

    const createNewInvoice = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const futureDate = dueDate.toISOString().split('T')[0];
        return {
            id: `inv_${Date.now()}`,
            invoiceNumber: getNextInvoiceNumber(invoices),
            invoiceDate: today,
            dueDate: futureDate,
            items: [{ id: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }],
            status: 'Draft' as const,
            template: defaultTemplateId,
            clientName: '',
            clientAddress: '',
            notes: 'Thank you for your business!',
            subtotal: 0,
            tax: 0,
            total: 0,
        };
    }, [invoices, defaultTemplateId]);

    useEffect(() => {
        if (initialData) {
            const { client, project } = initialData;
            const newInvoice = createNewInvoice();
            setCurrentInvoice({
                ...newInvoice,
                clientId: client.id,
                projectId: project.id,
                clientName: client.name,
                clientAddress: client.address || '',
                items: [{
                    id: `item_${Date.now()}`,
                    description: `Services for "${project.title}"`,
                    quantity: 1,
                    unitPrice: project.price || 0,
                }]
            });
            clearInitialData();
        } else if (!currentInvoice) {
            setCurrentInvoice(createNewInvoice());
        }
    }, [initialData, clearInitialData, createNewInvoice, currentInvoice]);

    useEffect(() => {
        if (currentInvoice) {
            const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const tax = subtotal * 0.08; // 8% tax rate
            const total = subtotal + tax;
            if (currentInvoice.subtotal !== subtotal || currentInvoice.tax !== tax || currentInvoice.total !== total) {
                setCurrentInvoice(inv => inv ? { ...inv, subtotal, tax, total } : null);
            }
        }
    }, [currentInvoice]);
    
    const handleInvoiceChange = (field: keyof Invoice, value: any) => {
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
        if (!currentInvoice || currentInvoice.items.length <= 1) return;
        handleInvoiceChange('items', currentInvoice.items.filter(item => item.id !== itemId));
    };
    
    const handleClientSelect = (clientId: string) => {
        const client = clients.find(c => c.id === parseInt(clientId));
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
    
    const filteredProjects = useMemo(() => {
        if (!currentInvoice?.clientId) return [];
        return albums.filter(a => a.clientId === currentInvoice.clientId);
    }, [currentInvoice?.clientId, albums]);
    
    const handleSave = () => {
        if(currentInvoice) {
            onSaveInvoice(currentInvoice);
        }
    }

    const inputClasses = "block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-gray-500 focus:border-gray-500";
    
    if (!currentInvoice) {
        return <div className="p-8">Loading Invoice Editor...</div>;
    }

    return (
        <div className="flex h-full animate-fade-in bg-gray-50">
            <div className="w-1/2 flex-shrink-0 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                        <p className="mt-1 text-sm text-gray-500">Fill in the details to generate a new invoice.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">Save Invoice</button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            <SendIcon className="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </header>

                <div className="space-y-6">
                    <div className="p-5 bg-white border rounded-lg">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Client</label>
                                <select value={currentInvoice.clientId || ''} onChange={e => handleClientSelect(e.target.value)} className={`mt-1 ${inputClasses}`}>
                                    <option value="">Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project (Optional)</label>
                                <select value={currentInvoice.projectId || ''} onChange={e => handleInvoiceChange('projectId', parseInt(e.target.value))} className={`mt-1 ${inputClasses}`} disabled={!currentInvoice.clientId}>
                                    <option value="">Select a project</option>
                                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white border rounded-lg">
                         <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Invoice #</label>
                                <input type="text" value={currentInvoice.invoiceNumber} onChange={e => handleInvoiceChange('invoiceNumber', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                                <input type="date" value={currentInvoice.invoiceDate} onChange={e => handleInvoiceChange('invoiceDate', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" value={currentInvoice.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} className={`mt-1 ${inputClasses}`} />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white border rounded-lg">
                        <div className="space-y-3">
                            {currentInvoice.items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-x-3 items-center">
                                    <div className="col-span-6">
                                        <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputClasses} />
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" placeholder="Qty" min="0" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-center`} />
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" placeholder="Price" min="0" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`} />
                                    </div>
                                    <div className="col-span-1 text-right font-medium text-gray-700">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        {currentInvoice.items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><XCircleIcon className="w-5 h-5"/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="w-4 h-4"/> Add Item</button>
                    </div>

                    <div className="p-5 bg-white border rounded-lg grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes / Terms</label>
                            <textarea value={currentInvoice.notes} onChange={e => handleInvoiceChange('notes', e.target.value)} rows={4} className={`mt-1 ${inputClasses}`} />
                        </div>
                        <div className="text-right space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal:</span>
                                <span className="font-medium text-gray-800">${currentInvoice.subtotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Tax (8%):</span>
                                <span className="font-medium text-gray-800">${currentInvoice.tax.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
                                <span className="text-gray-800">Total:</span>
                                <span className="text-gray-900">${currentInvoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                     <div className="p-5 bg-white border rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Template</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {invoiceTemplates.map(template => (
                                <div key={template.id} className="relative">
                                    <button
                                        onClick={() => handleInvoiceChange('template', template.id)}
                                        className={`w-full border-2 rounded-lg overflow-hidden transition-all ${currentInvoice.template === template.id ? 'border-gray-800 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                                    >
                                        <img src={template.imageUrl} alt={template.name} className="h-24 w-full object-cover object-top" />
                                        <div className="p-2 text-center bg-white">
                                            <p className="font-semibold text-sm">{template.name}</p>
                                        </div>
                                    </button>
                                     <button
                                        onClick={() => onSetDefaultTemplate(template.id)}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${defaultTemplateId === template.id ? 'bg-yellow-400 text-white' : 'bg-white/50 text-gray-600 hover:bg-white'}`}
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
            <div className="w-1/2 p-8 bg-gray-200 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-2xl p-4 max-w-2xl mx-auto">
                    <InvoiceRenderer
                        invoice={currentInvoice}
                        logo={logo}
                        brandColor={brandColor}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoicesPage;