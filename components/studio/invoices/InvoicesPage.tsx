import React from 'react';
import type { Invoice, Client } from '../../../types';
import { PlusIcon } from '../../icons';

interface InvoicesPageProps {
  invoices: Invoice[];
  clients: Client[];
  onNewInvoice: () => void;
  onPreviewInvoice: (invoice: Invoice) => void;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, clients, onNewInvoice, onPreviewInvoice }) => {

  const getClientName = (clientId?: number) => {
    if (!clientId) return 'N/A';
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const statusStyles: { [key in Invoice['status']]: string } = {
    Paid: 'bg-green-100 text-green-800',
    Unpaid: 'bg-yellow-100 text-yellow-800',
    Overdue: 'bg-red-100 text-red-800',
    Draft: 'bg-slate-100 text-slate-800',
  };

  return (
    <div className="p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-slate-600">Manage all your client billing and payments.</p>
        </div>
        <button onClick={onNewInvoice} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </header>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} onClick={() => onPreviewInvoice(invoice)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getClientName(invoice.clientId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.invoiceDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">${invoice.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); onPreviewInvoice(invoice); }} className="text-sky-600 hover:text-sky-800">View</button>
                  </td>
                </tr>
              ))}
               {invoices.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                        <h3 className="text-lg font-medium">No Invoices Yet</h3>
                        <p className="mt-1">Click 'New Invoice' to get started.</p>
                    </td>
                </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;