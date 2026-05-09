// PDF report generation for Finance Buddy.
// Generates a tabular report containing Investments, Rent / Income, and Loans only.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY = [13, 148, 136]; // teal-600
const TEXT_DARK = [17, 24, 39];
const TEXT_GRAY = [107, 114, 128];

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

function fmtMoney(formatter, n) {
  return formatter(Number(n) || 0);
}

export async function generateReportPDF({ state, currencyFormatter }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;

  // ---- Header ----
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Finance Buddy', margin, 36);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Investments, Rent / Income & Loans Report', margin, 56);

  // Generated date / contact
  doc.setTextColor(...TEXT_GRAY);
  doc.setFontSize(9);
  const now = new Date();
  const meta = 'Generated on ' + now.toLocaleString();
  doc.text(meta, pageWidth - margin, 90, { align: 'right' });

  const contact = state.contact || {};
  if (contact.name || contact.email || contact.phone) {
    let line = [contact.name, contact.email, contact.phone].filter(Boolean).join(' \u2022 ');
    doc.text(line, margin, 90);
  }

  let cursorY = 110;

  // ---- Section helper ----
  const addSection = (title, tableConfig) => {
    if (cursorY > 720) { doc.addPage(); cursorY = 60; }
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, cursorY);
    cursorY += 8;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 6, lineColor: [229, 231, 235], lineWidth: 0.5, textColor: TEXT_DARK },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      ...tableConfig,
    });
    cursorY = doc.lastAutoTable.finalY + 24;
  };

  // ---- Investments ----
  const investments = state.investments || [];
  const totalCurrent = investments.reduce((s, i) => s + (Number(i.currentValue) || 0), 0);
  const totalCost = investments.reduce((s, i) => s + (Number(i.costBasis) || 0), 0);
  const totalGain = totalCurrent - totalCost;
  if (investments.length > 0) {
    addSection('Investments', {
      head: [['Name', 'Type', 'Cost Basis', 'Current Value', 'Gain / Loss']],
      body: investments.map((i) => [
        i.name || '',
        i.type || '',
        fmtMoney(currencyFormatter, i.costBasis),
        fmtMoney(currencyFormatter, i.currentValue),
        fmtMoney(currencyFormatter, (Number(i.currentValue) || 0) - (Number(i.costBasis) || 0)),
      ]),
      foot: [[
        { content: 'Totals', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: fmtMoney(currencyFormatter, totalCost), styles: { fontStyle: 'bold' } },
        { content: fmtMoney(currencyFormatter, totalCurrent), styles: { fontStyle: 'bold' } },
        { content: fmtMoney(currencyFormatter, totalGain), styles: { fontStyle: 'bold', textColor: totalGain >= 0 ? [22, 163, 74] : [220, 38, 38] } },
      ]],
      footStyles: { fillColor: [240, 253, 250], textColor: TEXT_DARK },
      columnStyles: {
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    });
  } else {
    addSection('Investments', { head: [['Name', 'Type', 'Cost Basis', 'Current Value', 'Gain / Loss']], body: [[{ content: 'No investments recorded.', colSpan: 5, styles: { halign: 'center', textColor: TEXT_GRAY, fontStyle: 'italic' } }]] });
  }

  // ---- Rent / Income ----
  const incomes = state.incomes || [];
  const totalIncome = incomes.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  if (incomes.length > 0) {
    addSection('Rent / Income', {
      head: [['Name', 'Date', 'Amount', 'Description']],
      body: incomes.map((it) => [
        it.name || '',
        fmtDate(it.date),
        fmtMoney(currencyFormatter, it.amount),
        it.description || '',
      ]),
      foot: [[
        { content: 'Total Monthly Rent / Income', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: fmtMoney(currencyFormatter, totalIncome), styles: { fontStyle: 'bold' } },
        '',
      ]],
      footStyles: { fillColor: [240, 253, 250], textColor: TEXT_DARK },
      columnStyles: { 2: { halign: 'right' } },
    });
  } else {
    addSection('Rent / Income', { head: [['Name', 'Date', 'Amount', 'Description']], body: [[{ content: 'No rent or income entries recorded.', colSpan: 4, styles: { halign: 'center', textColor: TEXT_GRAY, fontStyle: 'italic' } }]] });
  }

  // ---- Loans ----
  const loans = state.loans || [];
  const totalLoanCurrent = loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalLoanInitial = loans.reduce((s, l) => {
    const init = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? l.amount : l.initialAmount;
    return s + (Number(init) || 0);
  }, 0);
  const totalLoanEmi = loans.reduce((s, l) => s + (Number(l.emi) || 0), 0);
  if (loans.length > 0) {
    addSection('Loans', {
      head: [['Bank / Lender', 'Start', 'End', 'Initial', 'Current', 'Rate %', 'EMI']],
      body: loans.map((l) => {
        const init = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? l.amount : l.initialAmount;
        return [
          l.bank || '',
          fmtDate(l.startDate),
          fmtDate(l.endDate),
          fmtMoney(currencyFormatter, init),
          fmtMoney(currencyFormatter, l.amount),
          (Number(l.interestRate) || 0).toFixed(2) + '%',
          fmtMoney(currencyFormatter, l.emi),
        ];
      }),
      foot: [[
        { content: 'Totals', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: fmtMoney(currencyFormatter, totalLoanInitial), styles: { fontStyle: 'bold' } },
        { content: fmtMoney(currencyFormatter, totalLoanCurrent), styles: { fontStyle: 'bold' } },
        '',
        { content: fmtMoney(currencyFormatter, totalLoanEmi), styles: { fontStyle: 'bold' } },
      ]],
      footStyles: { fillColor: [240, 253, 250], textColor: TEXT_DARK },
      columnStyles: {
        3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' },
      },
    });
  } else {
    addSection('Loans', { head: [['Bank / Lender', 'Start', 'End', 'Initial', 'Current', 'Rate %', 'EMI']], body: [[{ content: 'No loans recorded.', colSpan: 7, styles: { halign: 'center', textColor: TEXT_GRAY, fontStyle: 'italic' } }]] });
  }

  // ---- Footer on every page ----
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    const ph = doc.internal.pageSize.getHeight();
    doc.text('Finance Buddy \u2022 Offline-first PWA', margin, ph - 18);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, ph - 18, { align: 'right' });
  }

  return doc;
}

export async function downloadReportPDF({ state, currencyFormatter }) {
  const doc = await generateReportPDF({ state, currencyFormatter });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  doc.save(`finance-buddy-report-${stamp}.pdf`);
  return doc;
}

export async function getReportPDFBlob({ state, currencyFormatter }) {
  const doc = await generateReportPDF({ state, currencyFormatter });
  return doc.output('blob');
}
