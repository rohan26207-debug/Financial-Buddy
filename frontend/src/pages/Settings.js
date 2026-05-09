import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, Download, Upload, RefreshCw, Globe, Info, Wallet, Database, ChevronRight } from 'lucide-react';
import { useStore, CURRENCIES } from '../lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { toast } from 'sonner';

function Section({ title, children }) {
  return (
    <div className="mt-6">
      <h2 className="px-1 text-[11px] uppercase tracking-wider font-semibold text-gray-500">{title}</h2>
      <div className="mt-2 bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, subtitle, right, onClick, danger }) {
  return (
    <button onClick={onClick} className={`tap-row w-full flex items-center gap-3 px-4 py-3 text-left ${danger ? 'text-rose-600' : 'text-gray-900'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
      {right || <ChevronRight size={18} className="text-gray-300" />}
    </button>
  );
}

export default function Settings() {
  const { openDrawer } = useOutletContext();
  const { state, updateSettings, exportData, importData, resetData } = useStore();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const counts = {
    loans: state.loans.length,
    investments: state.investments.length,
    reminders: state.reminders.length,
    todos: state.todos.length,
    calculators: state.calculators.length,
  };

  const onExport = () => {
    try {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `finance-buddy-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData());
      toast.success('Backup copied to clipboard');
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      importData(text);
      toast.success('Backup imported');
    } catch (err) {
      toast.error('Invalid backup file');
    } finally {
      setImporting(false);
    }
  };

  const onPasteImport = async () => {
    try {
      const text = window.prompt('Paste backup JSON here');
      if (!text) return;
      importData(text);
      toast.success('Backup imported');
    } catch (e) {
      toast.error('Invalid JSON');
    }
  };

  const onReset = () => {
    resetData();
    toast.success('All data reset to defaults');
  };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={openDrawer} className="p-2 -ml-2 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200"><Menu size={22} /></button>
      </div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>

      <Section title="Preferences">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Globe size={18} /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Currency</div>
            <div className="text-xs text-gray-500">Used across all amounts</div>
          </div>
          <Select value={state.settings.currency} onValueChange={(v) => updateSettings({ currency: v })}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Backup & Restore">
        <Row icon={Download} title="Export Backup" subtitle="Download all data as JSON file" onClick={onExport} />
        <Row icon={Wallet} title="Copy Backup Data" subtitle="Copy JSON to clipboard" onClick={onCopy} />
        <Row icon={Upload} title="Import Backup" subtitle="Restore from a JSON file" onClick={onImportClick} />
        <Row icon={Database} title="Paste & Import" subtitle="Paste JSON to restore" onClick={onPasteImport} />
        <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={onFileChosen} />
      </Section>

      <Section title="Data Summary">
        <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
          <div><div className="text-lg font-bold text-teal-600">{counts.loans}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Loans</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.investments}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Investments</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.reminders}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Reminders</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.todos}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Tasks</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.calculators}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Calculators</div></div>
          <div><div className="text-lg font-bold text-teal-600">100%</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Offline</div></div>
        </div>
      </Section>

      <Section title="Danger Zone">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="tap-row w-full flex items-center gap-3 px-4 py-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><RefreshCw size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-rose-600">Reset All Data</div>
                <div className="text-xs text-gray-500">Restores demo seed data</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all data?</AlertDialogTitle>
              <AlertDialogDescription>This will erase all your loans, investments, reminders, tasks, and calculators, and replace them with the default demo data. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onReset} className="bg-rose-600 hover:bg-rose-700">Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <Section title="About">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Info size={18} /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Finance Buddy</div>
            <div className="text-xs text-gray-500">v1.0.0 • Offline-first PWA</div>
          </div>
        </div>
      </Section>

      <div className="mt-6 mb-4 text-center text-[11px] text-gray-400">All your data stays on this device.</div>
    </div>
  );
}
