import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, ZoomIn, ZoomOut, Sun, Moon, Share2, FileText, Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { downloadReportPDF, getReportPDFBlob } from '../lib/pdf';

export default function PageTopBar() {
  const { openDrawer } = useOutletContext() || {};
  const { state, updateSettings, exportData, markBackedUp } = useStore();
  const theme = state.settings?.theme || 'light';
  const zoom = Number(state.settings?.zoom) || 1;
  const [busy, setBusy] = useState(null); // 'pdf' | 'share' | null

  const setZoom = (z) => updateSettings({ zoom: Math.min(1.5, Math.max(0.75, Number(z.toFixed(2)))) });
  const inc = () => setZoom(zoom + 0.1);
  const dec = () => setZoom(zoom - 0.1);
  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  const onPDF = async () => {
    if (busy) return;
    setBusy('pdf');
    try {
      await downloadReportPDF({ state });
      markBackedUp();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    if (busy) return;
    setBusy('share');
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      let pdfFile = null;
      try {
        const pdfBlob = await getReportPDFBlob({ state });
        pdfFile = new File([pdfBlob], `finance-buddy-report-${stamp}.pdf`, { type: 'application/pdf' });
      } catch (e) {
        // If PDF generation fails we silently fall back to JSON-only sharing.
        console.warn('finance-buddy: PDF generation failed during share', e);
      }

      const jsonText = exportData();
      const jsonFile = new File([jsonText], `finance-buddy-backup-${stamp}.json`, { type: 'application/json' });

      const tryFiles = [];
      if (pdfFile) tryFiles.push(pdfFile);
      tryFiles.push(jsonFile);

      if (navigator.canShare && navigator.canShare({ files: tryFiles })) {
        await navigator.share({
          title: 'Finance Buddy backup',
          text: 'Finance Buddy data backup and report.',
          files: tryFiles,
        });
        markBackedUp();
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: 'Finance Buddy backup',
          text: jsonText.length < 1500 ? jsonText : 'Finance Buddy backup (open the app to export full data).',
        });
        markBackedUp();
        return;
      }
      // Silent clipboard fallback (no UI popups by design)
      try {
        await navigator.clipboard.writeText(jsonText);
        markBackedUp();
      } catch (e) {
        // Clipboard may be unavailable in WebView/file:// contexts; nothing to do.
        console.warn('finance-buddy: clipboard fallback failed', e);
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error(e);
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
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-0.5">
        <button onClick={onShare} disabled={!!busy} aria-label="Share data" className={iconBtn}>
          {busy === 'share' ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
        </button>
        <button onClick={onPDF} disabled={!!busy} aria-label="Download PDF report" className={iconBtn}>
          {busy === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
        </button>

        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        <button onClick={dec} aria-label="Decrease text size" disabled={zoom <= 0.75} className={iconBtn}>
          <ZoomOut size={20} />
        </button>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 min-w-[34px] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={inc} aria-label="Increase text size" disabled={zoom >= 1.5} className={iconBtn}>
          <ZoomIn size={20} />
        </button>
        <button onClick={toggleTheme} aria-label="Toggle dark mode" className={iconBtn + " ml-1"}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
}
