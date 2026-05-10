import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Banknote, DollarSign, Clock, ListChecks, Calculator, HandCoins } from 'lucide-react';
import AppDrawer from './AppDrawer';

const navItems = [
  { to: '/investments', label: 'Invest', icon: DollarSign },
  { to: '/income', label: 'Income', icon: HandCoins },
  { to: '/loans', label: 'Loans', icon: Banknote },
  { to: '/todos', label: 'Tasks', icon: ListChecks },
  { to: '/reminders', label: 'Remind', icon: Clock },
  { to: '/calculators', label: 'Calc', icon: Calculator },
];

export default function Layout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const onDetail = location.pathname.startsWith('/calculators/') && location.pathname !== '/calculators';

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const outletContext = useMemo(() => ({ openDrawer }), [openDrawer]);

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 min-h-0 pb-20">
        <Outlet context={outletContext} />
      </main>

      <AppDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {!onDetail && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ul className="grid grid-cols-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                        isActive ? 'text-teal-600' : 'text-gray-500'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                        <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
