/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileJson, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { parseCSV, parseExcel } from '../lib/parser';
import { InvoiceData } from '../types';

interface UploadSectionProps {
  onUploadComplete: (invoices: InvoiceData[]) => void;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error('Invalid file format. Please upload a CSV or Excel file.');
      return;
    }

    setIsProcessing(true);
    try {
      let results: InvoiceData[] = [];
      if (isCSV) {
        results = await parseCSV(file);
      } else {
        results = await parseExcel(file);
      }
      
      if (results.length > 0) {
        onUploadComplete(results);
        toast.success(`Successfully loaded ${results.length} invoices!`);
      } else {
        toast.error('No valid invoice data found in the file.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to process file. Ensure columns follow standard naming (invoice_id, customer_name, quantity, etc.)');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = 'name,address,gstin,item,quantity,price,hsn,date,notes\n';
    const row1 = 'Acme Corp,"123 Business Way, Mumbai",27AAAAA0000A1Z5,Laptop,1,55000,8471,10-05-2024,Standard Warranty\n';
    const row2 = 'Acme Corp,"123 Business Way, Mumbai",27AAAAA0000A1Z5,Mouse,2,500,8471,10-05-2024,\n';
    const row3 = 'Globex Corp,"456 Industrial Blvd, Delhi",07BBBBB1111B2Z6,Consulting,10,2500,9983,12-05-2024,Hourly billing\n';
    
    const blob = new Blob([headers + row1 + row2 + row3], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simplified_gst_invoices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.info('Simplified Sample CSV downloaded');
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Bulk Generator</h1>
        <p className="text-lg text-gray-500">
          Upload your sales data in CSV or Excel format. We'll automatically group records by Invoice ID and handle the calculations.
        </p>
        <Button variant="link" onClick={downloadSample} className="text-black font-semibold">
           Download Sample CSV Template
        </Button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative group cursor-pointer transition-all duration-300 ${
          isDragging ? 'scale-[0.98]' : ''
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={onFileSelect}
          accept=".csv,.xlsx,.xls"
        />
        
        <Card className={`border-2 border-dashed flex flex-col items-center justify-center p-16 space-y-6 bg-white transition-colors h-[400px] ${
          isDragging ? 'border-black bg-black/5' : 'border-gray-200 hover:border-black/20'
        }`}>
          {isProcessing ? (
            <>
              <Loader2 className="w-16 h-16 text-black animate-spin" />
              <div className="text-center">
                <p className="text-xl font-bold">Processing your data...</p>
                <p className="text-gray-500">This will only take a moment.</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center shadow-xl shadow-black/10 transition-transform group-hover:scale-110">
                <Upload className="text-white w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold">Click or drag & drop</p>
                <p className="text-gray-500">Supports .csv, .xlsx, .xls</p>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel Files
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileJson className="w-4 h-4" />
                  CSV Data
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold">Smart Grouping</h3>
          <p className="text-sm text-gray-500">Multiple items with the same 'invoice_id' will automatically be grouped into a single receipt.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
           <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold">Auto Calculate</h3>
          <p className="text-sm text-gray-500">We handle subtotal, tax, and grand totals based on your company settings and per-item rates.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
           <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold">Column Hints</h3>
          <p className="text-sm text-gray-500 italic">Required: name, address, item, quantity, price, hsn. Optional: date (DD-MM-YYYY), gstin, notes.</p>
        </div>
      </div>
    </div>
  );
}
