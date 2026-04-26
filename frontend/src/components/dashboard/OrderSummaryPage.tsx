import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, Info, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';
import { Card, CardContent } from '@/components/ui/card';

interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  time: string;
}

export function OrderSummaryPage() {
  const { showToast } = useUi();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/accounts')
      .then((data) => {
        const accs = data?.accounts ?? data ?? [];
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountId(accs[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    setLoading(true);
    // Simulate fetching open positions
    fetchApi(`/trading/positions?accountId=${selectedAccountId}`)
      .then((res) => {
        setPositions(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
  const openCount = positions.length;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold text-[#1a1b20]">Order Summary</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-[13px] text-[#5f6368] hover:text-[#1a1b20]">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Account Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#8b8e94] font-bold uppercase">Account</span>
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[14px] font-bold text-[#1a1b20]">
                {selectedAccount ? `Standard #${selectedAccount.accountNumber}` : 'Select account'}
              </span>
              <ChevronDown className="h-4 w-4 text-[#8b8e94] group-hover:text-[#1a1b20]" />
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[11px] text-[#8b8e94] font-bold uppercase">Balance</span>
            <span className="text-[14px] font-bold text-[#1a1b20]">
              {selectedAccount ? parseFloat(selectedAccount.balance).toLocaleString() : '0.00'} USD
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => showToast('Withdrawal redirected', 'info')} className="px-4 h-9 rounded bg-[#f4f5f7] text-[#1a1b20] font-semibold text-[13px] hover:bg-gray-200">
             Withdraw
           </button>
           <button onClick={() => showToast('Deposit redirected', 'info')} className="px-4 h-9 rounded bg-[#ffce00] text-[#1a1b20] font-semibold text-[13px] hover:bg-[#e6bb00]">
             Deposit
           </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Profit/Loss" value={`${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} USD`} color={totalProfit >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'} />
        <StatCard label="Open Positions" value={openCount.toString()} />
        <StatCard label="Margin Level" value="0.00%" />
        <StatCard label="Free Margin" value="0.00 USD" />
      </div>

      {/* Positions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#1a1b20]">Open Positions</h3>
          <span className="text-[12px] text-[#8b8e94]">{openCount} positions</span>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-[#8b8e94]">Loading positions...</div>
        ) : positions.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-[#f4f5f7] rounded-full flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-[#8b8e94]" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-medium text-[#1a1b20] mb-1">No open positions</p>
            <p className="text-[12px] text-[#8b8e94]">Active trades will appear here</p>
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#fafbfc] border-b border-gray-100 font-medium text-[#8b8e94]">
              <tr>
                <th className="px-6 py-3">Symbol</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Volume</th>
                <th className="px-3 py-3">Open Price</th>
                <th className="px-3 py-3">Current Price</th>
                <th className="px-3 py-3">Swap</th>
                <th className="px-6 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-[#fafbfc] cursor-pointer group">
                  <td className="px-6 py-4 font-bold text-[#1a1b20]">{pos.symbol}</td>
                  <td className="px-3 py-4">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${pos.type === 'BUY' ? 'bg-[#e8f5e9] text-[#26a69a]' : 'bg-[#ffebee] text-[#ef5350]'}`}>
                      {pos.type}
                    </span>
                  </td>
                  <td className="px-3 py-4 font-mono">{pos.volume}</td>
                  <td className="px-3 py-4 font-mono">{pos.openPrice.toFixed(5)}</td>
                  <td className="px-3 py-4 font-mono">{pos.currentPrice.toFixed(5)}</td>
                  <td className="px-3 py-4 font-mono">{pos.swap.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-bold tabular-nums ${pos.profit >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                    {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Helpful Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#e8f0fe] rounded-lg flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-[#1c6ed4]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#1a1b20]">Trading Signals</h4>
                <p className="text-[11px] text-[#8b8e94]">View analysis from Trading Central</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#8b8e94]" />
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#fff9e6] rounded-lg flex items-center justify-center">
                <Info className="h-5 w-5 text-[#ffce00]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#1a1b20]">Economic Calendar</h4>
                <p className="text-[11px] text-[#8b8e94]">Upcoming market-moving events</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#8b8e94]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <span className="text-[11px] text-[#8b8e94] font-bold uppercase block mb-1">{label}</span>
      <span className={`text-[18px] font-black tabular-nums ${color || 'text-[#1a1b20]'}`}>{value}</span>
    </div>
  );
}
