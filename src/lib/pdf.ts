/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const getPDFBlob = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF Blob:', error);
    throw error;
  }
};

export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateSubtotal = (items: any[]) => {
  return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
};

export const calculateTax = (items: any[], defaultTaxRate: number) => {
  return items.reduce((acc, item) => {
    const rate = item.taxRate !== undefined ? item.taxRate : defaultTaxRate;
    return acc + (item.quantity * item.unitPrice * (rate / 100));
  }, 0);
};

export const calculateTotal = (items: any[], defaultTaxRate: number) => {
  return calculateSubtotal(items) + calculateTax(items, defaultTaxRate);
};
