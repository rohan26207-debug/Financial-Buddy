import React, { useState } from 'react';
import { RefreshCw, Globe, Info, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import { useStore, CURRENCIES } from '../lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../components/ui/dialog';
import PageTopBar from '../components/PageTopBar';

const RESET_PASSWORD = '123456';

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
  const { state, updateSettings, resetData } = useStore();

  const [resetOpen, setResetOpen] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [pwd, setPwd] = useState('');
  const canReset = confirmCheck && pwd === RESET_PASSWORD;

  const counts = {
    loans: state.loans.length,
    investments: state.investments.length,
    incomes: (state.incomes || []).length,
    reminders: state.reminders.length,
    todos: state.todos.length,
  };

  const openReset = () => { setConfirmCheck(false); setPwd(''); setResetOpen(true); };

  const onConfirmReset = () => {
    if (!canReset) return;
    resetData();
    setResetOpen(false);
  };

  return (
    <div className="px-5 pt-4">
      <PageTopBar />
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

      <Section title="Data Summary">
        <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
          <div><div className="text-lg font-bold text-teal-600">{counts.investments}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Invest</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.incomes}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Income</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.loans}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Loans</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.todos}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Tasks</div></div>
          <div><div className="text-lg font-bold text-teal-600">{counts.reminders}</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Reminders</div></div>
          <div><div className="text-lg font-bold text-teal-600">100%</div><div className="text-[11px] uppercase tracking-wider text-gray-500">Offline</div></div>
        </div>
      </Section>

      <Section title="Danger Zone">
        <Row
          icon={RefreshCw}
          title="Reset All Data"
          subtitle="Erase everything; replace with empty data"
          onClick={openReset}
          danger
        />
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

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600" />
              Reset All Data
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <p className="text-sm text-gray-600">
                This will permanently erase every loan, investment, rent/income entry, reminder, task, calculator, and contact info on this device. The app will start with a clean, empty state.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <Checkbox
                  checked={confirmCheck}
                  onCheckedChange={(v) => setConfirmCheck(!!v)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I understand all my data will be permanently erased and cannot be recovered.
                </span>
              </label>
              <div className="grid gap-1.5">
                <Label className="text-xs flex items-center gap-1.5 text-gray-500">
                  <Lock size={12} /> Enter password to confirm
                </Label>
                <Input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="Password"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <p className="text-[11px] text-gray-400">Required to enable the Reset button.</p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmReset}
              disabled={!canReset}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:hover:bg-rose-600"
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
