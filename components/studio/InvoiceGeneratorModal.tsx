import React, { useState } from 'react';
import { CloseIcon, DownloadIcon } from '../icons';
import type { Album, Client, ServicePackage, Invoice } from '../../types';

type CommunicationType = 'whatsapp' | 'email';

interface InvoiceGeneratorModalProps {
  project: Album;
  client: Client;
  packages: ServicePackage[];
  onClose: () => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onShare: (communicationType: CommunicationType, invoice: Invoice) => void;
}

const InvoiceGeneratorModal: React.FC<InvoiceGeneratorModalProps> = ({
  project,
  client,
  packages,
  onClose,
  onSaveInvoice,
  onShare
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Get package details
  const projectPackage = packages.find(pkg => pkg.id === project.packageId);
  
  // Generate invoice number
  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const invoiceDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

  // Calculate amounts
  const packageAmount = projectPackage?.price || 0;
  const subtotal = packageAmount;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Create invoice object
  const invoice: Invoice = {
    id: `invoice-${Date.now()}`,
    invoiceNumber,
    invoiceDate,
    dueDate,
    clientId: client.id,
    projectId: project.id,
    clientName: client.name,
    clientAddress: client.address || 'N/A',
    items: projectPackage ? [{
      id: projectPackage.id,
      description: `${projectPackage.name} - ${projectPackage.description}`,
      quantity: 1,
      unitPrice: packageAmount
    }] : [],
    notes: `Photography service for project: ${project.title}`,
    subtotal,
    tax,
    total,
    status: 'Unpaid',
    template: 'modern'
  };

  const handleDownload = () => {
    // Create invoice HTML for download
    const invoiceHTML = generateInvoiceHTML(invoice, client, project, projectPackage);
    
    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Save invoice
    onSaveInvoice(invoice);
  };

  const handleShare = (type: CommunicationType) => {
    onShare(type, invoice);
    setShowShareOptions(false);
  };

  const generateInvoiceHTML = (
    inv: Invoice,
    cli: Client,
    proj: Album,
    pkg?: ServicePackage
  ): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .invoice-header { border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { margin: 0; font-size: 32px; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f8f8; font-weight: bold; }
    .totals { text-align: right; }
    .totals div { margin: 8px 0; }
    .total-amount { font-size: 20px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>INVOICE</h1>
    <p>Invoice Number: ${inv.invoiceNumber}</p>
  </div>

  <div class="invoice-info">
    <div>
      <h3>Bill To:</h3>
      <p><strong>${cli.name}</strong></p>
      <p>${cli.address || 'N/A'}</p>
      <p>${cli.email}</p>
      ${cli.phone ? `<p>${cli.phone}</p>` : ''}
    </div>
    <div>
      <h3>Invoice Details:</h3>
      <p><strong>Date:</strong> ${new Date(inv.invoiceDate).toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${new Date(inv.dueDate).toLocaleDateString()}</p>
      <p><strong>Project:</strong> ${proj.title}</p>
      <p><strong>Status:</strong> ${inv.status}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${inv.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div><strong>Subtotal:</strong> $${inv.subtotal.toFixed(2)}</div>
    <div><strong>Tax (10%):</strong> $${inv.tax.toFixed(2)}</div>
    <div class="total-amount"><strong>Total Amount:</strong> $${inv.total.toFixed(2)}</div>
  </div>

  ${inv.notes ? `
  <div style="margin-top: 30px;">
    <h3>Notes:</h3>
    <p>${inv.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Please make payment by ${new Date(inv.dueDate).toLocaleDateString()}</p>
  </div>
</body>
</html>
    `.trim();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Invoice</h2>
            <p className="text-sm text-gray-600 mt-1">Project: {project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {!projectPackage ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium">No package selected for this project</p>
              <p className="text-gray-500 mt-2">Please assign a package to generate an invoice</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Invoice Header */}
              <div className="border-b-2 border-gray-900 pb-4 mb-6">
                <h3 className="text-3xl font-bold text-gray-900">INVOICE</h3>
                <p className="text-gray-600 mt-1">#{invoiceNumber}</p>
              </div>

              {/* Client & Invoice Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                  <p className="text-gray-700 font-medium">{client.name}</p>
                  <p className="text-gray-600 text-sm">{client.address || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">{client.email}</p>
                  {client.phone && <p className="text-gray-600 text-sm">{client.phone}</p>}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Invoice Details:</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-600">Date:</span> <span className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</span></p>
                    <p><span className="text-gray-600">Due Date:</span> <span className="font-medium">{new Date(dueDate).toLocaleDateString()}</span></p>
                    <p><span className="text-gray-600">Project:</span> <span className="font-medium">{project.title}</span></p>
                    <p><span className="text-gray-600">Status:</span> <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unpaid</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <p className="font-medium">{projectPackage.name}</p>
                        <p className="text-gray-600 text-xs mt-1">{projectPackage.description}</p>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">1</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">${packageAmount.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">${packageAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Tax (10%):</span>
                      <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-900">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">Photography service for project: {project.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {projectPackage && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Invoice will be saved and available in Invoices section</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Share
                </button>
                {showShareOptions && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
                    >
                      <span className="text-green-600">📱</span>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
                    >
                      <span className="text-blue-600">✉️</span>
                      Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceGeneratorModal;
