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
import { Download, Eye, MoreHorizontal, CheckCircle2, Trash2, Files } from 'lucide-react';
import { CompanySettings, InvoiceData, TemplateId } from '../types';
import { formatCurrency, calculateTotal, generatePDF, getPDFBlob } from '../lib/pdf';
import InvoiceTemplate from './InvoiceTemplate';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface InvoiceListProps {
  invoices: InvoiceData[];
  settings: CompanySettings;
  templateId: TemplateId;
  onDeleteInvoice?: (id: string) => void;
  onDeleteAllInvoices?: () => void;
}

export default function InvoiceList({ 
  invoices, 
  settings, 
  templateId, 
  onDeleteInvoice,
  onDeleteAllInvoices 
}: InvoiceListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

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

  const handleDownloadAll = async () => {
    if (invoices.length === 0) return;
    
    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: invoices.length });
    const zip = new JSZip();
    
    try {
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        setDownloadProgress({ current: i + 1, total: invoices.length });
        
        // Update selected invoice for rendering in hidden container
        setSelectedInvoice(invoice);
        
        // Wait for React to render and a tiny bit more for layout/images
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const blob = await getPDFBlob(`invoice-${invoice.id}`);
        zip.file(`${invoice.invoiceNumber}_${invoice.customerName.replace(/[^a-z0-9]/gi, '_')}.pdf`, blob);
        
        // Clear selected invoice to free up element space if needed
        setSelectedInvoice(null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('All invoices downloaded as ZIP!');
    } catch (err) {
      toast.error('Failed to generate ZIP.');
      console.error(err);
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
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
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          Invoice History
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {invoices.length}
          </span>
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full gap-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            onClick={onDeleteAllInvoices}
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full gap-2 border-black/10 hover:bg-black hover:text-white transition-colors"
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
          >
          {isDownloadingAll ? (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Processing ({downloadProgress.current}/{downloadProgress.total})
            </>
          ) : (
            <>
              <Files className="w-4 h-4" />
              Download All (ZIP)
            </>
          )}
        </Button>
      </div>
    </div>
      
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
                    <DialogTrigger 
                      render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full" 
                          onClick={() => setSelectedInvoice(invoice)}
                        />
                      }
                    >
                      <Eye className="w-4 h-4" />
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
      </div>

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
