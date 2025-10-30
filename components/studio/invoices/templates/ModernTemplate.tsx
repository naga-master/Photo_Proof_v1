import React from 'react';
import type { Invoice } from '../../../../types';

interface TemplateProps {
  invoice: Invoice;
  logo: string | null;
  brandColor: string;
}

const ModernTemplate: React.FC<TemplateProps> = ({ invoice, logo, brandColor }) => {
  return (
    <div className="font-sans bg-white p-10 text-gray-800">
      <header style={{ backgroundColor: brandColor }} className="p-8 rounded-t-lg text-white">
        <div className="flex justify-between items-center">
          <div>
            {logo ? (
              <img src={logo} alt="Studio Logo" className="h-12" />
            ) : (
              <h1 className="text-2xl font-bold uppercase tracking-widest">THE SCOBEYS</h1>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold">INVOICE</h2>
            <p className="text-sm mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>
      </header>

      <main className="p-8">
        <section className="grid grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Billed To</h3>
            <p className="font-bold mt-1">{invoice.clientName}</p>
            <p className="text-sm whitespace-pre-line">{invoice.clientAddress}</p>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-4 text-sm">
            <div className="text-right">
                <p className="font-semibold text-gray-500">Invoice Date</p>
                <p className="font-medium text-gray-800">{invoice.invoiceDate}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-500">Due Date</p>
                <p className="font-medium text-gray-800">{invoice.dueDate}</p>
            </div>
             <div className="text-right">
                <p className="font-semibold text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{invoice.status}</span>
            </div>
          </div>
        </section>

        <section>
          <table className="w-full text-left">
            <thead>
              <tr style={{ color: brandColor }} className="border-b-2 border-gray-200">
                <th className="pb-2 text-sm font-bold uppercase tracking-wider">Description</th>
                <th className="pb-2 text-sm font-bold uppercase tracking-wider text-center">Qty</th>
                <th className="pb-2 text-sm font-bold uppercase tracking-wider text-right">Unit Price</th>
                <th className="pb-2 text-sm font-bold uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-medium">{item.description}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Tax (8%):</span>
                    <span className="font-medium">${invoice.tax.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                    <span style={{ color: brandColor }}>Total:</span>
                    <span style={{ color: brandColor }}>${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </section>
        {invoice.notes && (
            <section className="mt-8 pt-6 border-t">
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </section>
        )}
      </main>
    </div>
  );
};

export default ModernTemplate;
