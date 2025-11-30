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
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">Manage all your client billing and payments.</p>
        </div>
        <button onClick={onNewInvoice} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors min-h-[44px]">
          <PlusIcon className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </header>
      
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{invoice.currencySymbol || '₹'}{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

      {/* Mobile Card View */}
      <div className="md:hidden bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-200">
        {invoices.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-500">
            <h3 className="text-lg font-medium">No Invoices Yet</h3>
            <p className="mt-1">Click 'New Invoice' to get started.</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} onClick={() => onPreviewInvoice(invoice)} className="p-4 active:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">{invoice.invoiceNumber}</h3>
                  <p className="text-sm text-slate-600">{getClientName(invoice.clientId)}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[invoice.status]}`}>
                  {invoice.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-900 font-medium">{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount:</span>
                  <span className="text-slate-900 font-bold text-base">{invoice.currencySymbol || '₹'}{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewInvoice(invoice);
                  }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors min-h-[44px]"
                >
                  View Invoice
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;