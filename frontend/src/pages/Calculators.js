import React, { useMemo, useState } from 'react';
import { Search, Menu, ChevronRight, Plus, Calculator as CalcIcon, Home, Building, PiggyBank, Briefcase, Sprout, Coins, BarChart3, Trash2 } from 'lucide-react';
import { useStore, useCurrency, cryptoId } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import { calculatorPrimary } from '../lib/calc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const CATEGORY_ICONS = [
  { match: /home/i, Icon: Home, bg: 'from-sky-50 to-sky-100', fg: 'text-sky-600' },
  { match: /business/i, Icon: Briefcase, bg: 'from-rose-50 to-rose-100', fg: 'text-rose-600' },
  { match: /personal/i, Icon: PiggyBank, bg: 'from-fuchsia-50 to-fuchsia-100', fg: 'text-fuchsia-600' },
  { match: /microfinance/i, Icon: Coins, bg: 'from-yellow-50 to-yellow-100', fg: 'text-yellow-600' },
  { match: /retirement/i, Icon: Sprout, bg: 'from-cyan-50 to-cyan-100', fg: 'text-cyan-600' },
  { match: /mutual/i, Icon: BarChart3, bg: 'from-indigo-50 to-indigo-100', fg: 'text-indigo-600' },
  { match: /savings/i, Icon: PiggyBank, bg: 'from-pink-50 to-pink-100', fg: 'text-pink-600' },
  { match: /scheme|finance/i, Icon: Sprout, bg: 'from-emerald-50 to-emerald-100', fg: 'text-emerald-600' },
  { match: /emi|loan/i, Icon: Building, bg: 'from-blue-50 to-blue-100', fg: 'text-blue-600' },
];

function CalcThumb({ label }) {
  const cfg = CATEGORY_ICONS.find((c) => c.match.test(label)) || { Icon: CalcIcon, bg: 'from-gray-100 to-gray-200', fg: 'text-gray-500' };
  const { Icon, bg, fg } = cfg;
  return (
    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <Icon size={26} className={fg} strokeWidth={1.8} />
    </div>
  );
}

const TYPES = [
  { value: 'emi', label: 'EMI / Loan' },
  { value: 'sip', label: 'SIP / Mutual Fund' },
  { value: 'compound', label: 'Compound Interest' },
  { value: 'simple', label: 'Simple Interest' },
];

export default function Calculators() {
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.calculators;
    return state.calculators.filter((c) => c.label.toLowerCase().includes(q));
  }, [search, state.calculators]);

  const startNew = () => { setEditing({ id: '', type: 'emi', label: '', principal: 10000, rate: 8, years: 5, monthly: 1000, compoundsPerYear: 12 }); setOpen(true); };

  const save = () => {
    if (!editing.label.trim()) { toast.error('Label is required'); return; }
    upsertItem('calculators', { ...editing, id: editing.id || cryptoId() });
    toast.success('Calculator added');
    setOpen(false); setEditing(null);
  };

  const del = (id, e) => { e.stopPropagation(); removeItem('calculators', id); toast.success('Calculator removed'); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button className="p-2 -ml-2 text-gray-700"><Menu size={22} /></button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Financial Calculators</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors flex-shrink-0 ml-3">
          <Plus size={22} />
        </button>
      </div>

      <div className="mt-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.map((c) => {
          const r = calculatorPrimary(c);
          return (
            <li key={c.id}>
              <button onClick={() => navigate('/calculators/' + c.id)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
                <CalcThumb label={c.label} />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-900 truncate">{c.label}</div>
                  <div className="text-sm text-gray-500 truncate">{r.primaryLabel}: {format(r.primaryValue, { decimals: 0 })}</div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Calculator</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Label</Label>
                <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g., Car Loan EMI" />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500">You can fine-tune all values inside the calculator after creating it.</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={save} className="bg-teal-600 hover:bg-teal-700">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
