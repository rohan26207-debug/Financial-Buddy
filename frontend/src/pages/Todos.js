import React, { useMemo, useState } from 'react';
import { Plus, Search, Menu, ChevronRight, Trash2, Check } from 'lucide-react';
import { useStore, formatDateShort, cryptoId } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const PRIORITIES = ['High', 'Medium', 'Low'];
const priorityColor = { High: 'text-rose-600', Medium: 'text-amber-600', Low: 'text-emerald-600' };

export default function Todos() {
  const { state, upsertItem, removeItem } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.todos.filter((t) => {
      if (filter === 'open' && t.done) return false;
      if (filter === 'done' && !t.done) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.priority.toLowerCase().includes(q);
    });
  }, [search, state.todos, filter]);

  const startNew = () => { setEditing({ id: '', title: '', priority: 'Medium', due: '', done: false }); setOpen(true); };
  const startEdit = (t) => { setEditing(t); setOpen(true); };

  const toggleDone = (e, t) => { e.stopPropagation(); upsertItem('todos', { ...t, done: !t.done }); };

  const save = () => {
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    upsertItem('todos', { ...editing, id: editing.id || cryptoId() });
    toast.success(editing.id ? 'Task updated' : 'Task added');
    setOpen(false); setEditing(null);
  };

  const del = (id) => { removeItem('todos', id); toast.success('Task deleted'); setOpen(false); setEditing(null); };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <button className="p-2 -ml-2 text-gray-700"><Menu size={22} /></button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Daily Tasks</h1>
        <button onClick={startNew} className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white flex items-center justify-center shadow-md transition-colors">
          <Plus size={22} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/40" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px] rounded-xl bg-gray-100 border-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="py-12 text-center text-gray-400">No tasks here.</li>
        )}
        {filtered.map((t) => (
          <li key={t.id}>
            <button onClick={() => startEdit(t)} className="tap-row w-full flex items-center gap-3 py-3 text-left">
              <button
                onClick={(e) => toggleDone(e, t)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${t.done ? 'bg-teal-600 border-teal-600' : 'border-teal-500 bg-white hover:bg-teal-50'}`}
              >
                {t.done && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-base font-bold ${t.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</div>
                <div className="text-sm text-gray-500">
                  <span className={`font-semibold ${priorityColor[t.priority] || 'text-gray-500'}`}>{t.priority}</span>
                  {t.due ? ` \u2022 Due: ${formatDateShort(t.due)}` : ''}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g., Submit assignment" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={editing.due} onChange={(e) => setEditing({ ...editing, due: e.target.value })} />
                </div>
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
