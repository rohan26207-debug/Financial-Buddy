import React, { useMemo, useState } from 'react';
import { Plus, Search, Menu, ChevronRight, Trash2, TrendingUp, PieChart, Building2, LineChart, Layers, Coins, Wallet } from 'lucide-react';
import { useStore, useCurrency, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const TYPES = ['Stocks', 'Mutual Funds', 'Real Estate', 'Bonds', 'ETFs', 'Gold', 'SIP', 'Crypto', 'Other'];

function TypeIcon({ type }) {
  const map = {
    Stocks: { Icon: TrendingUp, bg: 'from-blue-50 to-blue-100', fg: 'text-blue-600' },
    'Mutual Funds': { Icon: PieChart, bg: 'from-orange-50 to-orange-100', fg: 'text-orange-600' },
    'Real Estate': { Icon: Building2, bg: 'from-emerald-50 to-emerald-100', fg: 'text-emerald-600' },
    Bonds: { Icon: LineChart, bg: 'from-indigo-50 to-indigo-100', fg: 'text-indigo-600' },
    ETFs: { Icon: Layers, bg: 'from-cyan-50 to-cyan-100', fg: 'text-cyan-600' },
    Gold: { Icon: Coins, bg: 'from-amber-50 to-amber-100', fg: 'text-amber-600' },
    SIP: { Icon: Wallet, bg: 'from-teal-50 to-teal-100', fg: 'text-teal-600' },
  };
  const cfg = map[type] || { Icon: TrendingUp, bg: 'from-gray-100 to-gray-200', fg: 'text-gray-500' };
  const { Icon, bg, fg } = cfg;
  return (
    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <Icon size={26} className={fg} strokeWidth={1.8} />
    </div>
  );
}

export default function Investments() {
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.investments;
    return state.investments.filter((i) => i.name.toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q));
  }, [search, state.investments]);

  const totalCurrent = state.investments.reduce((s, i) => s + (Number(i.currentValue) || 0), 0);
  const totalCost = state.investments.reduce((s, i) => s + (Number(i.costBasis) || 0), 0);

  const startNew = () => { setEditing({ id: '', name: '', type: 'Stocks', currentValue: 0, costBasis: 0, notes: '' }); setOpen(true); };
  const startEdit = (i) => { setEditing(i); setOpen(true); };

  const save = () => {
    if (!editing.name.trim()) { toast.error('Name is required'); return; }
    const item = { ...editing, id: editing.id || cryptoId(), currentValue: Number(editing.currentValue) || 0, costBasis: Number(editing.costBasis) || 0 };
    upsertItem('investments', item);
    toast.success(editing.id ? 'Investment updated' : 'Investment added');
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('investments', id); toast.success('Investment deleted'); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button className="p-2 -ml-2 text-gray-700"><Menu size={22} /></button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Investments</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors">
          <Plus size={22} />
        </button>
      </div>

      {state.investments.length > 0 && (
        <div className="mt-3 rounded-xl bg-teal-50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-wider text-teal-700">Portfolio Value</div>
            <div className="text-xl font-bold text-teal-700">{format(totalCurrent)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">Cost Basis</div>
            <div className="text-base font-semibold text-gray-700">{format(totalCost)}</div>
          </div>
        </div>
      )}

      <div className="mt-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="py-12 text-center text-gray-400">No investments yet.</li>
        )}
        {filtered.map((i) => (
          <li key={i.id}>
            <button onClick={() => startEdit(i)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
              <TypeIcon type={i.type} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-teal-600">{format(i.currentValue)}</div>
                <div className="text-base font-bold text-gray-900 truncate">{i.name}</div>
                <div className="text-sm text-gray-500">{format(i.costBasis)}</div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g., Apple Stocks" />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Current Value</Label>
                  <Input type="number" value={editing.currentValue} onChange={(e) => setEditing({ ...editing, currentValue: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Cost Basis</Label>
                  <Input type="number" value={editing.costBasis} onChange={(e) => setEditing({ ...editing, costBasis: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {editing?.id && (
              <Button variant="outline" onClick={() => del(editing.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 size={16} className="mr-1" />Delete</Button>
            )}
            <Button onClick={save} className="bg-teal-600 hover:bg-teal-700">{editing?.id ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
