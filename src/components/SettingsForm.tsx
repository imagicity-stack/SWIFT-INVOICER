/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CompanySettings, TemplateId } from '../types';
import { Globe, Building2, Landmark, Percent, Receipt, Hash } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
];

const TEMPLATES = [
  { id: 'modern', name: 'Modern Clean', description: 'Minimalist with a sidebar' },
  { id: 'classic', name: 'Classic Invoice', description: 'Standard professional layout' },
  { id: 'minimal', name: 'Ultra Minimal', description: 'Just the essentials' },
  { id: 'bold', name: 'Bold Accent', description: 'High contrast headers' },
];

const INDIAN_STATES = [
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '18', name: 'Assam' },
  { code: '10', name: 'Bihar' },
  { code: '04', name: 'Chandigarh' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '07', name: 'Delhi' },
  { code: '30', name: 'Goa' },
  { code: '24', name: 'Gujarat' },
  { code: '06', name: 'Haryana' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '20', name: 'Jharkhand' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '38', name: 'Ladakh' },
  { code: '31', name: 'Lakshadweep' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '27', name: 'Maharashtra' },
  { code: '14', name: 'Manipur' },
  { code: '17', name: 'Meghalaya' },
  { code: '15', name: 'Mizoram' },
  { code: '13', name: 'Nagaland' },
  { code: '21', name: 'Odisha' },
  { code: '34', name: 'Puducherry' },
  { code: '03', name: 'Punjab' },
  { code: '08', name: 'Rajasthan' },
  { code: '11', name: 'Sikkim' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '16', name: 'Tripura' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '19', name: 'West Bengal' },
];

export default function SettingsForm({ initialSettings, onSave, templateId, onTemplateChange }: SettingsFormProps) {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (stateName: string) => {
    const selected = INDIAN_STATES.find(s => s.name === stateName);
    if (selected) {
      setSettings(prev => ({ 
        ...prev, 
        state: selected.name, 
        addressStateCode: selected.code 
      }));
    }
  };

  const handleSave = () => {
    onSave(settings);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Business Identity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-gray-500" />
              <CardTitle>Business Identity</CardTitle>
            </div>
            <CardDescription>Primary information about your company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={settings.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input 
                  id="logoUrl" 
                  placeholder="https://example.com/logo.png"
                  value={settings.logoUrl || ''} 
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea 
                id="companyAddress" 
                className="min-h-[100px]"
                value={settings.address} 
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input 
                  id="companyEmail" 
                  type="email"
                  value={settings.email} 
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyState">Business State</Label>
                <Select 
                  value={settings.state} 
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger id="companyState">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => (
                      <SelectItem key={s.code} value={s.name}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-gray-500" />
                <Label className="font-semibold">Financial Rules</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default GST Rate (%)</Label>
                  <Input 
                    id="taxRate" 
                    type="number"
                    value={settings.defaultTaxRate} 
                    onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(v) => handleChange('currency', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank & Tax Details */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-5 h-5 text-gray-500" />
              <CardTitle>Bank & Legal Details</CardTitle>
            </div>
            <CardDescription>Payment information for your receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GSTIN (GST Number)</Label>
                <Input 
                  id="gstNumber" 
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={settings.gstNumber} 
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input 
                  id="panNumber" 
                  placeholder="e.g. ABCDE1234F"
                  value={settings.panNumber} 
                  onChange={(e) => handleChange('panNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input 
                  id="bankName" 
                  value={settings.bankName} 
                  onChange={(e) => handleChange('bankName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input 
                  id="accountNumber" 
                  value={settings.accountNumber} 
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input 
                  id="ifsc" 
                  placeholder="e.g. SBIN0001234"
                  value={settings.ifscCode} 
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch Name</Label>
                <Input 
                  id="branch" 
                  placeholder="e.g. Mumbai Main"
                  value={settings.branchName} 
                  onChange={(e) => handleChange('branchName', e.target.value)}
                />
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label htmlFor="about">About / Terms (Footer)</Label>
              <Textarea 
                id="about" 
                placeholder="Notes that appear at the bottom of every receipt..."
                value={settings.aboutSection} 
                onChange={(e) => handleChange('aboutSection', e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 bg-gray-50/50 rounded-b-lg">
            <Button className="w-full bg-black text-white rounded-full h-12" onClick={handleSave}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-8">
        {/* Sequence Config */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-5 h-5 text-gray-500" />
              <CardTitle>Invoice Sequence</CardTitle>
            </div>
            <CardDescription>Control how receipts are numbered.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Number Prefix</Label>
              <Input 
                id="prefix" 
                placeholder="e.g. INV-"
                value={settings.invoicePrefix} 
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextNum">Next Number</Label>
              <Input 
                id="nextNum" 
                type="number"
                value={settings.nextInvoiceNumber} 
                onChange={(e) => handleChange('nextInvoiceNumber', parseInt(e.target.value) || 1)}
              />
            </div>
            <p className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
              The next uploaded batch will start from <span className="font-bold text-black">{settings.invoicePrefix}{settings.nextInvoiceNumber}</span>.
            </p>
          </CardContent>
        </Card>

        {/* Template Selector */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-5 h-5 text-gray-500" />
              <CardTitle>Visual Theme</CardTitle>
            </div>
            <CardDescription>Choose how your receipts look.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTemplateChange(t.id as TemplateId)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    templateId === t.id 
                      ? 'border-black bg-black/5 ring-4 ring-black/5' 
                      : 'border-[#E5E7EB] hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold text-sm">{t.name}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{t.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 italic text-sm text-amber-900 leading-relaxed">
          "The template you select will be applied to all bulk generated receipts instantly. You can always come back and change it before your final download."
        </div>
      </div>
    </div>
  );
}
