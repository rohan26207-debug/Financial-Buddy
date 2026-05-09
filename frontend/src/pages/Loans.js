import React, { useMemo, useState } from 'react';
import { Plus, Search, Menu, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useStore, useCurrency, formatDateShort, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['ACTIVE', 'DEFAULTED', 'PAID', 'PENDING'];

function StatusBadge({ status }) {
  const colors = {
    ACTIVE: 'text-teal-600',
    DEFAULTED: 'text-rose-600',
    PAID: 'text-emerald-600',
    PENDING: 'text-amber-600',
  };
  return <span className={`status-badge uppercase ${colors[status] || 'text-gray-500'}`}>{status}</span>;
}

function LoanThumb({ status }) {
  const tints = {
    ACTIVE: 'from-teal-50 to-teal-100',
    DEFAULTED: 'from-rose-50 to-rose-100',
    PAID: 'from-emerald-50 to-emerald-100',
    PENDING: 'from-amber-50 to-amber-100',
  };
  return <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${tints[status] || 'from-gray-100 to-gray-200'}`} />;
}

export default function Loans() {
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.loans;
    return state.loans.filter((l) => l.bank.toLowerCase().includes(q) || l.status.toLowerCase().includes(q));
  }, [search, state.loans]);

  const startNew = () => { setEditing({ id: '', bank: '', status: 'ACTIVE', startDate: '', endDate: '', amount: 0, interestRate: 0, emi: 0, notes: '' }); setOpen(true); };
  const startEdit = (l) => { setEditing(l); setOpen(true); };

  const save = () => {
    if (!editing.bank.trim()) { toast.error('Bank name is required'); return; }
    const item = { ...editing, id: editing.id || cryptoId(), amount: Number(editing.amount) || 0, interestRate: Number(editing.interestRate) || 0, emi: Number(editing.emi) || 0 };
    upsertItem('loans', item);
    toast.success(editing.id ? 'Loan updated' : 'Loan added');
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('loans', id); toast.success('Loan deleted'); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button className="p-2 -ml-2 text-gray-700"><Menu size={22} /></button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Loans</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors">
          <Plus size={22} />
        </button>
      </div>

      <div className="mt-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="py-12 text-center text-gray-400">No loans yet. Tap + to add one.</li>
        )}
        {filtered.map((l) => (
          <li key={l.id}>
            <button onClick={() => startEdit(l)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
              <LoanThumb status={l.status} />
              <div className="flex-1 min-w-0">
                <StatusBadge status={l.status} />
                <div className="text-base font-bold text-gray-900 truncate">{l.bank}</div>
                <div className="text-sm text-gray-500 truncate">{formatDateShort(l.startDate)} to {formatDateShort(l.endDate)}</div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Bank / Lender</Label>
                <Input value={editing.bank} onChange={(e) => setEditing({ ...editing, bank: e.target.value })} placeholder="e.g., Bank of America" />
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={editing.endDate} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label>Amount ({format(0).replace(/[\d.,\s]/g, '').trim()})</Label>
                  <Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Rate %</Label>
                  <Input type="number" step="0.01" value={editing.interestRate} onChange={(e) => setEditing({ ...editing, interestRate: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>EMI</Label>
                  <Input type="number" value={editing.emi} onChange={(e) => setEditing({ ...editing, emi: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {editing?.id && (
              <Button variant="outline" onClick={() => del(editing.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 size={16} className="mr-1" />Delete</Button>
            )}
            <Button onClick={save} className="bg-teal-600 hover:bg-teal-700"><Pencil size={16} className="mr-1" />{editing?.id ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
