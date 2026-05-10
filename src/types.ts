/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanySettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl?: string;
  taxNumber: string;
  aboutSection: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  defaultTaxRate: number;
  currency: string;
  nextInvoiceNumber: number;
  invoicePrefix: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  items: InvoiceItem[];
  customFields: CustomField[];
  notes?: string;
}

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'bold';

export interface AppState {
  settings: CompanySettings;
  templateId: TemplateId;
  invoices: InvoiceData[];
}
