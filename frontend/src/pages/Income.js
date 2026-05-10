import React, { useMemo, useState } from 'react';
import { Plus, Search, ChevronRight, Trash2, Wallet } from 'lucide-react';
import { useStore, useCurrency, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PageTopBar from '../components/PageTopBar';
import { toast } from 'sonner';

// Day-of-month options for monthly recurring rent / income.
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Render a "5th of every month" style label.
function ordinal(d) {
  const n = Number(d);
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function IncomeThumb() {
  return (
    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
      <Wallet size={26} className="text-emerald-600" strokeWidth={1.8} />
    </div>
  );
}

export default function Income() {
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const incomes = state.incomes || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return incomes;
    return incomes.filter((it) => (it.name || '').toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q));
  }, [search, incomes]);

  const totalMonthly = useMemo(() => incomes.reduce((s, it) => s + (Number(it.amount) || 0), 0), [incomes]);

  const startNew = () => {
    setEditing({ id: '', name: '', day: '1', amount: 0, description: '' });
    setOpen(true);
  };
  const startEdit = (it) => {
    // Backwards-compat: if an old entry has only `date`, derive day from it.
    let day = it.day;
    if (!day && it.date) {
      try { day = String(new Date(it.date).getDate()); } catch (e) { /* noop */ }
    }
    setEditing({ ...it, day: day || '1' });
    setOpen(true);
  };

  const save = () => {
    if (!editing.name.trim()) return;
    const item = {
      ...editing,
      id: editing.id || cryptoId(),
      day: String(editing.day || '1'),
      amount: Number(editing.amount) || 0,
    };
    delete item.date; // drop legacy date field on save
    upsertItem('incomes', item);
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('incomes', id); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <PageTopBar />

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Rent / Income</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors">
          <Plus size={22} />
        </button>
      </div>

      {incomes.length > 0 && (
        <div className="mt-3 rounded-xl bg-teal-50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-wider text-teal-700">Total Monthly Rent / Income</div>
            <div className="text-xl font-bold text-teal-700">{format(totalMonthly)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">Sources</div>
            <div className="text-base font-semibold text-gray-700">{incomes.length}</div>
          </div>
        </div>
      )}

      <div className="mt-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="py-12 text-center text-gray-400">No rent or income entries yet. Tap + to add one.</li>
        )}
        {filtered.map((it) => {
          const dayLabel = it.day
            ? `Day ${ordinal(it.day)} of every month`
            : (it.date ? `Day ${ordinal(new Date(it.date).getDate())} of every month` : '');
          return (
            <li key={it.id}>
              <button onClick={() => startEdit(it)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
                <IncomeThumb />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-900 truncate">{it.name}</div>
                  <div className="text-sm text-gray-500 truncate">{dayLabel}{it.description ? ` \u2022 ${it.description}` : ''}</div>
                  <div className="text-sm mt-0.5 font-semibold text-teal-600">{format(it.amount)}</div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Rent / Income' : 'Add Rent / Income'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g., Apartment Rent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Day of month</Label>
                  <Select
                    value={String(editing.day || '1')}
                    onValueChange={(v) => setEditing({ ...editing, day: v })}
                  >
                    <SelectTrigger data-testid="income-day-select"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      {DAY_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>{ordinal(d)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Amount</Label>
                  <Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Optional details" />
              </div>
            </div>
          )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={save} className="flex-1 bg-teal-600 hover:bg-teal-700">{editing?.id ? 'Save' : 'Add'}</Button>
            {editing?.id && (
              <Button variant="outline" onClick={() => del(editing.id)} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 size={16} className="mr-1" />Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
