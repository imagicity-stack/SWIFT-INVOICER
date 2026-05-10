/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
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
