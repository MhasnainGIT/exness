import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Settings, User, ChevronDown, X, Plus,
  Layout as LayoutIcon, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUi } from '../../contexts/UiContext';

export interface SymbolTab {
  symbol: string;
  label: string;
  icon?: string;
  color?: string;
}

interface TerminalHeaderProps {
  tabs: SymbolTab[];
  activeSymbol: string;
  onSelectTab: (symbol: string) => void;
  onCloseTab: (symbol: string) => void;
  onAddTab: () => void;
  account: any;
  isConnected: boolean;
  onOpenAccountSwitcher: () => void;
  onDeposit: () => void;
}

const SYMBOL_ICONS: Record<string, { bg: string; label: string; flag?: string }> = {
  BTC: { bg: '#f7931a', label: 'B' },
  BTCUSD: { bg: '#f7931a', label: '₿' },
  XAUUSD: { bg: '#d4af37', label: 'Au', flag: 'https://flagcdn.com/w20/us.png' },
  XAGUSD: { bg: '#c0c0c0', label: 'Ag' },
  ETH: { bg: '#627eea', label: 'Ξ' },
  EURUSD: { bg: '#003399', label: '€' },
  GBPUSD: { bg: '#012169', label: '£' },
  EURGBP: { bg: '#003399', label: '€' },
  USDJPY: { bg: '#bc002d', label: '¥' },
  USOIL: { bg: '#2d2d2d', label: '🛢' },
  'EUR/USD': { bg: '#003399', label: '€' },
  USTEC: { bg: '#00529b', label: 'US' },
};

function getSymbolIcon(symbol: string) {
  const entry = SYMBOL_ICONS[symbol] || SYMBOL_ICONS[symbol.replace('/', '')];
  if (entry?.flag) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
        <img src={entry.flag} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  const bg = entry?.bg || '#555';
  const label = entry?.label || symbol.substring(0, 2);
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
      style={{ background: bg }}
    >
      {label}
    </div>
  );
}

function getRiskLabel(symbol: string) {
  const risky = ['XAUUSD', 'XAGUSD', 'USOIL', 'BTCUSD', 'ETH', 'USTEC'];
  if (risky.some(r => symbol.includes(r))) {
    return <span className="text-[#d6344d] font-black text-[9px] ml-1 tracking-tight">III</span>;
  }
  return null;
}

export function TerminalHeader({
  tabs, activeSymbol, onSelectTab, onCloseTab, onAddTab,
  account, isConnected, onOpenAccountSwitcher, onDeposit
}: TerminalHeaderProps) {
  const navigate = useNavigate();
  const { showToast } = useUi();

  return (
    <header className="h-[44px] bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between z-50 select-none flex-shrink-0">
      {/* Left: Logo + Tabs */}
      <div className="flex items-center h-full min-w-0 overflow-x-auto overflow-y-hidden flex-1">
        {/* Logo */}
        <div
          className="pl-4 pr-5 flex items-center h-full cursor-pointer hover:bg-white/5 flex-shrink-0"
          onClick={() => navigate('/')}
        >
          <span className="font-black text-[17px] tracking-tight text-[#fecb00] lowercase">exness</span>
        </div>

        {/* Symbol Tabs */}
        <div className="flex items-center h-full">
          {tabs.map((tab) => (
            <div
              key={tab.symbol}
              onClick={() => onSelectTab(tab.symbol)}
              className={`group relative flex items-center gap-1.5 h-full px-3 cursor-pointer text-[12px] font-medium border-t-2 transition-colors ${
                activeSymbol === tab.symbol
                  ? 'bg-[#1e222d] border-t-[#fecb00] text-[#d1d4dc]'
                  : 'border-t-transparent text-[#787b86] hover:bg-white/5 hover:text-[#d1d4dc]'
              }`}
            >
              {getSymbolIcon(tab.symbol)}
              <span className="whitespace-nowrap">{tab.label}</span>
              {getRiskLabel(tab.symbol)}
              {/* Close button */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.symbol); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity rounded-sm hover:bg-white/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {/* Add tab */}
          <div
            onClick={onAddTab}
            className="flex items-center justify-center h-full w-[36px] cursor-pointer text-[#787b86] hover:bg-white/5 hover:text-white text-[18px] font-light flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Right: Account + Actions */}
      <div className="flex items-center h-full px-3 gap-2 flex-shrink-0">
        {/* Account Selector */}
        {account && (
          <div
            onClick={onOpenAccountSwitcher}
            className="flex items-center gap-2 bg-[#1e222d] hover:bg-[#2a2e39] px-3 py-1 rounded cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#26a69a]">Demo</span>
            <span className="text-[11px] font-medium text-[#787b86]">Standard</span>
            <span className="text-[12px] font-bold text-white tabular-nums">
              {parseFloat(account.equity || account.balance || '10000').toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
            </span>
            <ChevronDown className="h-3 w-3 text-[#787b86]" />
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-[#2a2e39]" />

        {/* Connection Status */}
        <div className="flex items-center gap-1 text-[10px]">
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-[#26a69a]" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-[#ef5350]" />
          )}
        </div>

        {/* Action Buttons */}
        <Button
          onClick={() => showToast('Notifications', 'info')}
          variant="ghost" size="icon"
          className="h-7 w-7 text-[#787b86] hover:text-white hover:bg-white/10 rounded"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
        </Button>
        <Button
          onClick={() => showToast('Terminal Settings', 'info')}
          variant="ghost" size="icon"
          className="h-7 w-7 text-[#787b86] hover:text-white hover:bg-white/10 rounded"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
        </Button>
        <Button
          onClick={() => showToast('Workspace layouts', 'info')}
          variant="ghost" size="icon"
          className="h-7 w-7 text-[#787b86] hover:text-white hover:bg-white/10 rounded"
        >
          <LayoutIcon className="h-4 w-4" strokeWidth={1.5} />
        </Button>
        <Button
          onClick={() => showToast('User profile', 'info')}
          variant="ghost" size="icon"
          className="h-7 w-7 text-[#787b86] hover:text-white hover:bg-white/10 rounded border border-[#2a2e39]"
        >
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>

        {/* Deposit */}
        <Button
          onClick={onDeposit}
          className="bg-[#2a2e39] hover:bg-[#363a45] text-white font-semibold h-[30px] px-5 rounded text-[12px] ml-1"
        >
          Deposit
        </Button>
      </div>
    </header>
  );
}
