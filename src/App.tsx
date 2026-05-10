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
  Briefcase,
  LogOut,
  Loader2
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { CompanySettings, InvoiceData, AppState, TemplateId } from './types';
import SettingsForm from './components/SettingsForm';
import UploadSection from './components/UploadSection';
import InvoiceList from './components/InvoiceList';
import Auth from './components/Auth';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'My Business Name',
  address: '123, Business Tower\nMumbai, Maharashtra 400001',
  email: 'billing@business.com',
  phone: '+91 99999 99999',
  gstNumber: '',
  panNumber: '',
  state: 'Maharashtra',
  addressStateCode: '27',
  aboutSection: 'Thank you for your business. This is a computer generated invoice.',
  bankName: 'HDFC Bank',
  accountNumber: '50100XXXXXXX',
  ifscCode: 'HDFC0000001',
  branchName: 'Mumbai Main',
  defaultTaxRate: 18,
  currency: 'INR',
  nextInvoiceNumber: 1,
  invoicePrefix: 'INV-'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [appState, setAppState] = useState<AppState>({
    settings: DEFAULT_SETTINGS,
    templateId: 'modern',
    invoices: [],
  });

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (!user) {
        setIsLoadingSettings(false);
      }
    });
    return unsubscribe;
  }, []);

  // Handle Firestore Data Sync (User Settings)
  useEffect(() => {
    if (!currentUser) return;

    setIsLoadingSettings(true);
    const userDocRef = doc(db, 'swift_users', currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppState(prev => ({
          ...prev,
          settings: data.settings || DEFAULT_SETTINGS,
          templateId: data.templateId || 'modern'
        }));
      } else {
        // Init user doc with default settings
        setDoc(userDocRef, {
          settings: DEFAULT_SETTINGS,
          templateId: 'modern'
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `swift_users/${currentUser.uid}`));
      }
      setIsLoadingSettings(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `swift_users/${currentUser.uid}`);
      setIsLoadingSettings(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Handle Firestore Data Sync (Invoices)
  useEffect(() => {
    if (!currentUser) return;

    const invoicesCol = collection(db, 'swift_users', currentUser.uid, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as InvoiceData[];
      
      setAppState(prev => ({
        ...prev,
        invoices
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `swift_users/${currentUser.uid}/invoices`);
    });

    return unsubscribe;
  }, [currentUser]);

  const updateSettings = async (settings: CompanySettings) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'swift_users', currentUser.uid), {
        settings,
        templateId: appState.templateId
      }, { merge: true });
      setAppState(prev => ({ ...prev, settings }));
      toast.success('Settings saved to cloud');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swift_users/${currentUser.uid}`);
    }
  };

  const updateTemplate = async (templateId: TemplateId) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'swift_users', currentUser.uid), {
        templateId
      }, { merge: true });
      setAppState(prev => ({ ...prev, templateId }));
      toast.success('Template updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swift_users/${currentUser.uid}`);
    }
  };

  const addInvoices = async (newInvoices: InvoiceData[]) => {
    if (!currentUser) return;

    let nextNum = appState.settings.nextInvoiceNumber;
    const prefix = appState.settings.invoicePrefix || '';
    
    setIsLoadingSettings(true);
    try {
      const invoicesCol = collection(db, 'swift_users', currentUser.uid, 'invoices');
      const batch = writeBatch(db);

      for (const inv of newInvoices) {
        const invoiceNumber = `${prefix}${nextNum}`;
        const newInvoiceData = {
          ...inv,
          invoiceNumber,
          createdAt: serverTimestamp()
        };
        
        const newDocRef = doc(invoicesCol);
        batch.set(newDocRef, newInvoiceData);
        nextNum++;
      }

      // Update settings with next number
      const userDocRef = doc(db, 'swift_users', currentUser.uid);
      const newSettings = {
        ...appState.settings,
        nextInvoiceNumber: nextNum
      };
      batch.update(userDocRef, { settings: newSettings });

      await batch.commit();
      setAppState(prev => ({ ...prev, settings: newSettings }));
      toast.success(`Successfully generated ${newInvoices.length} invoices`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swift_users/${currentUser.uid}/invoices`);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const clearInvoices = async () => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to clear all invoices from the cloud?')) {
      setIsLoadingSettings(true);
      try {
        const invoicesCol = collection(db, 'swift_users', currentUser.uid, 'invoices');
        const snapshot = await getDocs(invoicesCol);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        toast.info('Invoice list cleared from cloud');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `swift_users/${currentUser.uid}/invoices`);
      } finally {
        setIsLoadingSettings(false);
      }
    }
  };

  const removeInvoice = async (invoiceId: string) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'swift_users', currentUser.uid, 'invoices', invoiceId);
      await deleteDoc(docRef);
      toast.info('Invoice deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `swift_users/${currentUser.uid}/invoices/${invoiceId}`);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    toast.info('Signed out');
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Swift Invo</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
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
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold ring-1 ring-black/10">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{currentUser.email}</p>
              <button 
                onClick={handleLogout}
                className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors outline-none"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
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
             {isLoadingSettings && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
             <Button variant="outline" size="sm" className="hidden sm:flex rounded-full">
               Help
             </Button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300" />
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
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
                    <Button variant="outline" onClick={clearInvoices} className="rounded-full">Clear All</Button>
                    <Button className="bg-black text-white hover:bg-black/90 rounded-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                <InvoiceList 
                  invoices={appState.invoices} 
                  settings={appState.settings}
                  templateId={appState.templateId}
                  onDeleteInvoice={removeInvoice}
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
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
