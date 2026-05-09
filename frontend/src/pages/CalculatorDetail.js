import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { useStore, useCurrency } from '../lib/store';
import { calculatorPrimary } from '../lib/calc';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const TYPE_LABELS = {
  emi: 'EMI / Loan',
  sip: 'SIP / Mutual Fund',
  swp: 'SWP / Systematic Withdrawal',
  compound: 'Compound Interest',
  simple: 'Simple Interest',
};

export default function CalculatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, upsertItem, removeItem } = useStore();
  const { format } = useCurrency();
  const stored = state.calculators.find((c) => c.id === id);
  const [data, setData] = useState(stored || null);

  useEffect(() => { if (stored) setData(stored); }, [stored]);

  const result = useMemo(() => (data ? calculatorPrimary(data) : { primaryLabel: '', primaryValue: 0, all: {} }), [data]);

  if (!data) {
    return (
      <div className="px-5 pt-4">
        <button onClick={() => navigate('/calculators')} className="flex items-center gap-1 text-teal-600"><ArrowLeft size={18} /> Back</button>
        <div className="mt-8 text-gray-400 text-center">Calculator not found</div>
      </div>
    );
  }

  const onSave = () => {
    upsertItem('calculators', data);
    navigate('/calculators');
  };

  const onDelete = () => {
    removeItem('calculators', data.id);
    navigate('/calculators');
  };

  const num = (v) => (v === '' ? '' : Number(v));

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate('/calculators')} className="p-2 -ml-2 text-gray-700 rounded-full hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-gray-900 truncate">{data.label}</div>
          <div className="text-xs text-gray-500">{TYPE_LABELS[data.type]}</div>
        </div>
        <button onClick={onSave} className="p-2 text-teal-600 rounded-full hover:bg-teal-50"><Save size={20} /></button>
      </header>

      <div className="px-5 pt-5 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white p-5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{result.primaryLabel}</div>
          <div className="text-3xl font-extrabold mt-1">{format(result.primaryValue)}</div>
          {data.type === 'emi' && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="opacity-80">Monthly EMI</div><div className="font-semibold">{format(result.all.emi)}</div></div>
              <div><div className="opacity-80">Total Payment</div><div className="font-semibold">{format(result.all.totalPayment)}</div></div>
            </div>
          )}
          {data.type === 'sip' && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="opacity-80">Future Value</div><div className="font-semibold">{format(result.all.futureValue)}</div></div>
              <div><div className="opacity-80">Total Invested</div><div className="font-semibold">{format(result.all.invested)}</div></div>
            </div>
          )}
          {(data.type === 'compound' || data.type === 'simple') && (
            <div className="mt-3 text-sm">
              <div className="opacity-80">Maturity Amount</div><div className="font-semibold">{format(result.all.amount)}</div>
            </div>
          )}
          {data.type === 'swp' && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="opacity-80">Total Withdrawn</div>
                <div className="font-semibold">{format(result.all.totalWithdrawn)}</div>
              </div>
              <div>
                <div className="opacity-80">{result.all.depleted ? 'Status' : 'Final Balance'}</div>
                <div className="font-semibold">{result.all.depleted ? 'Corpus depleted' : format(result.all.finalBalance)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label>Label</Label>
            <Input value={data.label} onChange={(e) => setData({ ...data, label: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {(data.type === 'emi' || data.type === 'compound' || data.type === 'simple') && (
            <div className="grid gap-1.5">
              <Label>Principal Amount</Label>
              <Input type="number" value={data.principal ?? ''} onChange={(e) => setData({ ...data, principal: num(e.target.value) })} />
            </div>
          )}
          {data.type === 'sip' && (
            <div className="grid gap-1.5">
              <Label>Monthly Investment</Label>
              <Input type="number" value={data.monthly ?? ''} onChange={(e) => setData({ ...data, monthly: num(e.target.value) })} />
            </div>
          )}
          {data.type === 'swp' && (
            <>
              <div className="grid gap-1.5">
                <Label>Initial Amount (Corpus)</Label>
                <Input type="number" value={data.initial ?? ''} onChange={(e) => setData({ ...data, initial: num(e.target.value) })} placeholder="e.g., 1000000" />
              </div>
              <div className="grid gap-1.5">
                <Label>Monthly Withdrawal</Label>
                <Input type="number" value={data.monthly ?? ''} onChange={(e) => setData({ ...data, monthly: num(e.target.value) })} placeholder="e.g., 8000" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Annual Rate (%)</Label>
              <Input type="number" step="0.01" value={data.rate ?? ''} onChange={(e) => setData({ ...data, rate: num(e.target.value) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Tenure (years)</Label>
              <Input type="number" step="0.1" value={data.years ?? ''} onChange={(e) => setData({ ...data, years: num(e.target.value) })} />
            </div>
          </div>
          {data.type === 'compound' && (
            <div className="grid gap-1.5">
              <Label>Compounds Per Year</Label>
              <Select value={String(data.compoundsPerYear || 1)} onValueChange={(v) => setData({ ...data, compoundsPerYear: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Annually (1)</SelectItem>
                  <SelectItem value="2">Half-yearly (2)</SelectItem>
                  <SelectItem value="4">Quarterly (4)</SelectItem>
                  <SelectItem value="12">Monthly (12)</SelectItem>
                  <SelectItem value="365">Daily (365)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Button onClick={onSave} className="flex-1 bg-teal-600 hover:bg-teal-700"><Save size={16} className="mr-1" />Save</Button>
          <Button variant="outline" onClick={onDelete} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"><Trash2 size={16} className="mr-1" />Delete</Button>
        </div>
      </div>
    </div>
  );
}
