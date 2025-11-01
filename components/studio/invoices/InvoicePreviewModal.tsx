import React, { useState } from 'react';
import type { Invoice, Client } from '../../../types';
import InvoiceRenderer from './InvoiceRenderer';
import { CloseIcon } from '../../icons';
import { toast } from 'react-toastify';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  logo: string | null;
  brandColor: string;
  client?: Client;
  onShare?: (type: 'whatsapp' | 'email', invoice: Invoice) => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice, logo, brandColor, client, onShare }) => {
  const [showShareDropdown, setShowShareDropdown] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleShare = (type: 'whatsapp' | 'email') => {
    if (!client) {
      toast.error('Client information not available');
      return;
    }

    if (type === 'whatsapp') {
      if (!client.whatsappOptIn || !client.phone) {
        toast.error('WhatsApp is not configured for this client. Please update client communication preferences.');
        return;
      }
      toast.success(`Invoice will be shared via WhatsApp to ${client.name}`);
      console.log('WhatsApp share:', { client, invoice });
      if (onShare) onShare(type, invoice);
    } else if (type === 'email') {
      if (!client.emailOptIn || !client.email) {
        toast.error('Email is not configured for this client. Please update client communication preferences.');
        return;
      }
      toast.success(`Invoice will be sent via email to ${client.email}`);
      console.log('Email share:', { client, invoice });
      if (onShare) onShare(type, invoice);
    }
    setShowShareDropdown(false);
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast.info('PDF download coming soon!');
  };

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
            <button onClick={handleDownload} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Download PDF</button>
            {client && (
              <div className="relative">
                <button 
                  onClick={() => setShowShareDropdown(!showShareDropdown)} 
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                {showShareDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      disabled={!client.whatsappOptIn || !client.phone}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 rounded-t-lg ${
                        !client.whatsappOptIn || !client.phone ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                      {(!client.whatsappOptIn || !client.phone) && (
                        <span className="ml-auto text-xs text-gray-400">Not configured</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      disabled={!client.emailOptIn || !client.email}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 rounded-b-lg border-t ${
                        !client.emailOptIn || !client.email ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                      {(!client.emailOptIn || !client.email) && (
                        <span className="ml-auto text-xs text-gray-400">Not configured</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
