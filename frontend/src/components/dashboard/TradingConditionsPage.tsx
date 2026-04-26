import React, { useState } from 'react';
import { ArrowRight, Check, Info, Search, ChevronDown } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';

const INSTRUMENT_CONDITIONS = [
  { symbol: 'EUR/USD', spread: '0.1', swapLong: '-6.44', swapShort: '1.92', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '00:05 - 23:55' },
  { symbol: 'GBP/USD', spread: '0.2', swapLong: '-4.30', swapShort: '0.86', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '00:05 - 23:55' },
  { symbol: 'USD/JPY', spread: '0.1', swapLong: '4.28', swapShort: '-12.84', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '00:05 - 23:55' },
  { symbol: 'EUR/GBP', spread: '0.4', swapLong: '-3.56', swapShort: '0.38', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '00:05 - 23:55' },
  { symbol: 'AUD/USD', spread: '0.3', swapLong: '-2.10', swapShort: '0.45', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '00:05 - 23:55' },
  { symbol: 'XAU/USD', spread: '0.16', swapLong: '-25.38', swapShort: '4.79', leverage: '1:2000', commission: '0.00', minLot: '0.01', tradingHours: '01:05 - 23:55' },
  { symbol: 'XAG/USD', spread: '0.2', swapLong: '-3.20', swapShort: '0.64', leverage: '1:400', commission: '0.00', minLot: '0.01', tradingHours: '01:05 - 23:55' },
  { symbol: 'BTC/USD', spread: '25.0', swapLong: '-30.00', swapShort: '-15.00', leverage: '1:400', commission: '0.00', minLot: '0.01', tradingHours: '24/7' },
  { symbol: 'ETH/USD', spread: '1.5', swapLong: '-15.00', swapShort: '-8.00', leverage: '1:200', commission: '0.00', minLot: '0.01', tradingHours: '24/7' },
  { symbol: 'US OIL', spread: '0.05', swapLong: '-4.50', swapShort: '0.90', leverage: '1:200', commission: '0.00', minLot: '0.01', tradingHours: '01:05 - 23:55' },
  { symbol: 'USTEC', spread: '1.2', swapLong: '-18.00', swapShort: '3.60', leverage: '1:400', commission: '0.00', minLot: '0.01', tradingHours: '01:05 - 23:55' },
  { symbol: 'US30', spread: '4.0', swapLong: '-22.00', swapShort: '4.40', leverage: '1:400', commission: '0.00', minLot: '0.01', tradingHours: '01:05 - 23:55' },
];

export function TradingConditionsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { showToast } = useUi();

  const filtered = INSTRUMENT_CONDITIONS.filter((i) => {
    const matchSearch = i.symbol.toLowerCase().includes(search.toLowerCase());
    if (category === 'all') return matchSearch;
    if (category === 'forex') return matchSearch && i.symbol.includes('/') && !i.symbol.includes('XA');
    if (category === 'metals') return matchSearch && (i.symbol.includes('XAU') || i.symbol.includes('XAG'));
    if (category === 'crypto') return matchSearch && (i.symbol.includes('BTC') || i.symbol.includes('ETH'));
    if (category === 'energy') return matchSearch && i.symbol.includes('OIL');
    if (category === 'indices') return matchSearch && (i.symbol.includes('USTEC') || i.symbol.includes('US30'));
    return matchSearch;
  });

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <h1 className="text-[26px] font-semibold text-[#1a1b20]">Trading Conditions</h1>
      <p className="text-[14px] text-[#5f6368] -mt-3">View spreads, swaps, leverage, and commission for all instruments</p>

      {/* Swap-free banner */}
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#22c55e] rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a1b20]">Swap-free trading available</h3>
            <p className="text-[12px] text-[#5f6368]">Trade without overnight swap charges on eligible instruments</p>
          </div>
        </div>
        <button
          onClick={() => showToast('Swap-free trading is available by default for eligible regions', 'info')}
          className="flex items-center gap-1 text-[13px] text-[#22c55e] font-semibold hover:underline"
        >
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 h-[36px] flex-1 max-w-[300px]">
          <Search className="h-3.5 w-3.5 text-[#8b8e94]" />
          <input
            type="text"
            placeholder="Search instrument..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[13px] text-[#1a1b20] outline-none w-full placeholder:text-[#8b8e94]"
          />
        </div>
        {['all', 'forex', 'metals', 'crypto', 'energy', 'indices'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-colors ${
              category === cat ? 'bg-[#1a1b20] text-white' : 'bg-white border border-gray-200 text-[#5f6368] hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Conditions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafbfc] border-b border-gray-200">
            <tr>
              <th className="p-3 font-medium text-[#8b8e94]">Instrument</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Spread</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Swap Long</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Swap Short</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Leverage</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Commission</th>
              <th className="p-3 font-medium text-[#8b8e94] text-right">Min Lot</th>
              <th className="p-3 font-medium text-[#8b8e94]">Trading Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inst) => (
              <tr key={inst.symbol} className="hover:bg-[#fafbfc] transition-colors cursor-pointer">
                <td className="p-3 font-semibold text-[#1a1b20]">{inst.symbol}</td>
                <td className="p-3 text-right font-mono">{inst.spread}</td>
                <td className={`p-3 text-right font-mono ${parseFloat(inst.swapLong) < 0 ? 'text-[#ef5350]' : 'text-[#26a69a]'}`}>
                  {inst.swapLong}
                </td>
                <td className={`p-3 text-right font-mono ${parseFloat(inst.swapShort) < 0 ? 'text-[#ef5350]' : 'text-[#26a69a]'}`}>
                  {inst.swapShort}
                </td>
                <td className="p-3 text-right font-mono text-[#1a1b20]">{inst.leverage}</td>
                <td className="p-3 text-right font-mono text-[#26a69a]">{inst.commission}</td>
                <td className="p-3 text-right font-mono">{inst.minLot}</td>
                <td className="p-3 text-[12px] text-[#8b8e94]">{inst.tradingHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
