import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { NavLink, useNavigate } from 'react-router-dom';
import { Banknote, DollarSign, Clock, ListChecks, Calculator, Settings as SettingsIcon, Wallet, Info, X } from 'lucide-react';

const items = [
  { to: '/investments', label: 'Investments', icon: DollarSign },
  { to: '/loans', label: 'Loans', icon: Banknote },
  { to: '/todos', label: 'Daily Tasks', icon: ListChecks },
  { to: '/reminders', label: 'Daily Reminders', icon: Clock },
  { to: '/calculators', label: 'Financial Calculators', icon: Calculator },
];

const meta = [
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AppDrawer({ open, onOpenChange }) {
  const navigate = useNavigate();
  const go = (to) => { onOpenChange(false); navigate(to); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 flex flex-col">
        <SheetHeader className="text-left p-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Wallet size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold text-gray-900">Finance Buddy</SheetTitle>
              <p className="text-xs text-gray-500">Personal money manager</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-3">
            <div className="px-3 pb-1.5 pt-1 text-[11px] uppercase tracking-wider font-semibold text-gray-400">Sections</div>
            <ul className="space-y-1">
              {items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={(e) => { e.preventDefault(); go(to); }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} className={isActive ? 'text-teal-600' : 'text-gray-500'} strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-3 mt-4">
            <div className="px-3 pb-1.5 pt-1 text-[11px] uppercase tracking-wider font-semibold text-gray-400">App</div>
            <ul className="space-y-1">
              {meta.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={(e) => { e.preventDefault(); go(to); }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} className={isActive ? 'text-teal-600' : 'text-gray-500'} strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Info size={14} className="text-gray-400" />
            <span>v1.0.0 · 100% offline · Data on this device</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
