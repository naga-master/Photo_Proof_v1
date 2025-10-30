import React from 'react';
import type { Invoice } from '../../../../types';

interface TemplateProps {
  invoice: Invoice;
  logo: string | null;
  brandColor: string;
}

const MinimalistTemplate: React.FC<TemplateProps> = ({ invoice, logo }) => {
  return (
    <div className="font-sans bg-white p-12 text-gray-700 text-sm">
      <header className="flex justify-between items-start mb-16">
        <div>
          {logo ? (
            <img src={logo} alt="Studio Logo" className="h-8" />
          ) : (
            <h1 className="text-lg font-semibold tracking-wider uppercase text-gray-800">NAPSTER's Photo Lab</h1>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-light text-gray-400">INVOICE</h2>
          <p className="font-mono text-xs mt-1">{invoice.invoiceNumber}</p>
        </div>
      </header>

      <main>
        <section className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <p className="font-semibold text-gray-800">{invoice.clientName}</p>
            <p className="whitespace-pre-line leading-relaxed">{invoice.clientAddress}</p>
          </div>
          <div className="text-right">
            <p><span className="text-gray-500">Date:</span> {invoice.invoiceDate}</p>
            <p><span className="text-gray-500">Due:</span> {invoice.dueDate}</p>
          </div>
        </section>

        <section>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pb-2 font-medium text-gray-500">Description</th>
                <th className="pb-2 font-medium text-gray-500 text-center">Qty</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Unit Price</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(item => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-semibold text-gray-800">{item.description}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right font-semibold text-gray-800">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-800">${invoice.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Tax (8%)</span>
                    <span className="font-semibold text-gray-800">${invoice.tax.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </section>
        {invoice.notes && (
            <section className="mt-12 pt-6 border-t text-xs">
                <p className="text-gray-500 whitespace-pre-line">{invoice.notes}</p>
            </section>
        )}
      </main>
    </div>
  );
};

export default MinimalistTemplate;