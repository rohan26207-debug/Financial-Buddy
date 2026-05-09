// PDF report generation for Finance Buddy.
// Generates a black & white tabular report containing Investments,
// Rent / Income, and Loans only. No currency symbols are emitted because
// the default jsPDF Helvetica font does not render most non-ASCII glyphs.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BLACK = [0, 0, 0];
const GRAY_DARK = [60, 60, 60];
const GRAY_MID = [120, 120, 120];
const GRAY_LIGHT = [220, 220, 220];

function fmtDate(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

// Plain number formatter: locale-grouped digits, two decimals, no currency.
function makeNumberFormatter(locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function fmtNum(formatter, n) {
  return formatter.format(Number(n) || 0);
}

export async function generateReportPDF({ state }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;

  const locale = state.settings?.locale || 'en-US';
  const nf = makeNumberFormatter(locale);

  // ---- Header (B&W) ----
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Finance Buddy', margin, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY_DARK);
  doc.text('Investments, Rent / Income & Loans Report', margin, 58);

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(margin, 70, pageWidth - margin, 70);

  doc.setTextColor(...GRAY_MID);
  doc.setFontSize(9);
  const now = new Date();
  doc.text('Generated on ' + now.toLocaleString(), pageWidth - margin, 86, { align: 'right' });

  const contact = state.contact || {};
  if (contact.name || contact.email || contact.phone) {
    const line = [contact.name, contact.email, contact.phone].filter(Boolean).join(' \u2022 ');
    doc.text(line, margin, 86);
  }

  let cursorY = 108;

  // ---- Section helper (B&W theme) ----
  const addSection = (title, tableConfig) => {
    if (cursorY > 720) { doc.addPage(); cursorY = 60; }
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, cursorY);
    cursorY += 8;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 13,
        cellPadding: 10,
        lineColor: BLACK,
        lineWidth: 0.4,
        textColor: BLACK,
        fillColor: [255, 255, 255],
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: BLACK,
        fontStyle: 'bold',
        lineColor: BLACK,
        lineWidth: 0.6,
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: BLACK,
        fontStyle: 'bold',
        lineColor: BLACK,
        lineWidth: 0.6,
      },
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
        fmtNum(nf, i.costBasis),
        fmtNum(nf, i.currentValue),
        fmtNum(nf, (Number(i.currentValue) || 0) - (Number(i.costBasis) || 0)),
      ]),
      foot: [[
        { content: 'Totals', colSpan: 2, styles: { halign: 'right' } },
        fmtNum(nf, totalCost),
        fmtNum(nf, totalCurrent),
        fmtNum(nf, totalGain),
      ]],
      columnStyles: {
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    });
  } else {
    addSection('Investments', {
      head: [['Name', 'Type', 'Cost Basis', 'Current Value', 'Gain / Loss']],
      body: [[{ content: 'No investments recorded.', colSpan: 5, styles: { halign: 'center', textColor: GRAY_MID, fontStyle: 'italic' } }]],
    });
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
        fmtNum(nf, it.amount),
        it.description || '',
      ]),
      foot: [[
        { content: 'Total Monthly Rent / Income', colSpan: 2, styles: { halign: 'right' } },
        fmtNum(nf, totalIncome),
        '',
      ]],
      columnStyles: { 2: { halign: 'right' } },
    });
  } else {
    addSection('Rent / Income', {
      head: [['Name', 'Date', 'Amount', 'Description']],
      body: [[{ content: 'No rent or income entries recorded.', colSpan: 4, styles: { halign: 'center', textColor: GRAY_MID, fontStyle: 'italic' } }]],
    });
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
      head: [['Bank / Lender', 'Initial', 'Current', 'Rate %', 'EMI']],
      body: loans.map((l) => {
        const init = l.initialAmount === undefined || l.initialAmount === null || l.initialAmount === '' ? l.amount : l.initialAmount;
        return [
          l.bank || '',
          fmtNum(nf, init),
          fmtNum(nf, l.amount),
          (Number(l.interestRate) || 0).toFixed(2) + '%',
          fmtNum(nf, l.emi),
        ];
      }),
      foot: [[
        { content: 'Totals', styles: { halign: 'right' } },
        fmtNum(nf, totalLoanInitial),
        fmtNum(nf, totalLoanCurrent),
        '',
        fmtNum(nf, totalLoanEmi),
      ]],
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      },
    });
  } else {
    addSection('Loans', {
      head: [['Bank / Lender', 'Initial', 'Current', 'Rate %', 'EMI']],
      body: [[{ content: 'No loans recorded.', colSpan: 5, styles: { halign: 'center', textColor: GRAY_MID, fontStyle: 'italic' } }]],
    });
  }

  // ---- Footer on every page ----
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    doc.setDrawColor(...GRAY_LIGHT);
    doc.setLineWidth(0.3);
    const ph = doc.internal.pageSize.getHeight();
    doc.line(margin, ph - 28, pageWidth - margin, ph - 28);
    doc.text('Finance Buddy \u2022 Offline-first PWA', margin, ph - 16);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, ph - 16, { align: 'right' });
  }

  return doc;
}

export async function downloadReportPDF({ state }) {
  const doc = await generateReportPDF({ state });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  doc.save(`finance-buddy-report-${stamp}.pdf`);
  return doc;
}

export async function getReportPDFBlob({ state }) {
  const doc = await generateReportPDF({ state });
  return doc.output('blob');
}

// Merge the in-app report PDF with one or more user-supplied PDF Files.
// Returns a Blob of the merged PDF. The report is placed first.
export async function mergeReportWithPDFs(state, files) {
  const { PDFDocument } = await import('pdf-lib');

  const merged = await PDFDocument.create();

  // 1) Add the in-app generated report PDF first
  try {
    const reportBlob = await getReportPDFBlob({ state });
    const reportBytes = await reportBlob.arrayBuffer();
    const reportDoc = await PDFDocument.load(reportBytes);
    const reportPages = await merged.copyPages(reportDoc, reportDoc.getPageIndices());
    reportPages.forEach((p) => merged.addPage(p));
  } catch (e) {
    console.error('Could not embed report PDF', e);
  }

  // 2) Append every user-picked PDF in selection order
  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const extra = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(extra, extra.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch (e) {
      console.error('Failed to merge file', file.name, e);
    }
  }

  const out = await merged.save();
  return new Blob([out], { type: 'application/pdf' });
}

export async function downloadMergedPDF(state, files) {
  const blob = await mergeReportWithPDFs(state, files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `finance-buddy-merged-${stamp}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
