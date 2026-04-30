/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { PerformancePage } from './components/dashboard/PerformancePage';
import { OrderSummaryPage } from './components/dashboard/OrderSummaryPage';
import { OrdersHistoryPage } from './components/dashboard/OrdersHistoryPage';
import { DepositPage } from './components/dashboard/DepositPage';
import { WithdrawalPage } from './components/dashboard/WithdrawalPage';
import { TransactionHistoryPage } from './components/dashboard/TransactionHistoryPage';
import { CryptoWalletPage } from './components/dashboard/CryptoWalletPage';
import { AnalystViewsPage } from './components/dashboard/AnalystViewsPage';
import { MarketNewsPage } from './components/dashboard/MarketNewsPage';
import { EconomicCalendarPage } from './components/dashboard/EconomicCalendarPage';
import { TradingConditionsPage } from './components/dashboard/TradingConditionsPage';
import { SwapFreePage } from './components/dashboard/SwapFreePage';
import { SavingsPage } from './components/dashboard/SavingsPage';
import { VPSPage } from './components/dashboard/VPSPage';
import { CopyTradingPage } from './components/dashboard/CopyTradingPage';
import { TradingSettingsPage } from './components/dashboard/TradingSettingsPage';
import { ProfilePage } from './components/dashboard/ProfilePage';
import { Terminal } from './components/terminal/Terminal';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Landing } from './components/auth/Landing';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { MarketProvider } from './contexts/MarketContext';
import { UiProvider } from './contexts/UiContext';

export default function App() {
  return (
    <AuthProvider>
      <UiProvider>
        <MarketProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedRoute />}>
                {/* Terminal is full-screen, no layout wrapper */}
                <Route path="/terminal" element={<Terminal />} />
                
                {/* All dashboard pages use the Layout wrapper */}
                <Route path="*" element={
                  <Layout>
                    <Routes>
                      {/* Trading */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/accounts" element={<Dashboard />} />
                      <Route path="/performance" element={<PerformancePage />} />
                      <Route path="/order-summary" element={<OrderSummaryPage />} /> 
                      <Route path="/history-of-orders" element={<OrdersHistoryPage />} />
                      
                      {/* Payments & Wallet */}
                      <Route path="/deposit" element={<DepositPage />} />
                      <Route path="/withdrawal" element={<WithdrawalPage />} />
                      <Route path="/transaction-history" element={<TransactionHistoryPage />} />
                      <Route path="/crypto-wallet" element={<CryptoWalletPage />} />
                      
                      {/* Analytics */}
                      <Route path="/analyst-views" element={<AnalystViewsPage />} />
                      <Route path="/market-news" element={<MarketNewsPage />} />
                      <Route path="/economic-calendar" element={<EconomicCalendarPage />} />
                      
                      {/* Exness Benefits */}
                      <Route path="/swap-free" element={<SwapFreePage />} />
                      <Route path="/savings" element={<SavingsPage />} />
                      <Route path="/vps" element={<VPSPage />} />
                      
                      {/* Copy Trading */}
                      <Route path="/copy-trading" element={<CopyTradingPage />} />
                      
                      {/* Profile / Settings */}
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/trading-settings" element={<TradingSettingsPage />} />
                      
                      {/* Legacy routes */}
                      <Route path="/wallet" element={<TransactionHistoryPage />} />
                      <Route path="/history" element={<OrdersHistoryPage />} />
                    </Routes>
                  </Layout>
                } />
              </Route>
            </Routes>
          </Router>
        </MarketProvider>
      </UiProvider>
    </AuthProvider>
  );
}
