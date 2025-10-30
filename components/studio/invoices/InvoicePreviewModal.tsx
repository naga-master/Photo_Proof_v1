import React from 'react';
import type { Invoice } from '../../../types';
import InvoiceRenderer from './InvoiceRenderer';
import { CloseIcon, PrinterIcon, SendIcon } from '../../icons';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  onClose: () => void;
  logo: string | null;
  brandColor: string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ invoice, onClose, logo, brandColor }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b bg-white rounded-t-lg flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Invoice Preview: {invoice.invoiceNumber}</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <PrinterIcon className="w-4 h-4" />
                Print
            </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                <SendIcon className="w-4 h-4" />
                Send Invoice
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <CloseIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
            <div className="bg-white shadow-lg rounded-lg max-w-3xl mx-auto">
                 <InvoiceRenderer
                    invoice={invoice}
                    logo={logo}
                    brandColor={brandColor}
                />
            </div>
        </main>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
