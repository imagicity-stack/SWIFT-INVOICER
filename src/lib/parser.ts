/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { InvoiceData, InvoiceItem } from '@/src/types';

export const parseCSV = (file: File): Promise<InvoiceData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const invoices = processRawData(data);
        resolve(invoices);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const parseExcel = async (file: File): Promise<InvoiceData[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet) as any[];
  return processRawData(data);
};

const processRawData = (data: any[]): InvoiceData[] => {
  const invoicesMap = new Map<string, InvoiceData>();

  data.forEach((row, index) => {
    // Generate a group ID if not provided (assume same customer/date rows belong together)
    const customerKey = row.name || row.customer_name || row.Customer || row.Party;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const fallbackDate = `${day}-${month}-${year}`;

    const dateKey = row.date || row.Date || fallbackDate;
    const groupId = row.invoice_id || row.id || `${customerKey}-${dateKey}`;

    if (!invoicesMap.has(groupId)) {
      invoicesMap.set(groupId, {
        id: groupId,
        invoiceNumber: row.invoice_number || '', // Will be assigned by App state
        date: dateKey,
        dueDate: row.due_date || row.DueDate || '',
        customerName: customerKey || 'Guest',
        customerEmail: row.email || row.customer_email || '',
        customerAddress: row.address || row.customer_address || '',
        customerGSTIN: row.gstin || row.GSTIN || row.customer_gstin || '',
        items: [],
        customFields: [],
        notes: row.notes || row.Notes || '',
      });
    }

    const invoice = invoicesMap.get(groupId)!;
    
    // Add item
    const description = row.item || row.Item || row.description || row.Description || 'Service';
    const quantity = parseFloat(row.quantity || row.Quantity || row.qty || '1');
    const unitPrice = parseFloat(row.unit_price || row.UnitPrice || row.price || row.Price || '0');
    const hsnCode = String(row.hsn || row.HSN || row.hsn_code || row.hsncode || '');
    const taxValue = row.tax_rate || row.TaxRate || row.gst_rate || row.gstrate;
    const taxRate = taxValue ? parseFloat(taxValue) : null;

    invoice.items.push({
      description,
      hsnCode,
      quantity,
      unitPrice,
      taxRate: taxRate ?? undefined, // TypeScript might want undefined, but we'll strip it before Firestore
    });
  });

  // Clean up any undefined values before returning (Firestore doesn't like them)
  return Array.from(invoicesMap.values()).map(inv => JSON.parse(JSON.stringify(inv)));
};
