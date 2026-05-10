import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useCurrency } from '../lib/store';
import {
  emiSchedule,
  sipSchedule,
  swpSchedule,
  compoundSchedule,
  simpleSchedule,
} from '../lib/calc';

const TYPE_TITLES = {
  emi: 'Loan amortization',
  sip: 'SIP growth',
  swp: 'SWP balance',
  compound: 'Compound interest growth',
  simple: 'Simple interest growth',
};

function ChartFor({ data, lines, xKey, xLabel, formatPlain }) {
  if (!data || data.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-500">No data to plot. Fill the inputs and try again.</div>;
  }
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#374151" label={{ value: xLabel, position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="#374151" tickFormatter={(v) => formatPlain(v, { decimals: 0 })} width={70} />
          <Tooltip
            formatter={(v) => formatPlain(v, { decimals: 0 })}
            labelFormatter={(l) => `${xLabel} ${l}`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((ln) => (
            <Line
              key={ln.dataKey}
              type="monotone"
              dataKey={ln.dataKey}
              name={ln.name}
              stroke={ln.stroke || '#111827'}
              strokeWidth={ln.strokeWidth || 2}
              strokeDasharray={ln.dashed ? '5 4' : undefined}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmiTable({ rows, formatPlain }) {
  if (!rows || rows.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-500">No schedule to show. Fill the loan inputs and try again.</div>;
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="text-left py-2 px-2 font-semibold border-b border-gray-300">Month</th>
            <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Principal</th>
            <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Interest</th>
            <th className="text-right py-2 px-2 font-semibold border-b border-gray-300">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
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
  );
}

export default function CalcChartDialog({ open, onOpenChange, data }) {
  const { formatPlain } = useCurrency();

  const content = useMemo(() => {
    if (!data) return null;
    if (data.type === 'emi') {
      const rows = emiSchedule(data.principal, data.rate, data.years);
      return <EmiTable rows={rows} formatPlain={formatPlain} />;
    }
    if (data.type === 'sip') {
      const rows = sipSchedule(data.monthly, data.rate, data.years);
      return (
        <ChartFor
          data={rows}
          xKey="month"
          xLabel="Month"
          formatPlain={formatPlain}
          lines={[
            { dataKey: 'invested', name: 'Invested', dashed: true },
            { dataKey: 'value', name: 'Value' },
          ]}
        />
      );
    }
    if (data.type === 'swp') {
      const rows = swpSchedule(data.initial, data.monthly, data.rate, data.years);
      return (
        <ChartFor
          data={rows}
          xKey="month"
          xLabel="Month"
          formatPlain={formatPlain}
          lines={[
            { dataKey: 'balance', name: 'Balance' },
            { dataKey: 'withdrawn', name: 'Withdrawn', dashed: true },
          ]}
        />
      );
    }
    if (data.type === 'compound') {
      const rows = compoundSchedule(data.principal, data.rate, data.years, data.compoundsPerYear);
      return (
        <ChartFor
          data={rows}
          xKey="year"
          xLabel="Year"
          formatPlain={formatPlain}
          lines={[{ dataKey: 'value', name: 'Value' }]}
        />
      );
    }
    if (data.type === 'simple') {
      const rows = simpleSchedule(data.principal, data.rate, data.years);
      return (
        <ChartFor
          data={rows}
          xKey="year"
          xLabel="Year"
          formatPlain={formatPlain}
          lines={[{ dataKey: 'value', name: 'Value' }]}
        />
      );
    }
    return null;
  }, [data, formatPlain]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle data-testid="calc-chart-title">{data ? TYPE_TITLES[data.type] || 'Chart' : 'Chart'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div data-testid="calc-chart-body">{content}</div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="flex-1" data-testid="calc-chart-close">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
