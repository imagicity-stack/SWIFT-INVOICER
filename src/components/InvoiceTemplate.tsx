/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InvoiceData, CompanySettings, TemplateId } from '../types';
import { calculateSubtotal, calculateTax, calculateTotal, formatCurrency } from '../lib/pdf';
import { Separator } from '@/components/ui/separator';

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  settings: CompanySettings;
  templateId: TemplateId;
}

export default function InvoiceTemplate({ invoice, settings, templateId }: InvoiceTemplateProps) {
  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(invoice.items, settings.defaultTaxRate);
  const total = calculateTotal(invoice.items, settings.defaultTaxRate);

  // Modern Template
  if (templateId === 'modern') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-12 bg-white flex flex-col font-sans text-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-4">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.name} className="h-16 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {settings.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{settings.name}</h1>
              <p className="text-gray-500 whitespace-pre-line leading-relaxed">{settings.address}</p>
              <p className="text-gray-500">{settings.phone} • {settings.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black italic text-gray-100 mb-2 uppercase select-none">Receipt</h2>
            <div className="space-y-1 mt-4">
              <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Receipt No.</p>
              <p className="text-xl font-bold">#{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          <div className="space-y-4">
            <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Billed To</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">{invoice.customerName}</p>
              <p className="text-gray-500">{invoice.customerEmail}</p>
              <p className="text-gray-500 whitespace-pre-line">{invoice.customerAddress}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Date</p>
                <p className="font-semibold">{invoice.date}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Due Date</p>
                <p className="font-semibold">{invoice.dueDate || 'Upon receipt'}</p>
              </div>
            </div>
            {settings.taxNumber && (
              <div className="space-y-1">
                <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Tax ID</p>
                <p className="font-semibold">{settings.taxNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1">
          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-4 font-bold uppercase tracking-widest text-[10px]">Description</th>
                <th className="py-4 font-bold uppercase tracking-widest text-[10px] text-center w-24">QTY</th>
                <th className="py-4 font-bold uppercase tracking-widest text-[10px] text-right w-32">Price</th>
                <th className="py-4 font-bold uppercase tracking-widest text-[10px] text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-5 font-medium">{item.description}</td>
                  <td className="py-5 text-center">{item.quantity}</td>
                  <td className="py-5 text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                  <td className="py-5 text-right font-bold">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-5 gap-8 items-end">
          <div className="col-span-3 space-y-6">
            <div className="space-y-2">
              <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Payment Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <p className="text-gray-400 italic">Bank:</p>
                <p className="font-semibold">{settings.bankName}</p>
                <p className="text-gray-400 italic">Account:</p>
                <p className="font-semibold">{settings.accountNumber}</p>
                {settings.iban && (
                  <>
                    <p className="text-gray-400 italic">IBAN:</p>
                    <p className="font-semibold">{settings.iban}</p>
                  </>
                )}
              </div>
            </div>
            
            {settings.aboutSection && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 italic leading-relaxed">{settings.aboutSection}</p>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-3 pl-8">
            <div className="flex justify-between text-gray-500">
              <span className="font-medium uppercase tracking-widest text-[10px]">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span className="font-medium uppercase tracking-widest text-[10px]">Tax {settings.defaultTaxRate}%</span>
              <span className="font-semibold">{formatCurrency(tax, settings.currency)}</span>
            </div>
            <Separator className="bg-black h-[1px]" />
            <div className="flex justify-between items-baseline pt-2">
              <span className="font-bold uppercase tracking-widest text-xs">Grand Total</span>
              <span className="text-3xl font-black">{formatCurrency(total, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimal Template
  if (templateId === 'minimal') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-20 bg-white flex flex-col font-mono text-xs">
        <div className="mb-20 flex justify-between items-start">
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tighter uppercase">{settings.name}</h1>
            <p className="opacity-60 whitespace-pre-line">{settings.address}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">RECEIPT_{invoice.invoiceNumber}</p>
            <p className="opacity-60">{invoice.date}</p>
          </div>
        </div>

        <div className="mb-20">
          <p className="opacity-40 uppercase mb-2">Recipient</p>
          <div className="border-l-2 border-black pl-4">
            <p className="font-bold">{invoice.customerName}</p>
            <p className="opacity-60">{invoice.customerEmail}</p>
            <p className="opacity-60 whitespace-pre-line">{invoice.customerAddress}</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-4 border-b border-black/10 py-2 font-bold opacity-40 uppercase">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {invoice.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-4 border-b border-black/5 py-4">
              <span>{item.description}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">{formatCurrency(item.unitPrice, settings.currency)}</span>
              <span className="text-right">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</span>
            </div>
          ))}

          {invoice.customFields.length > 0 && (
            <div className="mt-8 pt-8 border-t border-dashed border-black/10">
               {invoice.customFields.map((field, idx) => (
                 <div key={idx} className="flex gap-4 mb-1">
                   <span className="opacity-40">{field.label}:</span>
                   <span>{field.value}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="mt-20 self-end w-64 space-y-2 border-t border-black pt-4">
          <div className="flex justify-between">
            <span className="opacity-60">Subtotal</span>
            <span>{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Tax ({settings.defaultTaxRate}%)</span>
            <span>{formatCurrency(tax, settings.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-2">
            <span>TOTAL</span>
            <span>{formatCurrency(total, settings.currency)}</span>
          </div>
        </div>

        <div className="mt-auto opacity-40 text-[10px]">
          <p>{settings.bankName} • {settings.accountNumber}</p>
          <p>{settings.aboutSection}</p>
        </div>
      </div>
    );
  }

  // Bold Template
  if (templateId === 'bold') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] bg-white flex flex-col font-sans">
        <div className="h-4 w-full flex">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} />
          ))}
        </div>
        
        <div className="p-16 flex-1 flex flex-col">
          <div className="flex justify-between items-baseline mb-20">
            <h1 className="text-7xl font-black uppercase tracking-tighter">Paid</h1>
            <div className="text-right">
              <p className="text-2xl font-black uppercase">{settings.name}</p>
              <p className="text-sm font-medium text-gray-400">Ref: #{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-20 mb-20">
            <div className="space-y-4">
              <div className="bg-black text-white px-3 py-1 inline-block text-[10px] font-bold uppercase tracking-widest">Customer</div>
              <div className="space-y-1">
                <p className="text-xl font-bold">{invoice.customerName}</p>
                <p className="text-gray-500">{invoice.customerEmail}</p>
                <p className="text-gray-500 whitespace-pre-line">{invoice.customerAddress}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-black text-white px-3 py-1 inline-block text-[10px] font-bold uppercase tracking-widest">Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-400">Date:</span>
                <span className="font-bold">{invoice.date}</span>
                <span className="text-gray-400">Currency:</span>
                <span className="font-bold">{settings.currency}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl border-2 border-black">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-left font-black uppercase text-xs">Item</th>
                  <th className="p-4 text-right font-black uppercase text-xs">Amt</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b-2 border-black last:border-b-0 group">
                    <td className="p-4">
                      <div className="font-bold">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.quantity} units @ {formatCurrency(item.unitPrice, settings.currency)}</div>
                    </td>
                    <td className="p-4 text-right font-black">
                      {formatCurrency(item.quantity * item.unitPrice, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div className="max-w-xs space-y-4">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Payment Info</div>
              <p className="text-xs font-bold">{settings.bankName} • {settings.accountNumber}</p>
              <p className="text-xs text-gray-500 leading-relaxed italic">"{settings.aboutSection}"</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-8 text-gray-400 text-sm font-bold uppercase">
                <span>Subtotal</span>
                <span className="text-black">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-end gap-8 text-gray-400 text-sm font-bold uppercase">
                <span>Tax {settings.defaultTaxRate}%</span>
                <span className="text-black">{formatCurrency(tax, settings.currency)}</span>
              </div>
              <div className="flex justify-end gap-8 text-3xl font-black pt-4 border-t-4 border-black mt-4">
                <span>Total</span>
                <span>{formatCurrency(total, settings.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Classic Template
  return (
    <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-16 bg-white font-serif text-sm">
      <div className="border-[4px] border-black p-8 h-full flex flex-col">
        <div className="flex justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Receipt</h1>
            <div className="space-y-1">
              <p><span className="font-bold">Number:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-bold">Date:</span> {invoice.date}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold">{settings.name}</h2>
            <p className="whitespace-pre-line opacity-70">{settings.address}</p>
            <p>{settings.taxNumber}</p>
          </div>
        </div>

        <div className="mb-12 py-6 border-y-2 border-black flex justify-between">
          <div>
            <p className="text-xs font-bold uppercase mb-2">Billed To:</p>
            <p className="text-lg font-bold">{invoice.customerName}</p>
            <p className="opacity-70">{invoice.customerEmail}</p>
            <p className="opacity-70 whitespace-pre-line">{invoice.customerAddress}</p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold uppercase mb-2">Total Due:</p>
             <p className="text-4xl font-black">{formatCurrency(total, settings.currency)}</p>
          </div>
        </div>

        <div className="flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-2 text-left uppercase text-xs">Item Description</th>
                <th className="p-2 text-right uppercase text-xs w-24">Qty</th>
                <th className="p-2 text-right uppercase text-xs w-32">Rate</th>
                <th className="p-2 text-right uppercase text-xs w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-black text-left">
                  <td className="p-4">{item.description}</td>
                  <td className="p-4 text-right">{item.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {invoice.customFields.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4">
               {invoice.customFields.map((field, idx) => (
                 <div key={idx} className="flex gap-2">
                   <span className="font-bold underline uppercase text-[10px]">{field.label}:</span>
                   <span>{field.value}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase">Payment Terms & Methods</p>
              <p className="text-xs opacity-70">Payable via {settings.bankName}</p>
              <p className="text-xs opacity-70">Account: {settings.accountNumber}</p>
              {settings.swiftCode && <p className="text-xs opacity-70">SWIFT: {settings.swiftCode}</p>}
            </div>
            <p className="text-xs italic">{settings.aboutSection}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between px-2">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span>Tax ({settings.defaultTaxRate}%)</span>
              <span>{formatCurrency(tax, settings.currency)}</span>
            </div>
            <div className="flex justify-between bg-black text-white p-4 items-center">
              <span className="font-bold uppercase">Total Amount</span>
              <span className="text-2xl font-black">{formatCurrency(total, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

