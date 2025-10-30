import React from 'react';
import type { Invoice } from '../../../types';
import InvoiceRenderer from './InvoiceRenderer';
import { CloseIcon } from '../../icons';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  logo: string | null;
  brandColor: string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice, logo, brandColor }) => {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-800">Invoice Preview: {invoice.invoiceNumber}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
            <InvoiceRenderer invoice={invoice} logo={logo} brandColor={brandColor} />
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">Download PDF</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
