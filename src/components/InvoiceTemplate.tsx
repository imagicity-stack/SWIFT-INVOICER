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

  const isInterState = invoice.customerStateCode && invoice.customerStateCode !== settings.addressStateCode;
  const gstRate = settings.defaultTaxRate;
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;

  // Modern Template (Updated for Indian GST)
  if (templateId === 'modern') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-12 bg-white flex flex-col font-sans text-sm border">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b-4 border-black pb-8">
          <div className="space-y-4">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.name} className="h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {settings.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter uppercase">{settings.name}</h1>
              <p className="text-gray-500 whitespace-pre-line leading-snug max-w-sm">{settings.address}</p>
              <div className="pt-2 space-y-0.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                <p>GSTIN: <span className="text-black font-black">{settings.gstNumber}</span></p>
                <p>PAN: <span className="text-black font-black">{settings.panNumber}</span></p>
                <p>STATE: <span className="text-black font-black">{settings.state} ({settings.addressStateCode})</span></p>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-black text-white px-6 py-2 mb-6 inline-block">
              <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Tax Invoice</h2>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gray-400">Invoice No.</span>
                <span className="text-xl font-black">#{invoice.invoiceNumber}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gray-400">Date</span>
                <span className="text-sm font-bold">{invoice.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Party Details */}
        <div className="grid grid-cols-2 gap-20 mb-12">
          <div className="space-y-4">
            <div className="border-l-4 border-black pl-4">
              <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2">Billed To (Recipient)</h3>
              <p className="text-lg font-black uppercase">{invoice.customerName}</p>
              <p className="text-gray-500 whitespace-pre-line">{invoice.customerAddress}</p>
              {invoice.customerGSTIN && (
                <p className="mt-2 text-xs font-bold uppercase">GSTIN: <span className="text-black">{invoice.customerGSTIN}</span></p>
              )}
            </div>
          </div>
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-black uppercase text-gray-400 text-[10px]">Due Date</span>
                  <p className="font-bold">{invoice.dueDate || 'Immediate'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-black uppercase text-gray-400 text-[10px]">Currency</span>
                  <p className="font-bold">{settings.currency}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1">
          <table className="w-full mb-12">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-y border-gray-200">
                <th className="py-3 px-4 text-left font-black uppercase text-[10px] tracking-widest">Description</th>
                <th className="py-3 px-4 text-center font-black uppercase text-[10px] tracking-widest w-24">HSN</th>
                <th className="py-3 px-4 text-center font-black uppercase text-[10px] tracking-widest w-16">Qty</th>
                <th className="py-3 px-4 text-right font-black uppercase text-[10px] tracking-widest w-32">Rate</th>
                <th className="py-3 px-4 text-right font-black uppercase text-[10px] tracking-widest w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 group">
                  <td className="py-5 px-4">
                    <p className="font-bold text-gray-900">{item.description}</p>
                  </td>
                  <td className="py-5 px-4 text-center text-xs font-medium text-gray-500">{item.hsnCode || '-'}</td>
                  <td className="py-5 px-4 text-center font-medium">{item.quantity}</td>
                  <td className="py-5 px-4 text-right font-medium">{formatCurrency(item.unitPrice, settings.currency)}</td>
                  <td className="py-5 px-4 text-right font-black text-gray-900">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Bank */}
        <div className="grid grid-cols-5 gap-12 mt-auto pt-8 border-t border-gray-200">
          <div className="col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-gray-400 underline underline-offset-4">Bank Details</h4>
                <div className="text-[10px] space-y-1">
                  <p><span className="font-bold">BANK:</span> {settings.bankName}</p>
                  <p><span className="font-bold">A/C NO:</span> {settings.accountNumber}</p>
                  <p><span className="font-bold">IFSC:</span> {settings.ifscCode}</p>
                  <p><span className="font-bold">BRANCH:</span> {settings.branchName}</p>
                </div>
              </div>
              {settings.aboutSection && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 underline underline-offset-4">Declaration</h4>
                  <p className="text-[9px] text-gray-500 leading-normal italic">{settings.aboutSection}</p>
                </div>
              )}
            </div>
            
            <div className="pt-8 border-t border-gray-100 flex justify-between items-end">
              <div className="space-y-4">
                <div className="w-32 h-12 border-b border-gray-300" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Receiver's Signature</p>
              </div>
              <div className="text-right space-y-4">
                <p className="text-[10px] font-black uppercase text-gray-900">For {settings.name}</p>
                <div className="w-32 h-12 border-b border-gray-300 ml-auto" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-gray-50 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 -mr-12 -mt-12 rounded-full" />
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-bold uppercase tracking-tight">Taxable Value</span>
                <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              
              {isInterState ? (
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-bold uppercase tracking-tight">IGST ({gstRate}%)</span>
                  <span className="font-bold">{formatCurrency(tax, settings.currency)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-tight">CGST ({cgstRate}%)</span>
                    <span className="font-bold">{formatCurrency(tax / 2, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-tight">SGST ({sgstRate}%)</span>
                    <span className="font-bold">{formatCurrency(tax / 2, settings.currency)}</span>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t-2 border-gray-200 mt-4 flex justify-between items-baseline">
                <span className="font-black uppercase text-xs">Total Amount</span>
                <span className="text-2xl font-black text-black">{formatCurrency(total, settings.currency)}</span>
              </div>
              <p className="text-[8px] text-center text-gray-400 uppercase mt-4 font-bold tracking-widest">Total GST: {gstRate}%</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            This is a system generated invoice and does not require any signature.
          </p>
        </div>
      </div>
    );
  }

  // Minimal Template
  if (templateId === 'minimal') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-20 bg-white flex flex-col font-mono text-xs">
        <div className="mb-20 flex justify-between items-start border-b pb-10">
          <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tighter uppercase">{settings.name}</h1>
            <p className="opacity-60 whitespace-pre-line leading-relaxed">{settings.address}</p>
            <p className="font-bold">GSTIN: {settings.gstNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black italic mb-2">INVOICE</p>
            <p className="font-bold uppercase tracking-widest text-gray-400 text-[10px]">Reference</p>
            <p className="font-bold">{invoice.invoiceNumber}</p>
            <p className="opacity-60">{invoice.date}</p>
          </div>
        </div>

        <div className="mb-20">
          <p className="opacity-40 uppercase mb-2 font-bold tracking-widest">Recipient</p>
          <div className="border-l-2 border-black pl-4">
            <p className="font-bold text-sm uppercase">{invoice.customerName}</p>
            <p className="opacity-60 whitespace-pre-line">{invoice.customerAddress}</p>
            {invoice.customerGSTIN && <p className="mt-1 font-bold">GST: {invoice.customerGSTIN}</p>}
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-6 border-b border-black py-2 font-bold opacity-40 uppercase text-[9px] tracking-widest">
            <span className="col-span-2">Description</span>
            <span className="text-center">HSN</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {invoice.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-6 border-b border-black/5 py-4">
              <span className="col-span-2 font-bold">{item.description}</span>
              <span className="text-center opacity-60">{item.hsnCode || '-'}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">{formatCurrency(item.unitPrice, settings.currency)}</span>
              <span className="text-right font-black">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</span>
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

        <div className="mt-20 self-end w-72 space-y-2 border-t-2 border-black pt-4">
          <div className="flex justify-between">
            <span className="opacity-60 uppercase font-bold">Taxable Value</span>
            <span>{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60 uppercase font-bold">GST ({settings.defaultTaxRate}%)</span>
            <span>{formatCurrency(tax, settings.currency)}</span>
          </div>
          <div className="flex justify-between font-black text-sm pt-4 border-t border-dashed border-black/20">
            <span className="uppercase">Grand Total</span>
            <span>{formatCurrency(total, settings.currency)}</span>
          </div>
        </div>

        <div className="mt-auto pt-10 border-t border-black/10 grid grid-cols-2">
          <div className="opacity-40 text-[9px] space-y-1">
            <p className="font-bold uppercase tracking-widest mb-1">Payment</p>
            <p>{settings.bankName}</p>
            <p>A/C: {settings.accountNumber}</p>
            <p>IFSC: {settings.ifscCode}</p>
          </div>
          <div className="text-right opacity-40 text-[9px]">
            <p className="italic">"{settings.aboutSection}"</p>
          </div>
        </div>
        <div className="mt-10 pt-4 border-t border-black/5 text-center opacity-30">
          <p className="text-[8px] font-bold uppercase tracking-widest">
            System Generated // No Signature Required
          </p>
        </div>
      </div>
    );
  }

  // Bold Template
  if (templateId === 'bold') {
    return (
      <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] bg-white flex flex-col font-sans border-8 border-black">
        <div className="p-16 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-20">
            <div className="space-y-6">
               <h1 className="text-8xl font-black uppercase tracking-tighter leading-none">INVOICE</h1>
               <div className="space-y-1">
                 <p className="text-2xl font-black uppercase">{settings.name}</p>
                 <p className="text-sm font-bold text-gray-500 whitespace-pre-line max-w-xs">{settings.address}</p>
                 <p className="text-xs font-black uppercase mt-2">GSTIN: {settings.gstNumber}</p>
               </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white p-4 inline-block transform -rotate-1 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Number</p>
                <p className="text-3xl font-black">#{invoice.invoiceNumber}</p>
              </div>
              <p className="text-sm font-black mt-4 uppercase text-gray-300">Date // {invoice.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-20 mb-20">
            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-1 inline-block text-[10px] font-black uppercase tracking-widest">Billed To</div>
              <div className="space-y-1 pl-4 border-l-8 border-gray-100">
                <p className="text-2xl font-black uppercase">{invoice.customerName}</p>
                <p className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">{invoice.customerAddress}</p>
                {invoice.customerGSTIN && <p className="text-xs font-black uppercase mt-2">GSTIN: {invoice.customerGSTIN}</p>}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-1 inline-block text-[10px] font-black uppercase tracking-widest">Banking</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-tight">
                <span className="text-gray-400">Bank:</span>
                <span>{settings.bankName}</span>
                <span className="text-gray-400">Account:</span>
                <span className="font-black">{settings.accountNumber}</span>
                <span className="text-gray-400">IFSC:</span>
                <span>{settings.ifscCode}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 border-4 border-black mb-10">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest">Description / HSN</th>
                  <th className="p-4 text-right font-black uppercase text-[10px] tracking-widest">Quantity</th>
                  <th className="p-4 text-right font-black uppercase text-[10px] tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b-4 border-black last:border-b-0 hover:bg-gray-50">
                    <td className="p-6">
                      <div className="text-lg font-black uppercase leading-tight">{item.description}</div>
                      <div className="text-xs font-bold text-gray-400 mt-1">HSN: {item.hsnCode || 'N/A'} • {formatCurrency(item.unitPrice, settings.currency)} per unit</div>
                    </td>
                    <td className="p-6 text-right font-black text-xl">
                      {item.quantity}
                    </td>
                    <td className="p-6 text-right font-black text-xl">
                      {formatCurrency(item.quantity * item.unitPrice, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-end">
             <div className="max-w-sm space-y-4">
               <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest leading-relaxed">Declaration // {settings.aboutSection}</p>
             </div>
             <div className="bg-black text-white p-10 min-w-[350px] shadow-[20px_20px_0px_#E5E7EB]">
                <div className="border-b-2 border-white/20 pb-4 mb-4 space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-60">
                    <span>Taxable Value</span>
                    <span>{formatCurrency(subtotal, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-60">
                    <span>Total GST ({settings.defaultTaxRate}%)</span>
                    <span>{formatCurrency(tax, settings.currency)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black uppercase tracking-tighter">Total Amount</span>
                  <span className="text-5xl font-black">{formatCurrency(total, settings.currency)}</span>
                </div>
             </div>
          </div>
        </div>
        <div className="bg-black text-white py-2 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">SYSTEM GENERATED // NO SIGNATURE REQUIRED</p>
        </div>
      </div>
    );
  }

  // Classic Template (Updated for Indian GST)
  return (
    <div id={`invoice-${invoice.id}`} className="w-[210mm] min-h-[297mm] p-16 bg-white font-serif text-sm">
      <div className="border-[4px] border-black p-8 h-full flex flex-col shadow-[15px_15px_0px_#f3f4f6]">
        <div className="flex justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Tax Invoice</h1>
            <div className="space-y-1 text-xs">
              <p><span className="font-bold">INVOICE NO:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-bold">DATE:</span> {invoice.date}</p>
              <p><span className="font-bold">PLACE OF SUPPLY:</span> {invoice.customerState || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold uppercase">{settings.name}</h2>
            <p className="whitespace-pre-line opacity-70 text-xs">{settings.address}</p>
            <div className="pt-2 text-[10px] font-bold">
              <p>GSTIN: {settings.gstNumber}</p>
              <p>PAN: {settings.panNumber}</p>
            </div>
          </div>
        </div>

        <div className="mb-12 py-6 border-y-2 border-black flex justify-between bg-gray-50/50 px-4">
          <div>
            <p className="text-[10px] font-bold uppercase mb-2 opacity-50">Billed To:</p>
            <p className="text-lg font-bold uppercase">{invoice.customerName}</p>
            <p className="opacity-70 text-xs whitespace-pre-line">{invoice.customerAddress}</p>
            {invoice.customerGSTIN && <p className="mt-2 text-xs font-bold">GSTIN: {invoice.customerGSTIN}</p>}
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold uppercase mb-2 opacity-50">Total Payable:</p>
             <p className="text-4xl font-black">{formatCurrency(total, settings.currency)}</p>
          </div>
        </div>

        <div className="flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-3 text-left uppercase text-[10px] tracking-widest">HSN</th>
                <th className="p-3 text-left uppercase text-[10px] tracking-widest">Description</th>
                <th className="p-3 text-right uppercase text-[10px] tracking-widest w-20">Qty</th>
                <th className="p-3 text-right uppercase text-[10px] tracking-widest w-28">Rate</th>
                <th className="p-3 text-right uppercase text-[10px] tracking-widest w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-black text-xs">
                  <td className="p-4 font-bold">{item.hsnCode || '-'}</td>
                  <td className="p-4">{item.description}</td>
                  <td className="p-4 text-right">{item.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                  <td className="p-4 text-right font-black">{formatCurrency(item.quantity * item.unitPrice, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {invoice.customFields.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-4">
               {invoice.customFields.map((field, idx) => (
                 <div key={idx} className="flex gap-2 text-[10px]">
                   <span className="font-bold underline uppercase">{field.label}:</span>
                   <span>{field.value}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t-4 border-black">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase underline">Bank Information</p>
              <div className="text-[10px] opacity-70 grid grid-cols-2 gap-1">
                <span>Bank Name:</span><span className="font-bold">{settings.bankName}</span>
                <span>A/C No:</span><span className="font-black font-mono">{settings.accountNumber}</span>
                <span>IFSC Code:</span><span className="font-bold">{settings.ifscCode}</span>
                <span>Branch:</span><span>{settings.branchName}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase underline">Declaration</p>
              <p className="text-[9px] italic opacity-60 leading-relaxed">{settings.aboutSection}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs px-2">
              <span className="opacity-50 font-bold uppercase">Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between text-xs px-2">
                <span className="opacity-50 font-bold uppercase">IGST ({settings.defaultTaxRate}%)</span>
                <span className="font-bold">{formatCurrency(tax, settings.currency)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs px-2">
                  <span className="opacity-50 font-bold uppercase">CGST ({settings.defaultTaxRate / 2}%)</span>
                  <span className="font-bold">{formatCurrency(tax / 2, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-xs px-2">
                  <span className="opacity-50 font-bold uppercase">SGST ({settings.defaultTaxRate / 2}%)</span>
                  <span className="font-bold">{formatCurrency(tax / 2, settings.currency)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between bg-black text-white p-5 items-center mt-4">
              <span className="font-black uppercase tracking-tighter">Grand Total</span>
              <span className="text-3xl font-black">{formatCurrency(total, settings.currency)}</span>
            </div>
          </div>
        </div>
        <div className="mt-auto pt-8 text-center border-t-2 border-black/5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">
            This is a system generated invoice and does not require any signature.
          </p>
        </div>
      </div>
    </div>
  );
}

