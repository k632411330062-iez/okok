/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarLayout } from "./components/SidebarLayout";
import { FirebaseProvider } from "./components/FirebaseProvider";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Cashflow from "./pages/Cashflow";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import InvestmentSimulation from "./pages/InvestmentSimulation";
import FinancialAnalysis from "./pages/FinancialAnalysis";
import AIAdvisor from "./pages/AIAdvisor";

export default function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          
          {/* App layout with Sidebar */}
          <Route path="/app" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
          <Route path="/app/income" element={<SidebarLayout><Income /></SidebarLayout>} />
          <Route path="/app/expense" element={<SidebarLayout><Expense /></SidebarLayout>} />
          <Route path="/app/cashflow" element={<SidebarLayout><Cashflow /></SidebarLayout>} />
          <Route path="/app/investment" element={<SidebarLayout><InvestmentSimulation /></SidebarLayout>} />
          <Route path="/app/analysis" element={<SidebarLayout><FinancialAnalysis /></SidebarLayout>} />
          <Route path="/app/ai-advisor" element={<SidebarLayout><AIAdvisor /></SidebarLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FirebaseProvider>
    </BrowserRouter>
  );
}
