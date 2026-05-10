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
  // This logic assumes specific column names, or we can try to guess.
  // For a real app, we might want a mapping step.
  // For now, let's look for common names or handle group-by invoice ID.

  const invoicesMap = new Map<string, InvoiceData>();

  data.forEach((row, index) => {
    const id = row.invoice_id || row.InvoiceID || row.id || `inv-${index}`;
    const invoiceNumber = row.invoice_number || row.InvoiceNumber || id;
    
    if (!invoicesMap.has(id)) {
      invoicesMap.set(id, {
        id,
        invoiceNumber,
        date: row.date || row.Date || new Date().toISOString().split('T')[0],
        dueDate: row.due_date || row.DueDate || '',
        customerName: row.customer_name || row.CustomerName || 'Guest',
        customerEmail: row.customer_email || row.CustomerEmail || '',
        customerAddress: row.customer_address || row.CustomerAddress || '',
        items: [],
        customFields: [],
        notes: row.notes || row.Notes || '',
      });
    }

    const invoice = invoicesMap.get(id)!;
    
    // Extract custom fields from other columns
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase();
      const standardKeys = [
        'invoice_id', 'invoiceid', 'id', 'invoice_number', 'invoicenumber',
        'date', 'due_date', 'duedate', 'customer_name', 'customername',
        'customer_email', 'customeremail', 'customer_address', 'customeraddress',
        'description', 'item', 'quantity', 'qty', 'unit_price', 'unitprice', 'price',
        'tax_rate', 'taxrate', 'notes'
      ];
      
      if (!standardKeys.includes(lowerKey)) {
        // If it's not a standard key, it might be a custom field
        const existingField = invoice.customFields.find(f => f.label.toLowerCase() === lowerKey);
        if (!existingField) {
          invoice.customFields.push({
            id: `custom-${key}`,
            label: key,
            value: String(row[key])
          });
        }
      }
    });

    // Add item
    const description = row.description || row.Description || row.item || row.Item || 'Service';
    const quantity = parseFloat(row.quantity || row.Quantity || row.qty || '1');
    const unitPrice = parseFloat(row.unit_price || row.UnitPrice || row.price || '0');
    const taxRate = row.tax_rate || row.TaxRate ? parseFloat(row.tax_rate || row.TaxRate) : undefined;

    invoice.items.push({
      description,
      quantity,
      unitPrice,
      taxRate,
    });
  });

  return Array.from(invoicesMap.values());
};
