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
  const incomeDay = (it) => {
    if (it.day) return String(it.day);
    if (it.date) {
      try { return String(new Date(it.date).getDate()); } catch (e) { return ''; }
    }
    return '';
  };
  if (incomes.length > 0) {
    addSection('Rent / Income', {
      head: [['Name', 'Day', 'Amount', 'Description']],
      body: incomes.map((it) => [
        it.name || '',
        incomeDay(it),
        fmtNum(nf, it.amount),
        it.description || '',
      ]),
      foot: [[
        { content: 'Total Monthly Rent / Income', colSpan: 2, styles: { halign: 'right' } },
        fmtNum(nf, totalIncome),
        '',
      ]],
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
    });
  } else {
    addSection('Rent / Income', {
      head: [['Name', 'Day', 'Amount', 'Description']],
      body: [[{ content: 'No rent or income entries recorded.', colSpan: 4, styles: { halign: 'center', textColor: GRAY_MID, fontStyle: 'italic' } }]],
    });
  }

  // ---- Loans ----
  const loans = state.loans || [];
  const totalLoanCurrent = loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalLoanEmi = loans.reduce((s, l) => s + (Number(l.emi) || 0), 0);
  if (loans.length > 0) {
    addSection('Loans', {
      head: [['Bank / Lender', 'Current', 'Rate %', 'EMI', 'EMI Day']],
      body: loans.map((l) => [
        l.bank || '',
        fmtNum(nf, l.amount),
        (Number(l.interestRate) || 0).toFixed(2) + '%',
        fmtNum(nf, l.emi),
        l.emiDay ? String(l.emiDay) : '',
      ]),
      foot: [[
        { content: 'Totals', styles: { halign: 'right' } },
        fmtNum(nf, totalLoanCurrent),
        '',
        fmtNum(nf, totalLoanEmi),
        '',
      ]],
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' },
      },
    });
  } else {
    addSection('Loans', {
      head: [['Bank / Lender', 'Current', 'Rate %', 'EMI', 'EMI Day']],
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
  // Use the embedded-data variant so the generated PDF can later be
  // re-imported back into the app via Backup -> Import from PDF.
  const blob = await getReportPDFBlobWithData({ state });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `finance-buddy-report-${stamp}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Returns the PDF as a base64 string (without the data URI prefix).
// Used by the Android JS bridge to hand the PDF to the native
// system: it gets saved to Downloads and opened in a PDF viewer.
// The PDF includes the embedded JSON backup data.
export async function getReportPDFBase64({ state }) {
  return getReportPDFBase64WithData({ state });
}

export async function getReportPDFBlob({ state }) {
  // Always include embedded backup data so the file is round-trippable.
  return getReportPDFBlobWithData({ state });
}

// -------------- Embedded backup data (round-trip Import from PDF) --------------
//
// We encode the full JSON state as base64 and append it after the PDF's
// %%EOF marker, wrapped in unique sentinels. PDF viewers ignore data
// after %%EOF, but we can scan the raw bytes during import and pull
// the JSON back out, so a user can fully restore their data from a
// previously-generated Finance Buddy PDF.

const FB_MARK_START = '%%FB-DATA-START%%';
const FB_MARK_END = '%%FB-DATA-END%%';

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function appendBackupTrailer(pdfBytes, jsonString) {
  const tail = '\n' + FB_MARK_START + utf8ToBase64(jsonString) + FB_MARK_END + '\n';
  const tailBytes = new TextEncoder().encode(tail);
  const out = new Uint8Array(pdfBytes.byteLength + tailBytes.byteLength);
  out.set(new Uint8Array(pdfBytes), 0);
  out.set(tailBytes, pdfBytes.byteLength);
  return out;
}

export async function getReportPDFBlobWithData({ state }) {
  const doc = await generateReportPDF({ state });
  const pdfBytes = doc.output('arraybuffer');
  const json = JSON.stringify(state);
  const finalBytes = appendBackupTrailer(pdfBytes, json);
  return new Blob([finalBytes], { type: 'application/pdf' });
}

export async function getReportPDFBase64WithData({ state }) {
  const blob = await getReportPDFBlobWithData({ state });
  const buf = await blob.arrayBuffer();
  let bin = '';
  const view = new Uint8Array(buf);
  for (let i = 0; i < view.length; i++) bin += String.fromCharCode(view[i]);
  return btoa(bin);
}

// Read a (possibly Finance-Buddy-generated) PDF and return the JSON
// string we embedded in it, or null if no backup was found.
export async function extractBackupFromPDF(file) {
  const buf = await file.arrayBuffer();
  const text = new TextDecoder('latin1').decode(buf);
  const startIdx = text.indexOf(FB_MARK_START);
  const endIdx = text.indexOf(FB_MARK_END, startIdx + FB_MARK_START.length);
  if (startIdx === -1 || endIdx === -1) return null;
  const b64 = text.slice(startIdx + FB_MARK_START.length, endIdx).replace(/\s+/g, '');
  try { return base64ToUtf8(b64); }
  catch (e) { console.warn('extractBackupFromPDF: invalid base64', e); return null; }
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
