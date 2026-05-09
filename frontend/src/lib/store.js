import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { seedData } from './seed';

const STORAGE_KEY = 'finance_buddy_data_v1';

const defaultState = {
  loans: seedData.loans,
  investments: seedData.investments,
  reminders: seedData.reminders,
  todos: seedData.todos,
  calculators: seedData.calculators,
  settings: {
    currency: 'USD',
    locale: 'en-US',
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings || {}) } };
  } catch (e) {
    return defaultState;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const updateSection = useCallback((section, updater) => {
    setState((prev) => ({ ...prev, [section]: typeof updater === 'function' ? updater(prev[section]) : updater }));
  }, []);

  const upsertItem = useCallback((section, item) => {
    setState((prev) => {
      const list = prev[section] || [];
      const exists = list.find((x) => x.id === item.id);
      const newList = exists
        ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x))
        : [{ ...item, id: item.id || cryptoId() }, ...list];
      return { ...prev, [section]: newList };
    });
  }, []);

  const removeItem = useCallback((section, id) => {
    setState((prev) => ({ ...prev, [section]: prev[section].filter((x) => x.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importData = useCallback((jsonString) => {
    const parsed = JSON.parse(jsonString);
    setState({ ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings || {}) } });
  }, []);

  const resetData = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <StoreContext.Provider value={{ state, updateSection, upsertItem, removeItem, updateSettings, exportData, importData, resetData }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound', locale: 'en-GB' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'NGN', symbol: '\u20A6', name: 'Nigerian Naira', locale: 'en-NG' },
];

export function useCurrency() {
  const { state } = useStore();
  const code = state.settings.currency || 'USD';
  const cur = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  const format = (val, opts = {}) => {
    const n = Number(val) || 0;
    try {
      return new Intl.NumberFormat(cur.locale, { style: 'currency', currency: cur.code, maximumFractionDigits: opts.decimals ?? 2, minimumFractionDigits: opts.decimals ?? 2 }).format(n);
    } catch {
      return cur.symbol + n.toFixed(opts.decimals ?? 2);
    }
  };
  const formatPlain = (val, opts = {}) => {
    const n = Number(val) || 0;
    try {
      return new Intl.NumberFormat(cur.locale, { maximumFractionDigits: opts.decimals ?? 2, minimumFractionDigits: opts.decimals ?? 2 }).format(n);
    } catch {
      return n.toFixed(opts.decimals ?? 2);
    }
  };
  return { ...cur, format, formatPlain };
}

export function formatDate(d) {
  if (!d) return '';
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

export function formatDateShort(d) {
  if (!d) return '';
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}
