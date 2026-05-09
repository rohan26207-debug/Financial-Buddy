import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, ZoomIn, ZoomOut, Sun, Moon } from 'lucide-react';
import { useStore } from '../lib/store';

export default function PageTopBar() {
  const { openDrawer } = useOutletContext() || {};
  const { state, updateSettings } = useStore();
  const theme = state.settings?.theme || 'light';
  const zoom = Number(state.settings?.zoom) || 1;

  const setZoom = (z) => updateSettings({ zoom: Math.min(1.5, Math.max(0.75, Number(z.toFixed(2)))) });
  const inc = () => setZoom(zoom + 0.1);
  const dec = () => setZoom(zoom - 0.1);
  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  return (
    <div className="flex items-center justify-between -mx-1">
      <button
        onClick={openDrawer}
        aria-label="Open menu"
        className="p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={dec}
          aria-label="Decrease text size"
          disabled={zoom <= 0.75}
          className="p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 min-w-[34px] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={inc}
          aria-label="Increase text size"
          disabled={zoom >= 1.5}
          className="p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="ml-1 p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
}
