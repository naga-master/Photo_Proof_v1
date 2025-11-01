import React, { useState, useEffect, useMemo } from 'react';
import type { Invoice, InvoiceItem, Client, Album, InvoiceTemplateId } from '../../types';
import { PlusIcon, XCircleIcon, StarIcon } from '../icons';
import { invoiceTemplates } from '../../data/invoiceTemplates';
import InvoiceRenderer from './invoices/InvoiceRenderer';

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
    const lastNum = invoices.reduce((max, inv) => {
        const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `INV-${String(lastNum + 1).padStart(4, '0')}`;
};

const InvoiceEditor: React.FC<InvoicesPageProps> = (props) => {
    const { clients, albums, invoices, onSaveInvoice, initialData, clearInitialData, defaultTemplateId, onSetDefaultTemplate, logo, brandColor } = props;

    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const futureDate = dueDate.toISOString().split('T')[0];

    const createNewInvoice = () => ({
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
        total: 0,
    });
    
    useEffect(() => {
        if (!currentInvoice) return;
        const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        if (currentInvoice.subtotal !== subtotal || currentInvoice.tax !== tax || currentInvoice.total !== total) {
            setCurrentInvoice(inv => inv ? { ...inv, subtotal, tax, total } : null);
        }
    }, [currentInvoice?.items, currentInvoice?.subtotal, currentInvoice?.tax, currentInvoice?.total]);


    useEffect(() => {
        if (initialData) {
            const { client, project } = initialData;
            setCurrentInvoice({
                ...createNewInvoice(),
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
    }, [initialData, clearInitialData, invoices, currentInvoice, defaultTemplateId]);
    
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

    const inputClasses = "block w-full bg-white text-slate-900 border-slate-300 rounded-md shadow-sm sm:text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-colors";
    
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
                    <button onClick={() => onSaveInvoice(currentInvoice)} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700">
                        Save Invoice
                    </button>
                </header>

                <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Client</label>
                                <select value={currentInvoice.clientId || ''} onChange={e => handleClientSelect(e.target.value)} className={`mt-1 ${inputClasses}`}>
                                    <option value="">Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Project (Optional)</label>
                                <select value={currentInvoice.projectId || ''} onChange={e => handleInvoiceChange('projectId', parseInt(e.target.value))} className={`mt-1 ${inputClasses}`} disabled={!currentInvoice.clientId}>
                                    <option value="">Select a project</option>
                                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
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
                                        <span className="sm:hidden text-xs text-slate-500">Total: </span>${(item.quantity * item.unitPrice).toFixed(2)}
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
                        logo={logo}
                        brandColor={brandColor}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;