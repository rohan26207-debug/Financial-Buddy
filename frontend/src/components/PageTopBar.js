import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, ZoomIn, ZoomOut, Sun, Moon, Share2, FileText, Loader2, Eye } from 'lucide-react';
import { useStore } from '../lib/store';
import { downloadReportPDF, getReportPDFBlob, getReportPDFBase64 } from '../lib/pdf';
import ReportPreview from './ReportPreview';

// Returns the native Android bridge if it's available, else null.
// The bridge is injected by MainActivity.java as window.FinanceBuddyAndroid.
function getAndroidBridge() {
  if (typeof window === 'undefined') return null;
  const b = window.FinanceBuddyAndroid;
  if (b && typeof b.openPdfWithViewer === 'function') return b;
  return null;
}

export function getAndroidBridgeOrNull() { return getAndroidBridge(); }

export default function PageTopBar() {
  const { openDrawer } = useOutletContext() || {};
  const { state, updateSettings, exportData, markBackedUp } = useStore();
  const theme = state.settings?.theme || 'light';
  const zoom = Number(state.settings?.zoom) || 1;
  const [busy, setBusy] = useState(null); // 'pdf' | 'share' | null
  const [previewOpen, setPreviewOpen] = useState(false);

  const setZoom = (z) => updateSettings({ zoom: Math.min(1.5, Math.max(0.75, Number(z.toFixed(2)))) });
  const inc = () => setZoom(zoom + 0.1);
  const dec = () => setZoom(zoom - 0.1);
  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  const onPDF = async () => {
    if (busy) return;
    setBusy('pdf');
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `finance-buddy-report-${stamp}.pdf`;
      const bridge = getAndroidBridge();
      if (bridge) {
        // Native: save into Downloads and open in PDF viewer / share sheet.
        const base64 = await getReportPDFBase64({ state });
        bridge.openPdfWithViewer(base64, filename);
      } else {
        // Browser: download via jsPDF blob.
        await downloadReportPDF({ state });
      }
      markBackedUp();
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    if (busy) return;
    setBusy('share');
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const pdfName = `finance-buddy-report-${stamp}.pdf`;

      const bridge = getAndroidBridge();
      if (bridge && typeof bridge.sharePdf === 'function') {
        // Native Android: open the system share sheet with ONLY the PDF
        // attached (the PDF embeds the full JSON backup, so a single
        // file is enough for any recipient to restore the data).
        let pdfBase64 = '';
        try { pdfBase64 = await getReportPDFBase64({ state }); }
        catch (e) { console.warn('PDF generation failed during share', e); }
        if (!pdfBase64) return;
        bridge.sharePdf(pdfBase64, pdfName);
        markBackedUp();
        return;
      }

      // Web fallback: share only the PDF via the Web Share API.
      let pdfFile = null;
      try {
        const pdfBlob = await getReportPDFBlob({ state });
        pdfFile = new File([pdfBlob], pdfName, { type: 'application/pdf' });
      } catch (e) {
        console.warn('PDF generation failed during share', e);
      }
      if (!pdfFile) return;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Finance Buddy report',
          files: [pdfFile],
        });
        markBackedUp();
        return;
      }

      // No native share -> save the PDF locally as a graceful fallback.
      const url = URL.createObjectURL(pdfFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      markBackedUp();
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error('Share failed', e);
    } finally {
      setBusy(null);
    }
  };

  const iconBtn = "p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex items-center justify-between -mx-1">
      <button
        onClick={openDrawer}
        aria-label="Open menu"
        className={iconBtn}
        data-testid="menu-btn"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-0.5">
        <button onClick={() => setPreviewOpen(true)} aria-label="View report" className={iconBtn} data-testid="view-report-btn">
          <Eye size={20} />
        </button>
        <button onClick={onShare} disabled={!!busy} aria-label="Share data" className={iconBtn} data-testid="share-btn">
          {busy === 'share' ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
        </button>
        <button onClick={onPDF} disabled={!!busy} aria-label="Download PDF report" className={iconBtn} data-testid="pdf-btn">
          {busy === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
        </button>

        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        <button onClick={dec} aria-label="Decrease text size" disabled={zoom <= 0.75} className={iconBtn} data-testid="zoom-out-btn">
          <ZoomOut size={20} />
        </button>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 min-w-[34px] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={inc} aria-label="Increase text size" disabled={zoom >= 1.5} className={iconBtn} data-testid="zoom-in-btn">
          <ZoomIn size={20} />
        </button>
        <button onClick={toggleTheme} aria-label="Toggle dark mode" className={iconBtn + " ml-1"} data-testid="theme-btn">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <ReportPreview open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
