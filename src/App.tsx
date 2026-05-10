/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Settings, 
  Download, 
  Trash2, 
  ChevronRight, 
  Check,
  Layout,
  Layers,
  Search,
  PanelLeft,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { CompanySettings, InvoiceData, AppState, TemplateId } from './types';
import SettingsForm from './components/SettingsForm';
import UploadSection from './components/UploadSection';
import InvoiceList from './components/InvoiceList';

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'My Company',
  address: '123 Business Ave, Suite 100\nCity, State 12345',
  email: 'hello@company.com',
  phone: '+1 (555) 000-0000',
  taxNumber: 'TAX-123456',
  aboutSection: 'Thank you for your business. We appreciate your partnership!',
  bankName: 'Global Bank',
  accountNumber: 'XXXX-XXXX-XXXX-1234',
  iban: '',
  swiftCode: '',
  defaultTaxRate: 10,
  currency: 'USD',
  nextInvoiceNumber: 1,
  invoicePrefix: 'INV-'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('swift_storage');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return {
      settings: DEFAULT_SETTINGS,
      templateId: 'modern',
      invoices: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('swift_storage', JSON.stringify(appState));
  }, [appState]);

  const updateSettings = (settings: CompanySettings) => {
    setAppState(prev => ({ ...prev, settings }));
  };

  const updateTemplate = (templateId: TemplateId) => {
    setAppState(prev => ({ ...prev, templateId }));
  };

  const addInvoices = (newInvoices: InvoiceData[]) => {
    let nextNum = appState.settings.nextInvoiceNumber;
    const prefix = appState.settings.invoicePrefix || '';
    
    const numberedInvoices = newInvoices.map(inv => {
      const invoiceNumber = `${prefix}${nextNum}`;
      nextNum++;
      return { ...inv, invoiceNumber };
    });

    setAppState(prev => ({ 
      ...prev, 
      invoices: [...numberedInvoices, ...prev.invoices],
      settings: {
        ...prev.settings,
        nextInvoiceNumber: nextNum
      }
    }));
  };

  const clearInvoices = () => {
    if (confirm('Are you sure you want to clear all invoices?')) {
      setAppState(prev => ({ ...prev, invoices: [] }));
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Swift</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <Button 
            variant={activeTab === 'upload' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 h-11 px-4"
            onClick={() => setActiveTab('upload')}
          >
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
          <Button 
            variant={activeTab === 'invoices' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 h-11 px-4"
            onClick={() => setActiveTab('invoices')}
          >
            <FileText className="w-4 h-4" />
            Invoices
            {appState.invoices.length > 0 && (
              <span className="ml-auto bg-black text-white text-[10px] px-1.5 rounded-full py-0.5">
                {appState.invoices.length}
              </span>
            )}
          </Button>
          <Button 
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 h-11 px-4"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </nav>

        <div className="p-4 mt-auto border-t">
          <Card className="p-4 bg-[#F3F4F6] border-none">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Template</p>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium capitalize">{appState.templateId}</span>
            </div>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FA]">
        {/* Header */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <PanelLeft className="md:hidden w-5 h-5 text-gray-500" />
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search invoices or settings..." 
                className="w-full pl-10 pr-4 py-2 bg-[#F3F4F6] border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="hidden sm:flex rounded-full">
               Help
             </Button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300" />
          </div>
        </header>

        {/* Scrollable Area */}
        <ScrollArea className="flex-1">
          <div className="p-8 max-w-6xl mx-auto space-y-8">
            {activeTab === 'upload' && (
              <UploadSection onUploadComplete={addInvoices} />
            )}
            
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recent Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage and download your generated receipts.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearInvoices}>Clear All</Button>
                    <Button className="bg-black text-white hover:bg-black/90">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                <InvoiceList 
                  invoices={appState.invoices} 
                  settings={appState.settings}
                  templateId={appState.templateId}
                />
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                  <p className="text-gray-500 mt-1">Configure your business identity and document preferences.</p>
                </div>
                <SettingsForm 
                  initialSettings={appState.settings} 
                  onSave={updateSettings}
                  templateId={appState.templateId}
                  onTemplateChange={updateTemplate}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
