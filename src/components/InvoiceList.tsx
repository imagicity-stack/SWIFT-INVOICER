/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Download, Eye, MoreHorizontal, CheckCircle2, Trash2 } from 'lucide-react';
import { CompanySettings, InvoiceData, TemplateId } from '../types';
import { formatCurrency, calculateTotal, generatePDF } from '../lib/pdf';
import InvoiceTemplate from './InvoiceTemplate';
import { toast } from 'sonner';

interface InvoiceListProps {
  invoices: InvoiceData[];
  settings: CompanySettings;
  templateId: TemplateId;
  onDeleteInvoice?: (id: string) => void;
}

export default function InvoiceList({ invoices, settings, templateId, onDeleteInvoice }: InvoiceListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownload = async (invoice: InvoiceData) => {
    setIsDownloading(invoice.id);
    setSelectedInvoice(invoice);
    
    // Smooth delay to ensure DOM is ready if it's the first time
    setTimeout(async () => {
      try {
        await generatePDF(`invoice-${invoice.id}`, `invoice-${invoice.invoiceNumber}.pdf`);
        toast.success(`Invoice ${invoice.invoiceNumber} downloaded!`);
      } catch (err) {
        toast.error('Failed to generate PDF.');
        console.error(err);
      } finally {
        setIsDownloading(null);
      }
    }, 500);
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <Download className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">No invoices generated yet.</p>
        <p className="text-sm text-gray-400">Go to "New Batch" to upload your first file.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[120px] py-4">ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="group cursor-default">
              <TableCell className="font-mono text-xs font-bold text-gray-400 uppercase">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{invoice.customerName}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">
                    {invoice.customerGSTIN ? `GST: ${invoice.customerGSTIN}` : (invoice.customerEmail || 'No Details')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {invoice.date}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  {invoice.items.length} {invoice.items.length === 1 ? 'Item' : 'Items'}
                </span>
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(calculateTotal(invoice.items, settings.defaultTaxRate), settings.currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelectedInvoice(invoice)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                      <DialogHeader className="p-6 border-b">
                        <DialogTitle className="flex items-center gap-2">
                          Receipt Preview
                          <span className="text-xs font-normal text-gray-400">#{invoice.invoiceNumber}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto p-8 bg-gray-100 flex justify-center">
                        <div className="bg-white shadow-xl min-w-[700px] origin-top">
                          <InvoiceTemplate 
                            invoice={invoice} 
                            settings={settings} 
                            templateId={templateId} 
                          />
                        </div>
                      </div>
                      <DialogFooter className="p-6 border-t bg-white">
                        <Button 
                          variant="outline" 
                          className="rounded-full"
                          onClick={() => window.print()}
                        >
                          Print
                        </Button>
                        <Button 
                          className="bg-black text-white hover:bg-black/90 rounded-full"
                          onClick={() => handleDownload(invoice)}
                          disabled={isDownloading === invoice.id}
                        >
                          {isDownloading === invoice.id ? 'Preparing...' : 'Download PDF'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    disabled={isDownloading === invoice.id}
                    onClick={() => handleDownload(invoice)}
                  >
                    <Download className={`w-4 h-4 ${isDownloading === invoice.id ? 'animate-pulse' : ''}`} />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteInvoice?.(invoice.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Hidden container for background generation */}
      <div className="fixed -left-[2000px] top-0 opacity-0 pointer-events-none">
        {selectedInvoice && (
          <InvoiceTemplate 
            invoice={selectedInvoice} 
            settings={settings} 
            templateId={templateId} 
          />
        )}
      </div>
    </div>
  );
}
