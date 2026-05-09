import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Banknote, DollarSign, Clock, ListChecks, Calculator } from 'lucide-react';
import AppDrawer from './AppDrawer';

const navItems = [
  { to: '/loans', label: 'Loans', icon: Banknote },
  { to: '/investments', label: 'Investments', icon: DollarSign },
  { to: '/reminders', label: 'Reminders', icon: Clock },
  { to: '/todos', label: 'To-Do List', icon: ListChecks },
  { to: '/calculators', label: 'Calculators', icon: Calculator },
];

export default function Layout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const onDetail = location.pathname.startsWith('/calculators/') && location.pathname !== '/calculators';

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet context={{ openDrawer: () => setDrawerOpen(true) }} />
      </main>

      <AppDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {!onDetail && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ul className="grid grid-cols-5">
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
                        <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                        <span className={`text-[11px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
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
