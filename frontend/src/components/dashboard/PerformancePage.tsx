import React, { useEffect, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';

export function PerformancePage() {
  const { showToast } = useUi();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [period, setPeriod] = useState('last30');

  useEffect(() => {
    fetchApi('/accounts')
      .then((data) => {
        const accs = data?.accounts ?? data ?? [];
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccount(accs[0]);
      })
      .catch(console.error);
  }, []);

  const balance = parseFloat(selectedAccount?.balance || '0');
  const equity = parseFloat(selectedAccount?.equity || selectedAccount?.balance || '0');
  const profit = equity - balance;
  const profitPct = balance > 0 ? ((profit / balance) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <h1 className="text-[26px] font-semibold text-[#1a1b20]">Performance</h1>

      {/* Account & Period Selectors */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-gray-200 bg-white rounded px-3 h-[36px] cursor-pointer hover:bg-gray-50">
          <span className="text-[13px] text-[#1a1b20] font-medium">
            {selectedAccount ? `Standard #${selectedAccount.accountNumber}` : 'Select account'}
          </span>
          <ChevronDown className="h-3 w-3 text-[#8b8e94]" />
        </div>
        <div className="flex items-center border border-gray-200 rounded overflow-hidden bg-white">
          {[
            { key: 'today', label: 'Today' },
            { key: 'last7', label: '7 Days' },
            { key: 'last30', label: '30 Days' },
            { key: 'all', label: 'All time' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 transition-colors ${
                period === p.key ? 'bg-[#f0f1f5] text-[#1a1b20]' : 'text-[#5f6368] hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Balance" value={`${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`} />
        <SummaryCard label="Equity" value={`${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`} />
        <SummaryCard
          label="Profit/Loss"
          value={`${profit >= 0 ? '+' : ''}${profit.toFixed(2)} USD`}
          valueColor={profit >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}
        />
        <SummaryCard
          label="Return %"
          value={`${Number(profitPct) >= 0 ? '+' : ''}${profitPct}%`}
          valueColor={Number(profitPct) >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}
        />
      </div>

      {/* Chart placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[300px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-[#1a1b20]">Equity Chart</h3>
          <button onClick={() => showToast('Download CSV report', 'info')} className="flex items-center gap-1.5 text-[13px] text-[#5f6368] hover:text-[#1a1b20]">
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#fafbfc] rounded border border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-[32px] font-bold text-[#26a69a] mb-1">{balance.toLocaleString()} USD</div>
            <p className="text-[13px] text-[#8b8e94]">Live balance tracking chart</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-[#1a1b20]">Trading Statistics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          <StatItem label="Total Trades" value="0" />
          <StatItem label="Winning Trades" value="0" />
          <StatItem label="Losing Trades" value="0" />
          <StatItem label="Win Rate" value="0%" />
          <StatItem label="Avg Win" value="0.00 USD" />
          <StatItem label="Avg Loss" value="0.00 USD" />
          <StatItem label="Best Trade" value="0.00 USD" />
          <StatItem label="Worst Trade" value="0.00 USD" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-[12px] text-[#8b8e94] font-medium mb-1">{label}</div>
      <div className={`text-[18px] font-bold tabular-nums ${valueColor || 'text-[#1a1b20]'}`}>{value}</div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border-r border-b border-gray-100 last:border-r-0">
      <div className="text-[12px] text-[#8b8e94] font-medium mb-0.5">{label}</div>
      <div className="text-[15px] font-semibold text-[#1a1b20]">{value}</div>
    </div>
  );
}
