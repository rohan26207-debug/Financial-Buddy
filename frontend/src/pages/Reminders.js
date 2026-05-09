import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Menu, ChevronRight, Trash2 } from 'lucide-react';
import { useStore, formatDateShort, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

export default function Reminders() {
  const { openDrawer } = useOutletContext();
  const { state, upsertItem, removeItem } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.reminders;
    return state.reminders.filter((r) => r.title.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
  }, [search, state.reminders]);

  const startNew = () => { setEditing({ id: '', title: '', date: '', note: '', done: false }); setOpen(true); };
  const startEdit = (r) => { setEditing(r); setOpen(true); };

  const toggleDone = (e, r) => {
    e.stopPropagation();
    upsertItem('reminders', { ...r, done: !r.done });
  };

  const save = () => {
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    const item = { ...editing, id: editing.id || cryptoId() };
    upsertItem('reminders', item);
    toast.success(editing.id ? 'Reminder updated' : 'Reminder added');
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('reminders', id); toast.success('Reminder deleted'); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={openDrawer} className="p-2 -ml-2 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200"><Menu size={22} /></button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Daily Reminders</h1>
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
          <li className="py-12 text-center text-gray-400">No reminders yet.</li>
        )}
        {filtered.map((r) => (
          <li key={r.id}>
            <button onClick={() => startEdit(r)} className="tap-row w-full flex items-start gap-3 py-3 text-left">
              <button
                onClick={(e) => toggleDone(e, r)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${r.done ? 'bg-teal-600 border-teal-600' : 'border-teal-500 bg-white hover:bg-teal-50'}`}
              >
                {r.done && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-base font-bold ${r.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{r.title}</div>
                <div className="text-sm text-gray-500">
                  {formatDateShort(r.date)}{r.note ? ` \u2022 ${r.note}` : ''}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 mt-1" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g., Pay credit card bill" />
              </div>
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Note</Label>
                <Textarea rows={3} value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Optional details" />
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
