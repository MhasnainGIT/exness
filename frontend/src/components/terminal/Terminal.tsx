import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bell, Grid, User, Layout as LayoutIcon, Search, MoreVertical, Calendar, Settings, Focus,
  ChevronDown, ZoomIn, Magnet, Lock, Eye, Trash2, ArrowUpCircle, ArrowDownCircle,
  Plus, Minus, List as ListIcon, Star, Menu, ArrowDown, ArrowUp, X, RefreshCw, Info, ExternalLink,
  History, CandlestickChart, Activity, Newspaper, Wallet, ChevronUp, AlertCircle, Filter, Clock, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';
import { useMarket } from '../../contexts/MarketContext';
import { useUi } from '../../contexts/UiContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingChart } from './TradingChart';
import { DrawingLayer } from './DrawingLayer';
import { NewsSidebar } from './NewsSidebar';

export function Terminal() {
  const [searchParams] = useSearchParams();
  const accountIdParam = searchParams.get('accountId');
  const navigate = useNavigate();

  const [account, setAccount] = useState<any>(null);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [activeSymbol, setActiveSymbol] = useState('EURGBP');
  const [search, setSearch] = useState('');
  const [selectedSide, setSelectedSide] = useState<'BUY' | 'SELL' | null>(null);

  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [positions, setPositions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyType, setHistoryType] = useState<'orders' | 'funds'>('orders');
  const [pending, setPending] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1M' | '1H'>('1H');
  const [candles, setCandles] = useState<any[]>([]);
  const [volumeLots, setVolumeLots] = useState(0.01);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Advanced State
  const [orderFormType, setOrderFormType] = useState<'REGULAR' | 'ONE_CLICK' | 'RISK_CALC'>('REGULAR');
  const [formDropdownOpen, setFormDropdownOpen] = useState(false);
  const [orderType, setOrderType] = useState<'MARKET' | 'PENDING'>('MARKET');
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [requestedPrice, setRequestedPrice] = useState<number | null>(null);
  const [showAssetSearch, setShowAssetSearch] = useState(false);
  const { showToast, openWalletModal, oneClickTrading, setOneClickTrading, slTpUnit, workspace } = useUi();
  
  // State
  const [navbarSymbols, setNavbarSymbols] = useState<string[]>(['EURUSD', 'BTCUSD', 'XAUUSD']);

  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem('trading_disclaimer_accepted') === 'true';
  });

  // Layout State
  const [leftWidth, setLeftWidth] = useState(280);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(220);
  const [isBottomResizing, setIsBottomResizing] = useState(false);
  const [isBottomOpen, setIsBottomOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'instruments' | 'news' | 'portfolio' | 'history'>('instruments');

  // Tools State
  const [gridVisible, setGridVisible] = useState(true);
  const [mode, setMode] = useState<'NAV' | 'DRAW'>('NAV');
  const [chartLayout, setChartLayout] = useState('single');
  const [showSettings, setShowSettings] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showLayouts, setShowLayouts] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);

  const chartRef = useRef<any>(null);
  const drawingRef = useRef<any>(null);

  const { prices, subscribe, isConnected } = useMarket();

  // Candle Polling
  const fetchCandles = useCallback(async (autoFit = false) => {
    if (!activeSymbol) return;
    try {
      const res = await fetchApi(`/market/candles/${activeSymbol}?timeframe=${timeframe}&limit=200`);
      const candleData = Array.isArray(res) ? res : (res?.data || []);
      if (candleData.length > 0) {
        setCandles(candleData);
        if (autoFit) setTimeout(() => chartRef.current?.autoFit(), 100);
      }
    } catch (err) {
      console.error('Failed to fetch candles:', err);
    }
  }, [activeSymbol, timeframe]);

  useEffect(() => {
    fetchCandles(true);
  }, [fetchCandles]);

  useEffect(() => {
    const interval = setInterval(() => fetchCandles(false), 30000);
    return () => clearInterval(interval);
  }, [fetchCandles]);

  useEffect(() => {
    fetchApi('/accounts').then((res: any) => {
      const accs = Array.isArray(res) ? res : (res?.data || res?.accounts || []);
      setAllAccounts(accs);
      let target = null;
      if (accountIdParam) {
        target = accs.find((a: any) => a.id === accountIdParam);
      }
      if (!target) {
        const typeFilter = workspace === 'real' ? 'LIVE' : 'DEMO';
        const workspaceAccs = accs.filter((a: any) => a.accountType === typeFilter);
        target = workspaceAccs[0] || accs[0];
      }
      setAccount(target);
    }).catch(console.error);

    fetchApi('/market/instruments').then((res: any) => {
      const insts = Array.isArray(res) ? res : (res?.data || []);
      setInstruments(insts);
      subscribe(insts.map((i: any) => i.symbol));
      if (!insts.find((i: any) => i.symbol === 'EURGBP')) {
        setInstruments(prev => [{ symbol: 'EURGBP', defaultPrice: 0.860 }, ...prev]);
      }
    }).catch(console.error);
  }, [accountIdParam, subscribe, workspace]);

  const fetchData = async () => {
    if (!account) return;
    try {
      // 1. Refresh Account Info (Balance, Equity, etc.)
      const accRes: any = await fetchApi(`/accounts`);
      const allAccs = Array.isArray(accRes) ? accRes : (accRes?.data || accRes?.accounts || []);
      const currentAcc = allAccs.find((a: any) => a.id === account.id);
      if (currentAcc) setAccount(currentAcc);

      // 2. Refresh Positions and Orders
      const posRes = await fetchApi(`/trading/positions?accountId=${account.id}`);
      setPositions(Array.isArray(posRes) ? posRes : posRes.data || []);
      
      const pendRes = await fetchApi(`/trading/orders/history?status=PENDING&limit=50`);
      setPending(Array.isArray(pendRes) ? pendRes : pendRes.data || []);
      
      const fillRes = await fetchApi(`/trading/positions/history?accountId=${account.id}`);
      setHistory(Array.isArray(fillRes) ? fillRes : fillRes.data || []);
    } catch (err) {
      console.error('Failed to refresh trading data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // 1s interval for ultra-responsive UI
    return () => clearInterval(interval);
  }, [account?.id]);

  // (Removed redundant identical fetchApi useEffect for activeSymbol/timeframe)
  const activeInstrument = instruments.find(i => i.symbol === activeSymbol);

  const livePrice = useMemo(() => {
    const base = prices[activeSymbol] || { 
      time: Date.now(), 
      bid: activeInstrument?.defaultPrice || 1.05, 
      ask: (activeInstrument?.defaultPrice || 1.05) + (activeInstrument?.spread || 0.0001) 
    };
    
    // Ensure we handle potential string values from the database/Prisma
    const bidNum = Number(base.bid || 0);
    const askNum = Number(base.ask || 0);
    const precision = activeSymbol.includes('JPY') ? 2 : 5;

    return {
      ...base,
      bid: Number(bidNum.toFixed(precision)),
      ask: Number(askNum.toFixed(precision)),
      time: base.time || Date.now()
    };
  }, [prices[activeSymbol], activeSymbol, activeInstrument]);

  const positionsWithPL = useMemo(() => {
    return positions.map(pos => {
      const symbol = pos.instrumentSymbol || pos.symbol || pos.instrument?.symbol || 'UNKNOWN';
      const entryPrice = parseFloat(pos.entryPrice || pos.openPrice || 0);
      
      const liveBid = prices[symbol]?.bid || livePrice.bid;
      const liveAsk = prices[symbol]?.ask || livePrice.ask;
      
      const side = pos.side;
      const volumeLots = parseFloat(pos.volumeLots || 0);
      // Get contractSize from the instrument list — fall back to 100000 (standard forex lot)
      const instrument = instruments.find((i: any) => i.symbol === symbol);
      const contractSize = instrument?.contractSize ? parseFloat(instrument.contractSize) : (pos.instrument?.contractSize ? parseFloat(pos.instrument.contractSize) : 100000);
      
      const exitPrice = side === 'BUY' ? liveBid : liveAsk;
      const currentPrice = exitPrice;
      const diff = side === 'BUY' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      const profit = diff * volumeLots * contractSize;
      
      return { ...pos, symbol, entryPrice, currentPrice, profit };
    });
  }, [positions, prices, livePrice, instruments]);

  const totalPL = positionsWithPL.reduce((sum, p) => sum + (p.profit || 0), 0);

  const handlePlaceOrder = async (side: 'BUY' | 'SELL') => {
    if (placingOrder) return;

    if (!account) {
      showToast('No trading account found. Creating one...', 'info');
      try {
        const newAcc = await fetchApi('/accounts', {
          method: 'POST',
          body: JSON.stringify({ accountType: workspace === 'real' ? 'LIVE' : 'DEMO', leverage: 200 })
        });
        setAccount(newAcc);
        showToast(`${workspace === 'real' ? 'Live' : 'Demo'} account created! Try placing order again.`, 'success');
      } catch (e: any) {
        showToast(`Cannot create account: ${e.message}`, 'error');
      }
      return;
    }

    // Execute directly (sidebar handles its own confirmation buttons now)
    executeOrder(side);
  };

  const executeOrder = async (side: 'BUY' | 'SELL') => {
    setPlacingOrder(true);
    try {
      await fetchApi('/trading/orders', {
        method: 'POST',
        body: JSON.stringify({ 
           tradingAccountId: account.id, 
           instrumentSymbol: activeSymbol, 
           side, 
           // Backend uses MARKET/LIMIT/STOP — 'PENDING' UI tab maps to LIMIT order type
           type: orderType === 'PENDING' ? 'LIMIT' : 'MARKET', 
           volumeLots,
           requestedPrice: orderType === 'PENDING' ? (requestedPrice || livePrice.bid) : undefined,
           stopLoss: stopLoss || undefined,
           takeProfit: takeProfit || undefined,
        })
      });
      fetchData();
      showToast(`${orderType === 'MARKET' ? 'Market' : 'Pending'} ${side} order placed`, 'success');
      setActiveModal(null);
    } catch (e: any) {
      showToast(`Order Failed: ${e.message}`, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const [pendingOrder, setPendingOrder] = useState<{side: 'BUY' | 'SELL'} | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    // OPTIMISTIC UPDATE: Remove instantly from list
    const orderToCancel = pending.find(o => o.id === orderId);
    setPending(prev => prev.filter(o => o.id !== orderId));

    try {
      await fetchApi(`/trading/orders/${orderId}`, { method: 'DELETE' });
      fetchData();
      showToast('Pending order cancelled', 'info');
    } catch (e: any) {
      // ROLLBACK if failed
      if (orderToCancel) setPending(prev => [orderToCancel, ...prev]);
      showToast('Failed to cancel order', 'error');
    }
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    localStorage.setItem('trading_disclaimer_accepted', 'true');
    setActiveModal(null);
    showToast('Advanced trading modes activated', 'success');
  };

  const handleClosePosition = async (id: string) => {
    // OPTIMISTIC UPDATE: Remove instantly from UI
    const posToClose = positions.find(p => p.id === id);
    setPositions(prev => prev.filter(p => p.id !== id));
    
    try {
      await fetchApi(`/trading/positions/${id}/close`, { method: 'POST' });
      showToast('Position closed instantly', 'success');
      // Refresh background data to sync history and balances
      fetchData();
    } catch (e: any) {
      // ROLLBACK if failed
      if (posToClose) setPositions(prev => [posToClose, ...prev]);
      const errMsg = e.response?.data?.message || e.message || 'Unknown error';
      showToast(`Failed to close: ${errMsg}`, 'error');
      console.error('Position close error:', e);
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const startBottomResizing = (e: React.MouseEvent) => {
    setIsBottomResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing && !isBottomResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        setLeftWidth(Math.min(Math.max(200, e.clientX - 48), 600));
      }
      if (isBottomResizing) {
        const newHeight = window.innerHeight - e.clientY - 38; // 38 is footer
        setBottomHeight(Math.min(Math.max(42, newHeight), 600));
        if (newHeight > 60) setIsBottomOpen(true);
        else setIsBottomOpen(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsBottomResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isBottomResizing]);

  // Chart Auto-fit Logic
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      chartRef.current?.autoFit();
    });
    
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) observer.observe(chartContainer);
    
    return () => observer.disconnect();
  }, [activeSymbol, isRightOpen, activeSidebarTab]);

  const toggleGrid = () => {
    const next = !gridVisible;
    setGridVisible(next);
    chartRef.current?.toggleGrid(next);
    showToast(`Grid ${next ? 'enabled' : 'disabled'}`, 'info');
  };

  const clearDrawings = () => {
    drawingRef.current?.clearAll();
    showToast('All drawings cleared', 'info');
  };

  return (
    <div className="fixed inset-0 bg-[#0c0d10] text-[#848e9c] z-[100] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-[52px] bg-exness-panel border-b border-exness-border flex items-center justify-between z-50 px-4">
        <div className="flex items-center h-full gap-8">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
             <span className="font-extrabold text-[22px] tracking-tighter text-exness-yellow">exness</span>
          </div>
          
          <div className="flex items-center h-full text-[12px] font-bold text-exness-text-muted">
            {navbarSymbols.map(sym => (
              <div 
                key={sym} 
                onClick={() => setActiveSymbol(sym)} 
                className={`px-4 flex items-center h-[52px] cursor-pointer transition-all relative group ${activeSymbol === sym ? 'bg-exness-panel-alt text-exness-text-main font-black' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
                    <img 
                      src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.substring(0, 3).toLowerCase()}.png`} 
                      onError={(e) => { e.currentTarget.src = `https://flagcdn.com/w20/${sym.includes('USD') ? 'us' : 'eu'}.png` }}
                      className="w-full h-full object-cover" 
                      alt=""
                    />
                  </div>
                  <span className="tracking-tight">{sym}</span>
                  <span className={`ml-2 tabular-nums text-[11px] transition-colors ${prices[sym]?.direction === 'up' ? 'text-exness-green' : prices[sym]?.direction === 'down' ? 'text-exness-red' : 'text-exness-text-dim'}`}>
                    {prices[sym]?.bid ? (prices[sym].bid).toFixed(sym.includes('JPY') ? 2 : 5) : '...'}
                  </span>
                  {activeSymbol === sym && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-exness-yellow" />}
                </div>
                {navbarSymbols.length > 1 && (
                  <X
                    onClick={(e) => { e.stopPropagation(); setNavbarSymbols(prev => prev.filter(s => s !== sym)); if (activeSymbol === sym) setActiveSymbol(navbarSymbols.find(s => s !== sym) || '') }}
                    className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                  />
                )}
              </div>
            ))}
            <button 
              onClick={() => setShowAssetSearch(true)} 
              className="px-4 flex items-center h-full cursor-pointer hover:bg-white/5 text-xl font-light text-exness-text-main"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center h-full gap-5">
          {account && (
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowAccountSwitcher(true)}>
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 bg-exness-green/10 px-1.5 py-0.5 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-exness-green animate-pulse" />
                        <span className="text-[10px] font-black text-exness-green uppercase tracking-wider">{account.accountType === 'LIVE' ? 'Real' : 'Demo'} {account.platform || 'MT5'}</span>
                     </div>
                     <ChevronDown className="h-3 w-3 text-exness-text-dim group-hover:text-exness-text-main transition-colors" />
                  </div>
                  <span className="text-[14px] font-black text-exness-text-main tabular-nums group-hover:text-exness-yellow transition-colors">
                    {(parseFloat(account.balance) + totalPL).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
               </div>
            </div>
          )}
          
          <div className="flex items-center gap-1 border-l border-exness-border pl-4 text-exness-text-dim">
            <IconButton icon={Bell} onClick={() => showToast('No new notifications', 'info')} />
            <IconButton icon={Grid} onClick={() => setShowLayouts(true)} />
            <div className="h-8 w-8 rounded-full bg-exness-hover flex items-center justify-center cursor-pointer hover:bg-exness-text-dim/20 transition-all ml-2" onClick={() => setShowSettings(true)}>
              <User className="h-4 w-4 text-exness-text-main" />
            </div>
          </div>

          <Button 
            onClick={() => openWalletModal('deposit')} 
            className="bg-exness-yellow hover:bg-exness-yellow-hover text-exness-panel font-black h-[32px] px-6 rounded-md text-[13px] transition-transform active:scale-95"
          >
            Deposit
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-[48px] bg-exness-dark-bg border-r border-exness-border flex flex-col items-center py-4 z-40 gap-4">
          <SidebarIcon icon={Star} active={activeSidebarTab === 'instruments'} onClick={() => setActiveSidebarTab('instruments')} />
          <SidebarIcon icon={Activity} active={activeSidebarTab === 'portfolio'} onClick={() => setActiveSidebarTab('portfolio')} />
          <SidebarIcon icon={History} active={activeSidebarTab === 'history'} onClick={() => setActiveSidebarTab('history')} />
          <SidebarIcon icon={Newspaper} active={activeSidebarTab === 'news'} onClick={() => setActiveSidebarTab('news')} />
          <SidebarIcon icon={Calendar} active={activeSidebarTab === 'calendar'} onClick={() => setActiveSidebarTab('calendar')} />
          <div className="mt-auto flex flex-col items-center gap-4 w-full">
            <SidebarIcon icon={Wallet} active={activeSidebarTab === 'wallet'} onClick={() => setActiveSidebarTab('wallet')} />
            <SidebarIcon icon={MoreVertical} onClick={() => showToast('More options', 'info')} />
          </div>
        </aside>

        {/* Instruments Panel */}
        <motion.aside
          style={{ width: leftWidth }}
          className="bg-[#16181d] border-r border-[#2b2f36] flex flex-col z-30 relative"
        >
          {activeSidebarTab === 'instruments' && (
            <>
              <div className="p-3 border-b border-exness-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-exness-text-dim" />
                    <input 
                      type="text" 
                      placeholder="Search" 
                      className="w-full bg-exness-panel border border-exness-border rounded py-1.5 pl-9 pr-3 text-[13px] text-exness-text-main focus:border-exness-yellow outline-none transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="bg-exness-panel border border-exness-border rounded px-3 py-1.5 text-[12px] font-bold text-exness-text-main flex items-center gap-2 cursor-pointer hover:bg-exness-hover transition-all">
                    Favorites <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center text-[10px] uppercase font-black text-exness-text-dim px-4 py-2 border-b border-exness-border">
                  <div className="w-[100px]">Symbol</div>
                  <div className="w-[45px] text-center">Signal</div>
                  <div className="w-[70px] text-right">Bid</div>
                  <div className="w-[70px] text-right">Ask</div>
                  <div className="w-[60px] text-right">1D change</div>
                  <div className="w-[60px] text-right">P/L, USD</div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {instruments.filter(s => s.symbol.toUpperCase().includes(search.toUpperCase())).map(inst => {
                    const sym = inst.symbol;
                    const p = prices[sym] || { bid: inst.defaultPrice || 1.05, ask: (inst.defaultPrice || 1.05) + 0.0001, direction: 'neutral' };
                    const direction = p.direction;
                    const isActive = activeSymbol === sym;
                    
                    const change1d = (Math.random() * 2 - 1).toFixed(2);
                    const signal = Math.random() > 0.5 ? 'up' : 'down';
                    const activePos = positionsWithPL.filter(pos => pos.symbol === sym);
                    const instPL = activePos.reduce((sum, pos) => sum + pos.profit, 0);

                    const tickKey = `${sym}-${Math.round(p.bid * 10000)}`;
                    return (
                      <div 
                        key={sym} 
                        onClick={() => setActiveSymbol(sym)} 
                        className={`flex items-center text-[11px] px-4 py-2.5 cursor-pointer border-l-2 transition-all group ${isActive ? 'bg-exness-panel-alt border-exness-yellow text-exness-text-main' : 'border-transparent hover:bg-white/5 text-exness-text-secondary'}`}
                      >
                        <div className="w-[100px] flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-white/5">
                            <img 
                              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.substring(0, 3).toLowerCase()}.png`} 
                              onError={(e) => { e.currentTarget.src = `https://flagcdn.com/w20/${sym.includes('USD') ? 'us' : 'eu'}.png` }}
                              className="w-full h-full object-cover" 
                              alt=""
                            />
                          </div>
                          <span className={`font-bold tracking-tight ${isActive ? 'text-exness-text-main' : 'text-exness-text-secondary'}`}>{sym}</span>
                        </div>
                        
                        <div className="w-[45px] flex justify-center">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${direction === 'up' ? 'bg-[#03a66d]/20 text-[#03a66d]' : 'bg-[#cf304a]/20 text-[#cf304a]'}`}>
                            {direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </div>
                        </div>

                        {/* Bid — key causes remount to replay animation each tick */}
                        <div 
                          key={`bid-${tickKey}`}
                          onClick={(e) => { e.stopPropagation(); setActiveSymbol(sym); if (!isRightOpen) setIsRightOpen(true); }}
                          className={`w-[70px] text-right font-black tabular-nums cursor-pointer px-1 py-0.5 rounded ${
                            direction === 'up' ? 'animate-flash-green' : direction === 'down' ? 'animate-flash-red' : 'text-exness-text-main'
                          }`}
                        >
                          {p.bid.toFixed(sym.includes('JPY') ? 2 : 5)}
                        </div>

                        {/* Ask */}
                        <div 
                          key={`ask-${tickKey}`}
                          onClick={(e) => { e.stopPropagation(); setActiveSymbol(sym); if (!isRightOpen) setIsRightOpen(true); }}
                          className={`w-[70px] text-right font-black tabular-nums cursor-pointer px-1 py-0.5 rounded ${
                            direction === 'up' ? 'animate-flash-green' : direction === 'down' ? 'animate-flash-red' : 'text-exness-text-main'
                          }`}
                        >
                          {p.ask.toFixed(sym.includes('JPY') ? 2 : 5)}
                        </div>

                        <div className={`w-[60px] text-right font-bold tabular-nums ${parseFloat(change1d) >= 0 ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                          {parseFloat(change1d) >= 0 ? '+' : ''}{change1d}%
                        </div>

                        <div className={`w-[60px] text-right font-bold tabular-nums ${instPL >= 0 ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                          {instPL !== 0 ? instPL.toFixed(2) : '-'}
                        </div>

                        <div className="flex-1 flex justify-end">
                          <Star className={`h-3.5 w-3.5 transition-colors cursor-pointer ${isActive ? 'text-exness-yellow' : 'text-exness-text-dim hover:text-exness-yellow'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}


          {activeSidebarTab === 'news' && <NewsSidebar onClose={() => setActiveSidebarTab('instruments')} />}

          {activeSidebarTab === 'history' && (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                 <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">History</span>
                 <div className="flex bg-[#0c0d10] p-0.5 rounded text-[9px] font-black uppercase">
                    <button onClick={() => setHistoryType('orders')} className={`px-2 py-1 rounded transition-colors ${historyType === 'orders' ? 'bg-[#2b2f36] text-white' : 'text-[#5f6368] hover:text-white'}`}>Orders</button>
                    <button onClick={() => { setHistoryType('funds'); if (transactions.length === 0) fetchApi('/wallets/transactions').then(res => setTransactions(Array.isArray(res) ? res : res.data || [])); }} className={`px-2 py-1 rounded transition-colors ${historyType === 'funds' ? 'bg-[#2b2f36] text-white' : 'text-[#5f6368] hover:text-white'}`}>Funds</button>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {historyType === 'orders' ? (
                    history.length > 0 ? (
                      history.map(h => (
                        <div key={h.id} className="p-3.5 border-b border-[#2b2f36]/30 hover:bg-white/5 cursor-pointer transition-colors group">
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex flex-col">
                              <span className="font-black text-[12px] text-white tracking-tight uppercase">{h.instrumentSymbol || 'EURUSD'}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${h.side === 'BUY' ? 'text-[#1e75e4]' : 'text-[#cf304a]'}`}>{h.side} {h.volumeLots} Lot</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`font-black text-[13px] tabular-nums ${(parseFloat(h.profit) || 0) >= 0 ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                                {(parseFloat(h.profit) || 0) >= 0 ? '+' : ''}{h.profit || '0.00'}
                              </span>
                              <span className="text-[9px] text-[#5f6368] font-bold">USD</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] text-[#5f6368] font-medium border-t border-[#2b2f36]/20 pt-1.5 mt-1.5">
                            <span>Price: {h.executedPrice || '0.00000'}</span>
                            <span>{new Date(h.executedAt || h.closedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 grayscale opacity-20">
                        <History className="h-10 w-10 mb-2" />
                        <span className="text-[12px] font-bold">No history available</span>
                      </div>
                    )
                  ) : (
                    transactions.length > 0 ? (
                      transactions.map(tx => (
                        <div key={tx.id} className="p-3.5 border-b border-[#2b2f36]/30 hover:bg-white/5 cursor-pointer transition-colors group">
                           <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${tx.type === 'DEPOSIT' ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>{tx.type}</span>
                              <span className={`font-black text-[13px] tabular-nums ${tx.type === 'DEPOSIT' ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                                 {tx.type === 'DEPOSIT' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()}
                              </span>
                           </div>
                           <div className="flex justify-between items-end">
                              <span className="text-[11px] text-white font-bold">{tx.method || 'System'}</span>
                              <span className="text-[9px] text-[#5f6368] font-bold">{new Date(tx.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 grayscale opacity-20">
                        <Wallet className="h-10 w-10 mb-2" />
                        <span className="text-[12px] font-bold">No transactions found</span>
                      </div>
                    )
                  )}
               </div>
            </div>
          )}

          {activeSidebarTab === 'portfolio' && (
            <div className="flex flex-col h-full">
               <div className="p-4 border-b border-[#2b2f36]">
                 <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">Portfolio Performance</span>
               </div>
               <div className="p-4 flex flex-col gap-4">
                  <div className="bg-[#0c0d10] p-4 rounded border border-[#2b2f36]">
                     <span className="text-[10px] text-[#5f6368] font-black uppercase mb-1">Today's Profit</span>
                     <div className={`text-[24px] font-black ${totalPL >= 0 ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                        {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)} USD
                     </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between text-[11px] font-bold"><span>Total Equity</span><span>{parseFloat(account?.equity || '0').toLocaleString()} USD</span></div>
                     <div className="flex justify-between text-[11px] font-bold"><span>Margin Level</span><span>{parseFloat(account?.marginLevel || '0').toFixed(2)}%</span></div>
                  </div>
                  <button onClick={() => navigate('/analytics')} className="w-full mt-2 py-2.5 bg-[#2b2f36] hover:bg-[#32363d] text-white text-[11px] font-bold rounded flex items-center justify-center gap-2 transition-colors">
                     Full Statistics <ExternalLink className="h-3 w-3" />
                  </button>
               </div>
            </div>
          )}

          {activeSidebarTab === 'news' && (
            <div className="flex flex-col h-full bg-[#16181d] animate-in fade-in duration-300">
               <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                 <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">Market News</span>
                 <X onClick={() => setActiveSidebarTab('instruments')} className="h-4 w-4 text-[#5f6368] cursor-pointer hover:text-white" />
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                 {[
                   { id: 1, title: 'Federal Reserve Monetary Policy Update', time: '10m ago', impact: 'high', category: 'Central Banks', body: 'The Federal Reserve indicated a cautious approach to rate adjustments for the first half of 2025.' },
                   { id: 2, title: 'EUR/USD eyes 1.0600 level after ECB comments', time: '45m ago', impact: 'medium', category: 'Forex', body: 'ECB officials suggested that inflation targets are within reach, supporting the Euro.' },
                   { id: 3, title: 'Gold hits record highs on geopolitical tension', time: '2h ago', impact: 'high', category: 'Metals', body: 'Safe-haven demand continues to drive gold prices as global uncertainties persist.' },
                   { id: 4, title: 'BoE inflation report surprises markets', time: '4h ago', impact: 'high', category: 'Economics', body: 'The Bank of England released a report showing a faster-than-expected return to inflation targets.' },
                 ].map((news) => (
                   <div 
                     key={news.id} 
                     onClick={() => setSelectedNews(news)}
                     className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-exness-border group"
                   >
                     <div className="flex items-center gap-2 mb-1.5">
                       <span className={`h-1.5 w-1.5 rounded-full ${news.impact === 'high' ? 'bg-[#f04438]' : 'bg-[#1c6ed4]'}`} />
                       <span className="text-[9px] font-black text-exness-text-dim uppercase">{news.time}</span>
                     </div>
                     <h4 className="text-[12px] font-bold text-[#d1d4dc] group-hover:text-white leading-snug line-clamp-2">{news.title}</h4>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeSidebarTab === 'calendar' && (
            <div className="flex flex-col h-full bg-[#16181d] animate-in fade-in duration-300">
               <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                 <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">Economic Calendar</span>
                 <X onClick={() => setActiveSidebarTab('instruments')} className="h-4 w-4 text-[#5f6368] cursor-pointer hover:text-white" />
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                 {[
                   { id: 1, time: '14:30', event: 'Initial Jobless Claims (US)', impact: 'high', forecast: '220k', actual: '225k' },
                   { id: 2, time: '16:00', event: 'Consumer Confidence (EU)', impact: 'medium', forecast: '-10.5', actual: '' },
                   { id: 3, time: '20:15', event: 'API Crude Oil Stock (US)', impact: 'low', forecast: '5.2M', actual: '' },
                   { id: 4, time: '01:30', event: 'Employment Change (AU)', impact: 'high', forecast: '25.0K', actual: '35.6K' },
                 ].map((ev) => (
                   <div 
                     key={ev.id} 
                     onClick={() => setSelectedEvent(ev)}
                     className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-exness-border group"
                   >
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-[9px] font-black text-exness-yellow uppercase">{ev.time}</span>
                         <div className="flex gap-0.5">
                            {[1,2,3].map(i => <div key={i} className={`h-1 w-1 rounded-full ${i <= (ev.impact === 'high' ? 3 : ev.impact === 'medium' ? 2 : 1) ? 'bg-exness-yellow' : 'bg-white/10'}`} />)}
                         </div>
                      </div>
                      <h4 className="text-[12px] font-bold text-[#d1d4dc] group-hover:text-white leading-snug">{ev.event}</h4>
                      <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-exness-text-dim">
                         <span>F: {ev.forecast}</span>
                         <span>A: {ev.actual || '-'}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeSidebarTab === 'wallet' && (
            <div className="flex flex-col h-full bg-[#16181d]">
               <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                 <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">Wallet</span>
                 <X onClick={() => setActiveSidebarTab('instruments')} className="h-4 w-4 text-[#5f6368] cursor-pointer hover:text-white" />
               </div>
               <div className="p-6 flex flex-col items-center text-center gap-6">
                  <div className="w-16 h-16 bg-[#2b2f36] rounded-full flex items-center justify-center">
                     <Wallet className="h-7 w-7 text-[#ffce00]" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-[16px] mb-1">Trading Balance</h3>
                    <p className="text-[28px] text-[#ffce00] font-black tracking-tight">{parseFloat(account?.balance || '0').toLocaleString()} USD</p>
                  </div>
                  <div className="w-full flex flex-col gap-2">
                     <button onClick={() => openWalletModal('deposit')} className="w-full py-3 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black rounded text-[13px] transition-all active:scale-[0.98]">Deposit</button>
                     <button onClick={() => openWalletModal('withdraw')} className="w-full py-3 bg-[#2b2f36] hover:bg-[#32363d] text-white font-black rounded text-[13px] transition-all active:scale-[0.98]">Withdrawal</button>
                  </div>
               </div>
            </div>
          )}

          <div
            onMouseDown={startResizing}
            className={`absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#ffce00]/50 transition-colors z-50 ${isResizing ? 'bg-[#ffce00]' : ''}`}
          />
        </motion.aside>

        {/* Chart Panel */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="h-[36px] bg-[#16181d] border-b border-[#2b2f36] flex items-center px-4 justify-between">
            <div className="flex items-center gap-4 text-[12px] font-bold text-[#848e9c]">
              <div className="flex items-center gap-2 hover:text-white cursor-pointer"><Plus className="h-4 w-4" /> Symbols</div>
              <div
                onClick={() => setTimeframe('1H')}
                className={`flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors ${timeframe === '1H' ? 'bg-[#2b2f36] text-white' : 'hover:text-white'}`}
              >
                1h
              </div>
              <div
                onClick={() => setTimeframe('1M')}
                className={`flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors ${timeframe === '1M' ? 'bg-[#2b2f36] text-white' : 'hover:text-white'}`}
              >
                1m
              </div>
              <div className="w-px h-3.5 bg-[#2b2f36]" />
              <div className="flex items-center gap-2 hover:text-white cursor-pointer" onClick={() => setShowIndicators(true)}><Focus className="h-4 w-4" /> Indicators</div>
              <div className="flex items-center gap-2 hover:text-white cursor-pointer" onClick={toggleGrid}>
                <Grid className={`h-4 w-4 ${gridVisible ? 'text-[#ffce00]' : ''}`} /> Grid
              </div>
            </div>
            <button onClick={() => showToast('Chart layout saved', 'success')} className="text-[11px] font-black text-[#ffce00] uppercase tracking-wider hover:opacity-80 transition-opacity">Save</button>
          </div>

          <div className="flex-1 flex relative">
            {/* Left Toolbar */}
            <div className="w-[36px] bg-[#16181d] border-r border-[#2b2f36] flex flex-col items-center py-2 gap-4 text-[#848e9c]">
              <ToolIcon
                icon={Plus}
                active={mode === 'DRAW'}
                onClick={() => setMode(prev => prev === 'DRAW' ? 'NAV' : 'DRAW')}
              />
              <ToolIcon icon={ArrowUpCircle} />
              <div className="w-4 h-px bg-[#2b2f36]" />
              <ToolIcon icon={Focus} />
              <ToolIcon icon={Magnet} />
              <ToolIcon icon={Trash2} onClick={clearDrawings} />
            </div>

            <div className="flex-1 relative overflow-hidden chart-container">
              <TradingChart ref={chartRef} data={candles} livePrice={livePrice} positions={positionsWithPL} timeframe={timeframe} />
              <DrawingLayer
                ref={drawingRef}
                chartRef={chartRef}
                mode={mode}
                setMode={setMode}
              />

              {/* Watermark/Legend */}
              <div className="absolute top-4 left-4 z-10 text-[11px] font-mono select-none">
                <div className="text-white font-bold">{activeInstrument?.displayName || activeSymbol} • {timeframe.toLowerCase()}</div>
                {candles.length > 0 && (
                  <div className="flex gap-2 text-[#848e9c] mt-0.5 text-[10px]">
                    <span className="tabular-nums text-exness-red">O <span className="text-exness-red/80">{Number(candles[candles.length - 1].open).toFixed(activeSymbol.includes('JPY') ? 2 : 5)}</span></span>
                    <span className="tabular-nums text-exness-red">H <span className="text-exness-red/80">{Number(candles[candles.length - 1].high).toFixed(activeSymbol.includes('JPY') ? 2 : 5)}</span></span>
                    <span className="tabular-nums text-exness-red">L <span className="text-exness-red/80">{Number(candles[candles.length - 1].low).toFixed(activeSymbol.includes('JPY') ? 2 : 5)}</span></span>
                    <span className="tabular-nums text-exness-red">C <span className="text-exness-red/80">{livePrice.bid}</span></span>
                    {candles[0] && (
                      <span className="ml-1 text-exness-red/60">
                        {(livePrice.bid - Number(candles[0].open)).toFixed(2)} ({((livePrice.bid - Number(candles[0].open)) / Number(candles[0].open) * 100).toFixed(2)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Tabs & Monitor */}
          <div 
            style={{ height: isBottomOpen ? bottomHeight : 42 }}
            className="bg-[#16181d] border-t border-[#2b2f36] flex flex-col relative transition-[height] duration-200 ease-out"
          >
            {/* Bottom Resizer */}
            <div 
              onMouseDown={startBottomResizing}
              className="absolute top-0 left-0 right-0 h-[4px] cursor-row-resize hover:bg-exness-yellow/50 transition-colors z-50"
            />

            <div className="flex text-[12px] font-bold border-b border-[#2b2f36] items-center justify-between pr-4">
              <div className="flex">
                <BottomTab active={activeTab === 'open'} label={`Open (${positions.length})`} onClick={() => setActiveTab('open')} />
                <BottomTab active={activeTab === 'pending'} label={`Pending (${pending.length})`} onClick={() => setActiveTab('pending')} />
                <BottomTab active={activeTab === 'closed'} label="Closed" onClick={() => setActiveTab('closed')} />
              </div>
              <button 
                onClick={() => setIsBottomOpen(!isBottomOpen)}
                className="p-1.5 hover:bg-white/5 rounded transition-colors text-exness-text-dim"
              >
                {isBottomOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar bg-[#0c0d10] ${!isBottomOpen ? 'hidden' : ''}`}>
              <table className="w-full text-left text-[11px] font-medium border-separate border-spacing-0">
                <thead className="sticky top-0 bg-[#16181d] text-[#5f6368] uppercase tracking-wider font-black text-[10px] z-10">
                  <tr>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Order ID</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Symbol</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Type</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Volume</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Open Price</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]">Current</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36] text-right">Profit (USD)</th>
                    <th className="px-4 py-2 border-b border-[#2b2f36]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2126]">
                  {activeTab === 'open' && (positionsWithPL.length > 0 ? (
                    positionsWithPL.map(pos => (
                      <tr key={pos.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[#d1d4dc]">#{pos.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 text-white font-bold">{pos.instrumentSymbol}</td>
                        <td className={`px-4 py-3 font-black ${pos.side === 'BUY' ? 'text-exness-blue' : 'text-exness-red'}`}>{pos.side}</td>
                        <td className="px-4 py-3 text-[#848e9c]">{pos.volumeLots}</td>
                        <td className="px-4 py-3 text-[#d1d4dc]">{(pos.entryPrice || 0).toFixed(5)}</td>
                        <td className="px-4 py-3 text-[#d1d4dc]">{(pos.currentPrice || 0).toFixed(5)}</td>
                        <td className={`px-4 py-3 text-right font-black tabular-nums ${(pos.profit || 0) >= 0 ? 'text-exness-green' : 'text-exness-red'}`}>
                          {(pos.profit || 0) >= 0 ? '+' : ''}{(pos.profit || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleClosePosition(pos.id)} className="text-[#848e9c] hover:text-exness-red p-1"><X className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Briefcase className="h-10 w-10 text-exness-text-dim" />
                          <span className="text-[13px] font-medium text-exness-text-dim">No open positions</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'pending' && (pending.length > 0 ? (
                    pending.map(ord => (
                      <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[#d1d4dc]">#{ord.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 text-white font-bold">{ord.instrumentSymbol}</td>
                        <td className={`px-4 py-3 font-black ${ord.side === 'BUY' ? 'text-[#1e75e4]' : 'text-[#d6344d]'}`}>{ord.type} {ord.side}</td>
                        <td className="px-4 py-3 text-[#848e9c]">{ord.volumeLots}</td>
                        <td className="px-4 py-3 text-[#d1d4dc]">{(ord.requestedPrice || 0).toFixed(5)}</td>
                        <td className="px-4 py-3 text-[#d1d4dc]">{(prices[ord.instrumentSymbol]?.bid || 0).toFixed(5)}</td>
                        <td className="px-4 py-3 text-right text-[#5f6368]">PENDING</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleCancelOrder(ord.id)} className="text-[#848e9c] hover:text-[#d6344d] p-1"><X className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} className="py-12 text-center text-[#5f6368] italic">No pending orders</td></tr>
                  ))}
                  {activeTab === 'closed' && history.map(h => (
                    <tr key={h.id} className="opacity-70">
                      <td className="px-4 py-2 text-[#5f6368]">#{h.id.substring(0, 8)}</td>
                      <td className="px-4 py-2 text-[#d1d4dc]">{h.instrumentSymbol}</td>
                      <td className="px-4 py-2">{h.side}</td>
                      <td className="px-4 py-2">{h.volumeLots}</td>
                      <td className="px-4 py-2">{h.executedPrice}</td>
                      <td className="px-4 py-2">-</td>
                      <td className={`px-4 py-2 text-right ${parseFloat(h.profit) >= 0 ? 'text-[#4fba73]' : 'text-[#d6344d]'}`}>{h.profit}</td>
                      <td className="px-4 py-2 text-right"><Info className="h-3 w-3 inline cursor-pointer" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-exness-dark-bg border-t border-exness-border h-[38px] flex items-center px-4 text-[10px] text-exness-text-dim font-black uppercase tracking-widest gap-8">
              <div className="flex gap-2">EQUITY: <span className="text-exness-text-main">{(parseFloat(account?.balance || '0') + totalPL).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span></div>
              <div className="flex gap-2">FREE MARGIN: <span className="text-exness-text-main">{(parseFloat(account?.balance || '0') + totalPL - parseFloat(account?.margin || '0')).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span></div>
              <div className="flex gap-2">BALANCE: <span className="text-exness-text-main">{parseFloat(account?.balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span></div>
              <div className="flex gap-2">MARGIN: <span className="text-exness-text-secondary">{parseFloat(account?.margin || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span></div>
              <div className="flex gap-2 items-center">MARGIN LEVEL: <span className="text-exness-text-main">{parseFloat(account?.marginLevel || '0') > 0 ? parseFloat(account.marginLevel).toFixed(2) + '%' : '-'}</span></div>
              <div className="ml-auto flex items-center gap-1.5 text-exness-green opacity-80">
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-[3px] h-[4px] bg-exness-green" />
                  <div className="w-[3px] h-[7px] bg-exness-green" />
                  <div className="w-[3px] h-[10px] bg-exness-green" />
                </div>
                <span className="font-bold">Connected</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isRightOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="bg-exness-panel border-l border-exness-border flex flex-col z-30 overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-exness-panel-alt border-b border-exness-border">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
                    <img 
                      src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${activeSymbol.substring(0, 3).toLowerCase()}.png`} 
                      onError={(e) => { e.currentTarget.src = `https://flagcdn.com/w20/${activeSymbol.includes('USD') ? 'us' : 'eu'}.png` }}
                      className="w-full h-full object-cover" 
                      alt=""
                    />
                  </div>
                  <span className="text-exness-text-main font-black text-[13px] tracking-tight uppercase">{activeSymbol}</span>
                </div>
                <X onClick={() => setIsRightOpen(false)} className="h-[18px] w-[18px] text-exness-text-dim cursor-pointer hover:text-exness-text-main" />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-0 space-y-0">
                {/* 1. Header Dropdown */}
                <div className="p-4 border-b border-exness-border relative">
                  <div 
                    onClick={() => setFormDropdownOpen(!formDropdownOpen)}
                    className="flex items-center justify-between bg-exness-panel-alt px-3 py-2.5 rounded-lg border border-exness-border cursor-pointer hover:border-exness-text-dim transition-all group"
                  >
                    <span className="text-exness-text-main text-[13px] font-bold">
                       {orderFormType === 'REGULAR' ? 'Regular form' : orderFormType === 'ONE_CLICK' ? 'Fast form' : 'Risk Calculator form'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-exness-text-dim group-hover:text-exness-text-main" />
                  </div>
                  {formDropdownOpen && (
                     <div className="absolute top-full left-4 right-4 mt-1 bg-exness-panel-alt border border-exness-border rounded-lg shadow-xl z-50 overflow-hidden">
                        {[
                           { val: 'REGULAR', label: 'Regular form' },
                           { val: 'ONE_CLICK', label: 'Fast form' },
                           { val: 'RISK_CALC', label: 'Risk Calculator form' }
                        ].map(opt => (
                           <div 
                             key={opt.val}
                             onClick={() => { setOrderFormType(opt.val as any); setFormDropdownOpen(false); }}
                             className="px-4 py-3 hover:bg-exness-hover cursor-pointer text-[13px] font-bold text-exness-text-main transition-colors"
                           >
                              {opt.label}
                           </div>
                        ))}
                     </div>
                  )}
                </div>

                {/* 2. Parallel Price Headers */}
                <div className="p-4 space-y-4">
                  <div className="relative">
                    <div className="flex gap-1 h-[72px]">
                      <button 
                        onClick={() => setSelectedSide('SELL')} 
                        className={`flex-1 bg-exness-panel-alt border rounded-[4px] p-3 text-left relative transition-all group ${selectedSide === 'SELL' ? 'border-exness-red bg-exness-red/10' : 'border-exness-border hover:bg-exness-red/5 hover:border-exness-red/30'}`}
                      >
                        <span className={`block text-[10px] font-bold uppercase mb-1 ${selectedSide === 'SELL' ? 'text-exness-red' : 'text-exness-text-muted group-hover:text-exness-red'}`}>Sell</span>
                        <span className={`block text-[20px] font-black tabular-nums leading-none ${selectedSide === 'SELL' ? 'text-white' : 'text-exness-red'}`}>{livePrice.bid}</span>
                      </button>
                      <button 
                        onClick={() => setSelectedSide('BUY')} 
                        className={`flex-1 bg-exness-panel-alt border rounded-[4px] p-3 text-right relative transition-all group ${selectedSide === 'BUY' ? 'border-exness-blue bg-exness-blue/10' : 'border-exness-border hover:bg-exness-blue/5 hover:border-exness-blue/30'}`}
                      >
                        <span className={`block text-[10px] font-bold uppercase mb-1 ${selectedSide === 'BUY' ? 'text-exness-blue' : 'text-exness-text-muted group-hover:text-exness-blue'}`}>Buy</span>
                        <span className={`block text-[20px] font-black tabular-nums leading-none ${selectedSide === 'BUY' ? 'text-white' : 'text-exness-blue'}`}>{livePrice.ask}</span>
                      </button>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="bg-exness-panel border border-exness-border rounded-[2px] px-2 py-0.5 text-[9px] font-black text-exness-text-main z-10 whitespace-nowrap">
                        {Math.abs(livePrice.ask - livePrice.bid).toFixed(activeSymbol.includes('JPY') ? 2 : 5)} USD
                      </div>
                    </div>
                  </div>

                  {/* 3. Sentiment Bar */}
                  <div className="space-y-1.5 pt-1">
                     <div className="flex justify-between text-[10px] font-black tabular-nums">
                        <span className="text-exness-red">56%</span>
                        <span className="text-exness-blue">44%</span>
                     </div>
                     <div className="h-1 bg-exness-hover rounded-full overflow-hidden flex">
                        <div className="w-[56%] bg-exness-red h-full" />
                        <div className="flex-1 bg-exness-blue h-full" />
                     </div>
                  </div>

                  {/* 4. Type Tabs */}
                  <div className="flex bg-exness-panel-alt p-1 rounded-lg gap-1 border border-exness-border/50">
                    <button onClick={() => setOrderType('MARKET')} className={`flex-1 py-2 rounded-md text-[12px] font-black uppercase transition-all ${orderType === 'MARKET' ? 'bg-[#2b2f36] text-exness-text-main shadow-sm' : 'text-exness-text-dim hover:text-exness-text-secondary'}`}>Market</button>
                    <button onClick={() => setOrderType('PENDING')} className={`flex-1 py-2 rounded-md text-[12px] font-black uppercase transition-all ${orderType === 'PENDING' ? 'bg-[#2b2f36] text-exness-text-main shadow-sm' : 'text-exness-text-dim hover:text-exness-text-secondary'}`}>Pending</button>
                  </div>

                  {/* 5. Numeric Controls */}
                  <div className="space-y-4 pt-2">
                     {orderType === 'PENDING' && (
                        <NumericInput 
                          label="Open Price" 
                          unit="Price" 
                          value={requestedPrice ? requestedPrice.toFixed(5) : livePrice.bid.toFixed(5)} 
                          onInc={() => setRequestedPrice(v => (v || livePrice.bid) + 0.0001)} 
                          onDec={() => setRequestedPrice(v => (v || livePrice.bid) - 0.0001)} 
                          onChange={(v: string) => setRequestedPrice(parseFloat(v) || null)}
                        />
                     )}
                     <NumericInput 
                       label={orderFormType === 'RISK_CALC' ? 'Risk Amount' : 'Volume'} 
                       unit={orderFormType === 'RISK_CALC' ? 'USD' : 'Lots'} 
                       value={volumeLots.toFixed(2)} 
                       onInc={() => setVolumeLots(v => v + 0.01)} 
                       onDec={() => setVolumeLots(v => Math.max(0.01, v - 0.01))} 
                       onChange={(v: string) => setVolumeLots(parseFloat(v) || 0.01)}
                     />
                     <NumericInput 
                       label="Take Profit" 
                       unit={slTpUnit === 'PRICE' ? 'Price' : slTpUnit === 'PIPS' ? 'Pips' : 'USD'} 
                       value={takeProfit ? takeProfit.toFixed(5) : "Not set"} 
                       isPlaceholder={!takeProfit}
                       onInc={() => setTakeProfit(v => (v || livePrice.bid) + 0.0001)} 
                       onDec={() => setTakeProfit(v => (v || livePrice.bid) - 0.0001)} 
                       onChange={(v: string) => setTakeProfit(parseFloat(v) || null)}
                     />
                     <NumericInput 
                       label="Stop Loss" 
                       unit={slTpUnit === 'PRICE' ? 'Price' : slTpUnit === 'PIPS' ? 'Pips' : 'USD'} 
                       value={stopLoss ? stopLoss.toFixed(5) : "Not set"} 
                       isPlaceholder={!stopLoss}
                       onInc={() => setStopLoss(v => (v || livePrice.ask) + 0.0001)} 
                       onDec={() => setStopLoss(v => Math.max(0, (v || livePrice.ask) - 0.0001))} 
                       onChange={(v: string) => setStopLoss(parseFloat(v) || null)}
                     />
                  </div>
                </div>
              </div>
              
              {/* 6. Footer Primary Action */}
              <div className="p-4 border-t border-exness-border bg-exness-panel space-y-3">
                {selectedSide ? (
                  <>
                    <button 
                      onClick={() => { handlePlaceOrder(selectedSide); setSelectedSide(null); }} 
                      className={`w-full py-4 font-black uppercase tracking-widest text-[14px] rounded-lg transition-all active:scale-[0.98] shadow-lg text-white ${selectedSide === 'BUY' ? 'bg-exness-blue hover:bg-[#1561bd]' : 'bg-exness-red hover:bg-[#b02b40]'}`}
                    >
                      Confirm {selectedSide === 'BUY' ? 'Buy' : 'Sell'} {volumeLots} lots
                    </button>
                    <button 
                      onClick={() => setSelectedSide(null)}
                      className="w-full py-2 text-exness-text-dim hover:text-white text-[12px] font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    disabled
                    className="w-full py-4 bg-exness-hover text-exness-text-dim font-black uppercase tracking-widest text-[14px] rounded-lg cursor-not-allowed"
                  >
                    Select Buy or Sell
                  </button>
                )}
              </div>
            </motion.aside>

          )}
        </AnimatePresence>

        {!isRightOpen && (
          <div
            onClick={() => setIsRightOpen(true)}
            className="w-[32px] bg-[#16181d] border-l border-[#2b2f36] flex flex-col items-center py-4 cursor-pointer hover:bg-white/5 text-[#5f6368] hover:text-[#ffce00] transition-colors"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAssetSearch && (
          <TerminalModal title="Search Assets" onClose={() => setShowAssetSearch(false)}>
            <div className="bg-[#0c0d10] border border-[#2b2f36] rounded-lg px-4 py-3 flex items-center gap-3 mb-6">
              <Search className="h-5 w-5 text-[#ffce00]" />
              <input autoFocus type="text" placeholder="Search symbols (BTC, EUR, Gold...)" className="bg-transparent border-none text-white outline-none w-full text-[16px] placeholder:text-[#5f6368]" onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setShowAssetSearch(false)} />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {instruments.filter(i => i.symbol.toUpperCase().includes(search.toUpperCase())).map(inst => (
                <div key={inst.symbol} onClick={() => { setActiveSymbol(inst.symbol); if (!navbarSymbols.includes(inst.symbol)) setNavbarSymbols(prev => [...prev.slice(-4), inst.symbol]); setShowAssetSearch(false); }} className="p-3 bg-white/5 hover:bg-[#ffce00]/10 border border-transparent hover:border-[#ffce00]/30 rounded cursor-pointer transition-all flex items-center justify-between group">
                  <span className="text-white font-black">{inst.symbol}</span>
                  <Plus className="h-3 w-3 text-[#5f6368] group-hover:text-[#ffce00]" />
                </div>
              ))}
            </div>
          </TerminalModal>
        )}

        {showLayouts && (
          <TerminalModal title="Chart Layout" onClose={() => setShowLayouts(false)}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'single', label: 'Single Chart', icon: LayoutIcon },
                { id: 'dual-v', label: 'Dual Vertical', icon: ListIcon },
                { id: 'dual-h', label: 'Dual Horizontal', icon: Grid },
                { id: 'quad', label: 'Quad View', icon: Grid }
              ].map(l => (
                <div 
                  key={l.id} 
                  onClick={() => { setChartLayout(l.id); setShowLayouts(false); showToast(`Layout changed to ${l.label}`, 'success'); }}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all ${chartLayout === l.id ? 'bg-exness-yellow/10 border-exness-yellow shadow-lg shadow-exness-yellow/5' : 'bg-white/5 border-exness-border hover:bg-white/10'}`}
                >
                  <l.icon className={`h-8 w-8 ${chartLayout === l.id ? 'text-exness-yellow' : 'text-exness-text-dim'}`} />
                  <span className={`text-[12px] font-black uppercase tracking-wider ${chartLayout === l.id ? 'text-exness-text-main' : 'text-exness-text-dim'}`}>{l.label}</span>
                </div>
              ))}
            </div>
          </TerminalModal>
        )}

        {showIndicators && (
          <TerminalModal title="Indicators" onClose={() => setShowIndicators(false)}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {['Moving Average', 'RSI', 'MACD', 'Bollinger Bands', 'Stochastic', 'ATR', 'Volume'].map(ind => (
                <div 
                  key={ind} 
                  onClick={() => { showToast(`${ind} added to chart`, 'success'); setShowIndicators(false); }}
                  className="p-4 bg-white/5 hover:bg-exness-yellow/10 border border-transparent hover:border-exness-yellow/30 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <span className="text-white font-bold">{ind}</span>
                  <Plus className="h-4 w-4 text-exness-text-dim group-hover:text-exness-yellow" />
                </div>
              ))}
            </div>
          </TerminalModal>
        )}

        {showSettings && (
          <TerminalModal title="Terminal Settings" onClose={() => setShowSettings(false)}>
            <div className="space-y-6">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-exness-text-dim uppercase tracking-widest">General</h4>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-exness-border">
                     <div>
                       <span className="text-[13px] font-bold text-exness-text-main">One-click trading</span>
                       <p className="text-[10px] text-exness-text-dim mt-0.5">Skip confirmation dialog when placing orders</p>
                     </div>
                     <div 
                       onClick={() => setOneClickTrading(!oneClickTrading)}
                       className={`w-10 h-5 rounded-full relative p-1 cursor-pointer transition-colors ${oneClickTrading ? 'bg-exness-yellow' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-3 h-3 rounded-full shadow-sm transition-all ${oneClickTrading ? 'right-1 bg-exness-panel' : 'left-1 bg-white/40'}`} />
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-exness-border">
                     <span className="text-[13px] font-bold text-exness-text-main">Sound notifications</span>
                     <div className="w-10 h-5 bg-white/10 rounded-full relative p-1 cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full shadow-sm" />
                     </div>
                  </div>
               </div>
               
               <button 
                  onClick={() => { navigate('/profile'); setShowSettings(false); }}
                  className="w-full py-4 bg-exness-hover border border-exness-border text-exness-text-main font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
               >
                  Go to Personal Area <ExternalLink className="h-4 w-4" />
               </button>

               <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  className="w-full py-4 text-exness-red font-black uppercase tracking-widest text-[11px] hover:bg-exness-red/5 transition-all rounded-xl"
               >
                  Log out
               </button>
            </div>
          </TerminalModal>
        )}

        {showAccountSwitcher && (
          <TerminalModal title="Switch Account" onClose={() => setShowAccountSwitcher(false)}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {allAccounts.map(acc => (
                <div 
                  key={acc.id} 
                  onClick={() => { setAccount(acc); navigate(`/terminal?accountId=${acc.id}`); setShowAccountSwitcher(false); showToast(`Switched to account ${acc.accountNumber}`, 'success'); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${account?.id === acc.id ? 'bg-exness-yellow/10 border-exness-yellow' : 'bg-white/5 border-exness-border hover:bg-white/10'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-white">#{acc.accountNumber}</span>
                    <span className="text-[11px] font-bold text-exness-text-dim uppercase">{acc.accountType} STANDARD</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-black text-exness-yellow tabular-nums">{parseFloat(acc.balance).toLocaleString()} USD</div>
                    <div className="text-[10px] text-exness-text-dim">BALANCE</div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => navigate('/accounts')}
                className="w-full py-4 mt-2 border border-dashed border-exness-border rounded-xl text-exness-text-dim text-[12px] font-bold hover:border-exness-yellow hover:text-exness-yellow transition-all"
              >
                Manage Accounts
              </button>
            </div>
          </TerminalModal>
        )}

        {selectedNews && (
          <TerminalModal title="Market News" onClose={() => setSelectedNews(null)}>
            <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedNews.impact === 'high' ? 'bg-exness-red/20 text-exness-red' : 'bg-exness-blue/20 text-exness-blue'}`}>
                    {selectedNews.impact} impact
                  </span>
                  <span className="text-[11px] font-bold text-exness-text-dim uppercase">{selectedNews.category}</span>
                  <span className="text-[11px] font-bold text-exness-text-dim ml-auto">{selectedNews.time}</span>
               </div>
               <h3 className="text-[18px] font-black text-white leading-tight">{selectedNews.title}</h3>
               <p className="text-[14px] text-exness-text-secondary leading-relaxed">{selectedNews.body}</p>
               <button 
                 onClick={() => navigate('/news')}
                 className="w-full py-4 bg-white/5 border border-exness-border text-exness-text-main font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white/10 transition-all"
               >
                 View More Headlines
               </button>
            </div>
          </TerminalModal>
        )}

        {selectedEvent && (
          <TerminalModal title="Economic Event" onClose={() => setSelectedEvent(null)}>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-black text-white leading-tight">{selectedEvent.event}</h3>
                  <div className="text-right">
                    <div className="text-[12px] font-black text-exness-text-main">{selectedEvent.time}</div>
                    <div className="text-[10px] font-bold text-exness-text-dim">LOCAL TIME</div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-exness-border">
                     <span className="text-[10px] font-black text-exness-text-dim uppercase">Forecast</span>
                     <div className="text-[18px] font-black text-white tabular-nums">{selectedEvent.forecast}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-exness-border">
                     <span className="text-[10px] font-black text-exness-text-dim uppercase">Actual</span>
                     <div className={`text-[18px] font-black tabular-nums ${selectedEvent.actual ? 'text-exness-green' : 'text-exness-text-dim'}`}>
                        {selectedEvent.actual || 'Pending'}
                     </div>
                  </div>
               </div>
               <p className="text-[12px] text-exness-text-secondary leading-relaxed bg-exness-blue/5 p-4 rounded-xl border border-exness-blue/10">
                  <Info className="h-4 w-4 inline mr-2 text-exness-blue" />
                  This event is considered <span className="font-bold text-exness-text-main">{selectedEvent.impact} impact</span> and may cause significant volatility in relevant currency pairs.
               </p>
               <button 
                 onClick={() => navigate('/calendar')}
                 className="w-full py-4 bg-white/5 border border-exness-border text-exness-text-main font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white/10 transition-all"
               >
                 Full Calendar View
               </button>
            </div>
          </TerminalModal>
        )}
        {/* Order Confirmation Modal */}
        {activeModal === 'order_confirm' && pendingOrder && (
          <TerminalModal title="Confirm Order" onClose={() => { setActiveModal(null); setPendingOrder(null); }}>
            <div className="space-y-5">
              <div className="bg-[#0c0d10] border border-[#2b2f36] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-[#848e9c] uppercase tracking-widest">Order Details</span>
                  <span className={`text-[12px] font-black uppercase px-3 py-1 rounded ${pendingOrder.side === 'BUY' ? 'bg-[#1e75e4]/20 text-[#1e75e4]' : 'bg-[#cf304a]/20 text-[#cf304a]'}`}>{pendingOrder.side}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#848e9c] font-bold">Symbol</span>
                    <span className="text-white font-black">{activeSymbol}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#848e9c] font-bold">Type</span>
                    <span className="text-white font-black">{orderType}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#848e9c] font-bold">Volume</span>
                    <span className="text-white font-black">{volumeLots} lots</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#848e9c] font-bold">Price</span>
                    <span className="text-white font-black">{pendingOrder.side === 'BUY' ? livePrice.ask : livePrice.bid}</span>
                  </div>
                  {stopLoss && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#848e9c] font-bold">Stop Loss</span>
                      <span className="text-[#cf304a] font-black">{stopLoss}</span>
                    </div>
                  )}
                  {takeProfit && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#848e9c] font-bold">Take Profit</span>
                      <span className="text-[#03a66d] font-black">{takeProfit}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setActiveModal(null); setPendingOrder(null); }}
                  className="flex-1 py-3 bg-[#2b2f36] hover:bg-[#32363d] text-white text-[12px] font-black uppercase rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { executeOrder(pendingOrder.side); setPendingOrder(null); }}
                  disabled={placingOrder}
                  className={`flex-1 py-3 text-white text-[12px] font-black uppercase rounded-lg transition-colors ${pendingOrder.side === 'BUY' ? 'bg-[#1e75e4] hover:bg-[#1a68cc]' : 'bg-[#cf304a] hover:bg-[#b82a42]'} disabled:opacity-50`}
                >
                  {placingOrder ? 'Placing...' : `Confirm ${pendingOrder.side}`}
                </button>
              </div>
            </div>
          </TerminalModal>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2b2f36; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

        /* Exness-style price flash: brief colored text, fades back to white */
        @keyframes flash-green-text {
          0%   { color: #03a66d; }
          60%  { color: #03a66d; }
          100% { color: inherit; }
        }
        @keyframes flash-red-text {
          0%   { color: #cf304a; }
          60%  { color: #cf304a; }
          100% { color: inherit; }
        }
        .animate-flash-green { animation: flash-green-text 0.6s ease-out forwards; }
        .animate-flash-red   { animation: flash-red-text 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}

// Helper Components
function IconButton({ icon: Icon, onClick }: { icon: any, onClick: () => void }) {
  return (
    <div onClick={onClick} className="h-8 w-8 flex items-center justify-center text-[#848e9c] hover:bg-white/5 hover:text-white rounded cursor-pointer transition-colors">
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </div>
  );
}

function NumericInput({ label, unit, value, onInc, onDec, onChange, isPlaceholder }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[11px] font-bold text-exness-text-main">{label}</span>
        <span className="text-[10px] font-bold text-exness-text-dim uppercase">{unit}</span>
      </div>
      <div className="flex items-center bg-exness-panel-alt border border-exness-border rounded-[4px] overflow-hidden group focus-within:border-exness-yellow hover:border-exness-text-dim transition-all h-[40px]">
        <button 
          onClick={onDec} 
          className="w-[40px] h-full flex items-center justify-center text-exness-text-dim hover:text-exness-text-main hover:bg-exness-hover transition-all border-r border-exness-border active:scale-90"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <input 
          type="text"
          value={value === "Not set" ? "" : value}
          placeholder={isPlaceholder ? value : ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none px-3 text-[14px] font-black tabular-nums text-exness-text-main placeholder:text-exness-text-dim text-center"
        />
        
        <button 
          onClick={onInc} 
          className="w-[40px] h-full flex items-center justify-center text-exness-text-dim hover:text-exness-text-main hover:bg-exness-hover transition-all border-l border-exness-border active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SidebarIcon({ icon: Icon, active, onClick }: { icon: any, active?: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} className={`w-full flex justify-center py-2.5 cursor-pointer relative transition-all group ${active ? 'text-exness-yellow' : 'text-exness-text-muted hover:text-exness-text-main'}`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-exness-yellow rounded-r" />}
      <div className={`p-2 rounded-lg transition-all ${active ? 'bg-exness-yellow/10' : 'group-hover:bg-white/5'}`}>
        <Icon className={`h-[20px] w-[20px] transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`} strokeWidth={1.5} />
      </div>
    </div>
  );
}

function ToolIcon({ icon: Icon, active, onClick }: { icon: any, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-2 rounded cursor-pointer transition-all ${active ? 'text-exness-yellow bg-exness-yellow/10' : 'text-exness-text-muted hover:text-exness-text-main hover:bg-white/5'}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
    </div>
  )
}

function BottomTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`py-3 px-6 cursor-pointer transition-all border-b-[2px] font-bold uppercase tracking-tight text-[11px] ${active ? 'bg-exness-panel-alt border-exness-yellow text-exness-text-main' : 'border-transparent text-exness-text-dim hover:text-exness-text-secondary hover:bg-white/5'}`}
    >
      {label}
    </div>
  );
}

function TerminalModal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#16181d] border border-[#2b2f36] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between bg-[#1c1f24]">
          <span className="text-[14px] font-black text-white uppercase tracking-widest">{title}</span>
          <X onClick={onClose} className="h-5 w-5 text-[#5f6368] cursor-pointer hover:text-white" />
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}