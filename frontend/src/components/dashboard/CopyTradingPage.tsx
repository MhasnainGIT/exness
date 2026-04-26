import React, { useState } from 'react';
import { Users, TrendingUp, Star, ArrowRight, Shield, Search, Copy } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';

const MOCK_STRATEGIES = [
  { id: 1, name: 'Steady Growth FX', trader: 'AlphaTrader', return: '+142.5%', risk: 'Medium', followers: 1240, profit: 28500, drawdown: '12.3%', winRate: '68%', avatar: '#4f46e5' },
  { id: 2, name: 'Gold Momentum', trader: 'GoldKing99', return: '+87.2%', risk: 'High', followers: 890, profit: 15300, drawdown: '22.1%', winRate: '55%', avatar: '#d4af37' },
  { id: 3, name: 'Conservative Pairs', trader: 'SafeHaven', return: '+34.8%', risk: 'Low', followers: 2100, profit: 8900, drawdown: '5.2%', winRate: '74%', avatar: '#22c55e' },
  { id: 4, name: 'Crypto Scalper', trader: 'CryptoNinja', return: '+210.3%', risk: 'High', followers: 650, profit: 42000, drawdown: '35.6%', winRate: '52%', avatar: '#f7931a' },
  { id: 5, name: 'Index Trader Pro', trader: 'IndexMaster', return: '+65.1%', risk: 'Medium', followers: 1560, profit: 19200, drawdown: '15.8%', winRate: '61%', avatar: '#1c6ed4' },
  { id: 6, name: 'Oil & Energy', trader: 'EnergyPro', return: '+48.9%', risk: 'Medium', followers: 430, profit: 11500, drawdown: '18.4%', winRate: '58%', avatar: '#ef5350' },
];

export function CopyTradingPage() {
  const { showToast } = useUi();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const filtered = MOCK_STRATEGIES.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.trader.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || s.risk.toLowerCase() === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <h1 className="text-[26px] font-semibold text-[#1a1b20]">Copy Trading</h1>
      <p className="text-[14px] text-[#5f6368] -mt-3">Automatically copy trades from top-performing strategy providers</p>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1a1b20] to-[#2c2d35] rounded-xl p-8 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Copy className="h-6 w-6 text-[#ffce00]" />
            <h2 className="text-[20px] font-bold">Start Copy Trading</h2>
          </div>
          <p className="text-[14px] text-gray-400 max-w-lg">Follow experienced traders and let their strategies work for you. No trading experience required.</p>
        </div>
        <button
          onClick={() => showToast('Copy trading requires account verification', 'info')}
          className="bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-semibold px-6 h-[40px] rounded text-[13px] flex items-center gap-2 flex-shrink-0"
        >
          Become a Copier <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 h-[36px] flex-1 max-w-[300px]">
          <Search className="h-3.5 w-3.5 text-[#8b8e94]" />
          <input type="text" placeholder="Search strategies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[13px] text-[#1a1b20] outline-none w-full placeholder:text-[#8b8e94]" />
        </div>
        {['all', 'low', 'medium', 'high'].map((r) => (
          <button key={r} onClick={() => setRiskFilter(r)}
            className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${
              riskFilter === r ? 'bg-[#1a1b20] text-white' : 'bg-white border border-gray-200 text-[#5f6368] hover:bg-gray-50'
            }`}>
            {r === 'all' ? 'All Risk' : `${r} Risk`}
          </button>
        ))}
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((strategy) => (
          <div key={strategy.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-[14px]" style={{ background: strategy.avatar }}>
                {strategy.trader[0]}
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1a1b20]">{strategy.name}</h3>
                <p className="text-[12px] text-[#8b8e94]">by {strategy.trader}</p>
              </div>
            </div>
            <div className="text-[28px] font-bold text-[#26a69a] mb-3">{strategy.return}</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <StatRow label="Risk" value={strategy.risk}
                valueClass={strategy.risk === 'Low' ? 'text-[#26a69a]' : strategy.risk === 'High' ? 'text-[#ef5350]' : 'text-[#f59e0b]'} />
              <StatRow label="Followers" value={strategy.followers.toLocaleString()} />
              <StatRow label="Win Rate" value={strategy.winRate} />
              <StatRow label="Drawdown" value={strategy.drawdown} valueClass="text-[#ef5350]" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                showToast(`Following ${strategy.name} requires account verification`, 'info');
              }}
              className="w-full mt-4 h-[34px] bg-[#f0f1f5] hover:bg-[#e5e7eb] text-[#1a1b20] font-semibold rounded text-[12px] flex items-center justify-center gap-1"
            >
              <Copy className="h-3.5 w-3.5" /> Start Copying
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#8b8e94]">{label}</span>
      <span className={`font-semibold ${valueClass || 'text-[#1a1b20]'}`}>{value}</span>
    </div>
  );
}
