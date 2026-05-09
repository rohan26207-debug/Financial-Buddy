import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Menu, ChevronRight, Pencil, Trash2, Banknote } from 'lucide-react';
import { useStore, useCurrency, formatDateShort, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

function LoanThumb() {
  return (
    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
      <Banknote size={26} className="text-teal-600" strokeWidth={1.8} />
    </div>
  );
}

export default function Loans() {
  const { openDrawer } = useOutletContext();
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.loans;
    return state.loans.filter((l) => l.bank.toLowerCase().includes(q));
  }, [search, state.loans]);

  // Loans summary: totals across all loans
  const totals = useMemo(() => {
    let current = 0, initial = 0, emi = 0;
    for (const l of state.loans) {
      const cur = Number(l.amount) || 0;
      const init = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? cur : Number(l.initialAmount) || 0;
      current += cur;
      initial += init;
      emi += Number(l.emi) || 0;
    }
    return { current, initial, emi };
  }, [state.loans]);

  const startNew = () => { setEditing({ id: '', bank: '', startDate: '', endDate: '', initialAmount: 0, amount: 0, interestRate: 0, emi: 0, notes: '' }); setOpen(true); };
  const startEdit = (l) => {
    const initialAmount = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? l.amount : l.initialAmount;
    setEditing({ ...l, initialAmount });
    setOpen(true);
  };

  const save = () => {
    if (!editing.bank.trim()) { toast.error('Bank name is required'); return; }
    const initialAmount = Number(editing.initialAmount) || 0;
    const currentAmount = Number(editing.amount) || 0;
    const item = {
      ...editing,
      id: editing.id || cryptoId(),
      initialAmount,
      amount: editing.id ? currentAmount : (currentAmount || initialAmount),
      interestRate: Number(editing.interestRate) || 0,
      emi: Number(editing.emi) || 0,
    };
    upsertItem('loans', item);
    toast.success(editing.id ? 'Loan updated' : 'Loan added');
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('loans', id); toast.success('Loan deleted'); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={openDrawer} className="p-2 -ml-2 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200"><Menu size={22} /></button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Loans</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors">
          <Plus size={22} />
        </button>
      </div>

      {state.loans.length > 0 && (
        <div className="mt-3 rounded-xl bg-teal-50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-wider text-teal-700">Total Current Loan</div>
            <div className="text-xl font-bold text-teal-700">{format(totals.current)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">Total EMI</div>
            <div className="text-base font-semibold text-gray-700">{format(totals.emi)}</div>
          </div>
        </div>
      )}

      <div className="mt-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="py-12 text-center text-gray-400">No loans yet. Tap + to add one.</li>
        )}
        {filtered.map((l) => {
          const initialAmount = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? l.amount : l.initialAmount;
          const showSplit = Number(initialAmount) !== Number(l.amount);
          return (
            <li key={l.id}>
              <button onClick={() => startEdit(l)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
                <LoanThumb />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-900 truncate">{l.bank}</div>
                  <div className="text-sm text-gray-500 truncate">{formatDateShort(l.startDate)} to {formatDateShort(l.endDate)}</div>
                  <div className="text-sm mt-0.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate">
                      <span className="font-semibold text-teal-600">{format(l.amount)}</span>
                      {showSplit && <span className="text-gray-400"> of {format(initialAmount)}</span>}
                    </div>
                    {Number(l.emi) > 0 && (
                      <div className="text-gray-500 whitespace-nowrap">
                        EMI <span className="font-semibold text-gray-700">{format(l.emi)}</span>
                      </div>
                    )}
                  </div>
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
            <DialogTitle>{editing?.id ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Bank / Lender</Label>
                <Input value={editing.bank} onChange={(e) => setEditing({ ...editing, bank: e.target.value })} placeholder="e.g., Bank of America" />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Current Loan Amount</Label>
                  <Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} placeholder="Outstanding now" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Initial Loan Amount</Label>
                  <Input type="number" value={editing.initialAmount} onChange={(e) => setEditing({ ...editing, initialAmount: e.target.value })} placeholder="Original loan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
          </DialogBody>
          <DialogFooter>
            <Button onClick={save} className="flex-1 bg-teal-600 hover:bg-teal-700"><Pencil size={16} className="mr-1" />{editing?.id ? 'Save' : 'Add'}</Button>
            {editing?.id && (
              <Button variant="outline" onClick={() => del(editing.id)} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 size={16} className="mr-1" />Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
