import React from 'react';
import type { Invoice } from '../../../../types';

interface TemplateProps {
  invoice: Invoice;
  logo: string | null;
  brandColor: string;
}

const ClassicTemplate: React.FC<TemplateProps> = ({ invoice, logo }) => {
  return (
    <div className="font-serif bg-white p-12 text-gray-900 border-2 border-gray-800">
      <header className="text-center mb-12">
        {logo ? (
          <img src={logo} alt="Studio Logo" className="h-16 mx-auto mb-4" />
        ) : (
          <h1 className="text-3xl font-bold tracking-wider uppercase">NAPSTER's Photo Lab</h1>
        )}
        <p className="text-sm text-gray-600">123 Photography Lane, Suite 100, Artville, USA</p>
      </header>
      
      <div className="border-t-2 border-b-2 border-gray-800 py-2 mb-10">
        <h2 className="text-center text-4xl font-bold tracking-widest">INVOICE</h2>
      </div>

      <main>
        <section className="grid grid-cols-2 gap-8 mb-10 text-sm">
          <div>
            <h3 className="font-bold text-gray-600 mb-1">BILLED TO:</h3>
            <p className="font-semibold">{invoice.clientName}</p>
            <p className="whitespace-pre-line">{invoice.clientAddress}</p>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2">
                <span className="font-bold text-gray-600">INVOICE #:</span>
                <span className="font-semibold">{invoice.invoiceNumber}</span>
                <span className="font-bold text-gray-600">DATE:</span>
                <span className="font-semibold">{invoice.invoiceDate}</span>
                <span className="font-bold text-gray-600">DUE DATE:</span>
                <span className="font-semibold">{invoice.dueDate}</span>
            </div>
          </div>
        </section>

        <section>
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-gray-800">
              <tr>
                <th className="pb-2 font-bold uppercase">Description</th>
                <th className="pb-2 font-bold uppercase text-center">Qty</th>
                <th className="pb-2 font-bold uppercase text-right">Unit Price</th>
                <th className="pb-2 font-bold uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-semibold">{item.description}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right font-semibold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8%):</span>
                    <span className="font-semibold">${invoice.tax.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-gray-800 mt-2">
                    <span>Amount Due:</span>
                    <span>${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </section>
        {invoice.notes && (
            <section className="mt-10 pt-6 border-t text-sm">
                <h4 className="font-bold mb-2">Notes</h4>
                <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </section>
        )}
      </main>
    </div>
  );
};

export default ClassicTemplate;