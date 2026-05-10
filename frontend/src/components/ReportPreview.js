import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useStore, useCurrency } from '../lib/store';

/**
 * ReportPreview
 * -------------
 * On-screen "V" view of the same data the PDF report renders.
 * Sections mirror /app/frontend/src/lib/pdf.js exactly so users
 * can see what they will get before sharing the PDF.
 */
function fmtNum(formatPlain, v) { return formatPlain(v, { decimals: 2 }); }

function incomeDay(it) {
  if (it.day) return String(it.day);
  if (it.date) {
    try { return String(new Date(it.date).getDate()); } catch (e) { return ''; }
  }
  return '';
}

const Th = ({ children, align = 'left' }) => (
  <th
    className={`py-2 px-2 font-semibold border-b border-black bg-white text-${align}`}
    style={{ textAlign: align }}
  >
    {children}
  </th>
);

const Td = ({ children, align = 'left', muted = false }) => (
  <td
    className={`py-1.5 px-2 border-b border-gray-200 ${muted ? 'text-gray-500 italic' : 'text-gray-900'}`}
    style={{ textAlign: align }}
  >
    {children}
  </td>
);

const Tf = ({ children, align = 'left' }) => (
  <td
    className="py-2 px-2 font-semibold border-t-2 border-black bg-gray-50"
    style={{ textAlign: align }}
  >
    {children}
  </td>
);

function Section({ title, children }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-2">{title}</h3>
      <div className="overflow-x-auto -mx-1 border border-gray-300 rounded">
        <table className="w-full text-xs border-collapse">{children}</table>
      </div>
    </section>
  );
}

export default function ReportPreview({ open, onOpenChange }) {
  const { state } = useStore();
  const { formatPlain } = useCurrency();
  const contact = state.contact || {};
  const investments = state.investments || [];
  const incomes = state.incomes || [];
  const loans = state.loans || [];

  const totalCurrent = investments.reduce((s, i) => s + (Number(i.currentValue) || 0), 0);
  const totalCost = investments.reduce((s, i) => s + (Number(i.costBasis) || 0), 0);
  const totalGain = totalCurrent - totalCost;

  const totalIncome = incomes.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const totalLoanCurrent = loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalLoanEmi = loans.reduce((s, l) => s + (Number(l.emi) || 0), 0);

  const generatedAt = new Date().toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] sm:max-w-[640px] rounded-2xl">
        <DialogHeader>
          <DialogTitle data-testid="report-preview-title">Report preview</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="bg-white text-gray-900" data-testid="report-preview-body">
            {/* Header that mirrors the PDF cover */}
            <header className="border-b-2 border-black pb-3">
              <div className="text-2xl font-extrabold tracking-tight">Finance Buddy</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Generated {generatedAt}</div>
              {(contact.name || contact.email || contact.phone) && (
                <div className="text-xs text-gray-700 mt-1">
                  {[contact.name, contact.email, contact.phone].filter(Boolean).join(' \u2022 ')}
                </div>
              )}
            </header>

            {/* Investments */}
            <Section title="Investments">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th align="right">Cost Basis</Th>
                  <Th align="right">Current Value</Th>
                  <Th align="right">Gain / Loss</Th>
                </tr>
              </thead>
              <tbody>
                {investments.length === 0 ? (
                  <tr><Td muted align="center" colSpan={5}><span className="block text-center" >No investments recorded.</span></Td></tr>
                ) : investments.map((i) => (
                  <tr key={i.id}>
                    <Td>{i.name || ''}</Td>
                    <Td>{i.type || ''}</Td>
                    <Td align="right">{fmtNum(formatPlain, i.costBasis)}</Td>
                    <Td align="right">{fmtNum(formatPlain, i.currentValue)}</Td>
                    <Td align="right">{fmtNum(formatPlain, (Number(i.currentValue) || 0) - (Number(i.costBasis) || 0))}</Td>
                  </tr>
                ))}
              </tbody>
              {investments.length > 0 && (
                <tfoot>
                  <tr>
                    <Tf align="right">Totals</Tf>
                    <Tf />
                    <Tf align="right">{fmtNum(formatPlain, totalCost)}</Tf>
                    <Tf align="right">{fmtNum(formatPlain, totalCurrent)}</Tf>
                    <Tf align="right">{fmtNum(formatPlain, totalGain)}</Tf>
                  </tr>
                </tfoot>
              )}
            </Section>

            {/* Rent / Income */}
            <Section title="Rent / Income">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th align="center">Day</Th>
                  <Th align="right">Amount</Th>
                  <Th>Description</Th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr><Td muted align="center" colSpan={4}>No rent or income entries recorded.</Td></tr>
                ) : incomes.map((it) => (
                  <tr key={it.id}>
                    <Td>{it.name || ''}</Td>
                    <Td align="center">{incomeDay(it)}</Td>
                    <Td align="right">{fmtNum(formatPlain, it.amount)}</Td>
                    <Td>{it.description || ''}</Td>
                  </tr>
                ))}
              </tbody>
              {incomes.length > 0 && (
                <tfoot>
                  <tr>
                    <Tf align="right">Total Monthly Rent / Income</Tf>
                    <Tf />
                    <Tf align="right">{fmtNum(formatPlain, totalIncome)}</Tf>
                    <Tf />
                  </tr>
                </tfoot>
              )}
            </Section>

            {/* Loans */}
            <Section title="Loans">
              <thead>
                <tr>
                  <Th>Bank / Lender</Th>
                  <Th align="right">Current</Th>
                  <Th align="right">Rate %</Th>
                  <Th align="right">EMI</Th>
                  <Th align="center">EMI Day</Th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr><Td muted align="center" colSpan={5}>No loans recorded.</Td></tr>
                ) : loans.map((l) => (
                  <tr key={l.id}>
                    <Td>{l.bank || ''}</Td>
                    <Td align="right">{fmtNum(formatPlain, l.amount)}</Td>
                    <Td align="right">{(Number(l.interestRate) || 0).toFixed(2)}%</Td>
                    <Td align="right">{fmtNum(formatPlain, l.emi)}</Td>
                    <Td align="center">{l.emiDay || ''}</Td>
                  </tr>
                ))}
              </tbody>
              {loans.length > 0 && (
                <tfoot>
                  <tr>
                    <Tf align="right">Totals</Tf>
                    <Tf align="right">{fmtNum(formatPlain, totalLoanCurrent)}</Tf>
                    <Tf />
                    <Tf align="right">{fmtNum(formatPlain, totalLoanEmi)}</Tf>
                    <Tf />
                  </tr>
                </tfoot>
              )}
            </Section>

            <footer className="mt-6 pt-3 border-t border-gray-300 flex items-center justify-between text-[11px] text-gray-500">
              <span>Finance Buddy &bull; Offline-first PWA</span>
              <span>Preview</span>
            </footer>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="flex-1" data-testid="report-preview-close">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
