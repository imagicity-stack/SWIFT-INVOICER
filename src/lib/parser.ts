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
  const workbook = XLSX.read(buffer, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet) as any[];
  return processRawData(data);
};

const formatDate = (date: any): string => {
  if (!date) return '';

  // Handle Date objects (from XLSX cellDates: true or manual creation)
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Handle Excel serial numbers
  if (typeof date === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + date * 86400000);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';

    // If it's already in DD-MM-YYYY or DD/MM/YYYY
    if (trimmed.match(/^\d{2}[-\/]\d{2}[-\/]\d{4}$/)) {
      return trimmed.replace(/\//g, '-');
    }

    // If it's YYYY-MM-DD (ISO), convert to DD-MM-YYYY
    const isoMatch = trimmed.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
    }
    
    // Attempt to handle other formats via JS Date if possible
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return String(date);
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

    const rawDate = row.date || row.Date || fallbackDate;
    const formattedDate = formatDate(rawDate);
    
    const groupId = row.invoice_id || row.id || `${customerKey}-${formattedDate}`;

    if (!invoicesMap.has(groupId)) {
      invoicesMap.set(groupId, {
        id: groupId,
        invoiceNumber: row.invoice_number || '', // Will be assigned by App state
        date: formattedDate,
        dueDate: formatDate(row.due_date || row.DueDate || ''),
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
