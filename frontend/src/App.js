import React from 'react';
import './App.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import Layout from './components/Layout';
import Loans from './pages/Loans';
import Investments from './pages/Investments';
import Reminders from './pages/Reminders';
import Todos from './pages/Todos';
import Calculators from './pages/Calculators';
import CalculatorDetail from './pages/CalculatorDetail';
import Settings from './pages/Settings';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <StoreProvider>
      <div className="App">
        <HashRouter>
          <Routes>
            <Route element={<Layout />}> 
              <Route path="/" element={<Navigate to="/loans" replace />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/todos" element={<Todos />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/calculators/:id" element={<CalculatorDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </HashRouter>
        <Toaster position="top-center" richColors />
      </div>
    </StoreProvider>
  );
}

export default App;
