import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore, useCurrency } from '../lib/store';
import {
  calculatorPrimary,
  emiSchedule,
  sipSchedule,
  swpSchedule,
  compoundSchedule,
  simpleSchedule,
} from '../lib/calc';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
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
  const { format, formatPlain } = useCurrency();
  const stored = state.calculators.find((c) => c.id === id);
  const [data, setData] = useState(stored || null);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => { if (stored) setData(stored); }, [stored]);

  const result = useMemo(() => (data ? calculatorPrimary(data) : { primaryLabel: '', primaryValue: 0, all: {} }), [data]);

  // Schedule / chart data derived from the current inputs.
  const scheduleRows = useMemo(() => {
    if (!data) return [];
    if (data.type === 'emi') return emiSchedule(data.principal, data.rate, data.years);
    if (data.type === 'sip') return sipSchedule(data.monthly, data.rate, data.years);
    if (data.type === 'swp') return swpSchedule(data.initial, data.monthly, data.rate, data.years);
    if (data.type === 'compound') return compoundSchedule(data.principal, data.rate, data.years, data.compoundsPerYear);
    if (data.type === 'simple') return simpleSchedule(data.principal, data.rate, data.years);
    return [];
  }, [data]);

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
          <Button onClick={onSave} className="flex-1 bg-teal-600 hover:bg-teal-700" data-testid="calc-save-btn"><Save size={16} className="mr-1" />Save</Button>
          <Button variant="outline" onClick={onDelete} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50" data-testid="calc-delete-btn"><Trash2 size={16} className="mr-1" />Delete</Button>
        </div>

        <Button
          variant="outline"
          onClick={() => setChartOpen((v) => !v)}
          className="w-full mt-3 border-gray-300 text-gray-800 hover:bg-gray-100"
          data-testid="calc-show-chart-btn"
        >
          <BarChart3 size={16} className="mr-1" />
          {chartOpen ? 'Hide ' : 'Show '}{data.type === 'emi' ? 'schedule' : 'chart'}
          {chartOpen ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </Button>

        {chartOpen && (
          <div className="mt-4" data-testid="calc-schedule-inline">
            {scheduleRows.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">Fill the inputs above to see {data.type === 'emi' ? 'the schedule' : 'the chart'}.</div>
            ) : data.type === 'emi' ? (
              <div className="overflow-x-auto -mx-1 max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr className="text-gray-700">
                      <th className="text-left py-2 px-2 font-semibold border-b border-gray-300">Month</th>
                      <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Principal</th>
                      <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Interest</th>
                      <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows.map((r) => (
                      <tr key={r.month} className="border-b border-gray-100">
                        <td className="py-1.5 px-2 text-gray-800">{r.month}</td>
                        <td className="py-1.5 px-2 text-right text-gray-800">{formatPlain(r.principal, { decimals: 0 })}</td>
                        <td className="py-1.5 px-2 text-right text-gray-800">{formatPlain(r.interest, { decimals: 0 })}</td>
                        <td className="py-1.5 px-2 text-right text-gray-800">{formatPlain(r.balance, { decimals: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="w-full h-[280px] border border-gray-200 rounded-lg p-2 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scheduleRows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis
                      dataKey={data.type === 'compound' || data.type === 'simple' ? 'year' : 'month'}
                      tick={{ fontSize: 11 }}
                      stroke="#374151"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#374151" tickFormatter={(v) => formatPlain(v, { decimals: 0 })} width={70} />
                    <Tooltip formatter={(v) => formatPlain(v, { decimals: 0 })} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {data.type === 'sip' && (
                      <>
                        <Line type="monotone" dataKey="invested" name="Invested" stroke="#374151" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="value" name="Value" stroke="#111827" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </>
                    )}
                    {data.type === 'swp' && (
                      <>
                        <Line type="monotone" dataKey="balance" name="Balance" stroke="#111827" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="withdrawn" name="Withdrawn" stroke="#374151" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </>
                    )}
                    {(data.type === 'compound' || data.type === 'simple') && (
                      <Line type="monotone" dataKey="value" name="Value" stroke="#111827" strokeWidth={2} dot={false} isAnimationActive={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
