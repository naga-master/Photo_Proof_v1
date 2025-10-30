import React, { useState } from 'react';
import type { Invoice, Client } from '../../../types';
import { PlusIcon } from '../../icons';
import InvoicePreviewModal from './InvoicePreviewModal';

interface InvoicesPageProps {
  invoices: Invoice[];
  clients: Client[];
  onNewInvoice: () => void;
  onPreviewInvoice: (invoice: Invoice) => void;
  logo: string | null;
  brandColor: string;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, clients, onNewInvoice, onPreviewInvoice, logo, brandColor }) => {

  const getClientName = (clientId?: number) => {
    if (!clientId) return 'N/A';
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const statusStyles: { [key: string]: string } = {
    Paid: 'bg-green-100 text-green-800',
    Unpaid: 'bg-yellow-100 text-yellow-800',
    Overdue: 'bg-red-100 text-red-800',
    Draft: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-gray-600">Manage all your client billing and payments.</p>
        </div>
        <button onClick={onNewInvoice} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </header>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} onClick={() => onPreviewInvoice(invoice)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClientName(invoice.clientId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.invoiceDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">${invoice.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); onPreviewInvoice(invoice); }} className="text-indigo-600 hover:text-indigo-900">View</button>
                  </td>
                </tr>
              ))}
               {invoices.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">No invoices found.</td>
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