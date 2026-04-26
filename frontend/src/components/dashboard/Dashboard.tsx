import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MoreVertical, LayoutGrid, List as ListIcon, 
  ChevronDown, ChevronUp, RefreshCw, Copy, 
  Search, ShieldCheck, AlertCircle, Share2,
  User, Info, Layout, Settings, Pencil, Key, Archive
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface TradingAccount {
  id: string;
  accountNumber: string;
  accountType: 'LIVE' | 'DEMO';
  platform: string;
  balance: string;
  equity: string;
  freeMargin: string;
  baseCurrency: string;
  leverage?: number;
  server?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export function Dashboard() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openWalletModal, showToast, workspace, setWorkspace } = useUi();
  const [showOpenAccount, setShowOpenAccount] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openStep, setOpenStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'LIVE' | 'DEMO' | null>(null);
  const [selectedClass, setSelectedClass] = useState<'Standard' | 'Pro'>('Standard');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'balance'>('newest');

  useEffect(() => {
    fetchApi('/accounts')
      .then((data) => setAccounts(data?.accounts ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenAccount = async (type: 'LIVE' | 'DEMO', leverage: number, platform: string) => {
    try {
      const data = await fetchApi('/trading/accounts', {
        method: 'POST',
        body: JSON.stringify({ accountType: type, leverage, platform }),
      });
      
      const newAcc = data.data || data; // Handle different wrapper styles
      setAccounts((prev) => [newAcc, ...prev]);
      showToast(`New ${type.toLowerCase()} account created successfully`, 'success');
      setShowOpenAccount(false);
      setOpenStep(1);
    } catch (e: any) {
      showToast(e.message || 'Failed to create account', 'error');
    }
  };

  const realAccounts = accounts.filter((a) => a.accountType === 'LIVE' && a.status === 'ACTIVE');
  const demoAccounts = accounts.filter((a) => a.accountType === 'DEMO' && a.status === 'ACTIVE');
  const filteredAccounts = (workspace === 'real' ? realAccounts : demoAccounts)
    .filter(a => a.accountNumber.includes(searchTerm) || a.platform.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return parseInt(b.id.slice(-4), 16) - parseInt(a.id.slice(-4), 16);
      if (sortBy === 'oldest') return parseInt(a.id.slice(-4), 16) - parseInt(b.id.slice(-4), 16);
      if (sortBy === 'balance') return parseFloat(b.balance) - parseFloat(a.balance);
      return 0;
    });

  const displayAccounts = filteredAccounts;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto w-full pb-20">
      {/* 1. Verification Banner */}
      <div className="bg-[#fef9e7] border border-[#fde047]/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
             <User className="h-5 w-5 text-[#8b8e94]" strokeWidth={1.5} />
          </div>
          <span className="text-[14px] font-medium text-[#1a1b20]">Hello. Fill in your account details to make your first deposit</span>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 text-[13px] font-bold text-[#3c3f44] hover:bg-white/50 rounded-lg">Learn more</button>
          <button 
            onClick={() => navigate('/profile')}
            className="h-10 px-6 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black text-[13px] rounded-lg shadow-sm"
          >
            Complete
          </button>
        </div>
      </div>

      {/* 2. Become a Partner Banner */}
      <div className="bg-[#f2f3f5] rounded-xl p-8 relative overflow-hidden group h-[120px] flex flex-col justify-center border border-gray-100">
        <div className="relative z-10">
          <h2 className="text-[22px] font-black text-[#1a1b20] mb-0.5">Become a partner</h2>
          <p className="text-[#5f6368] text-[14px]">Invite a friend and earn up to 40% of our revenue</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[40%] bg-gradient-to-l from-gray-200/40 to-transparent pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-48 h-24 bg-gray-300/10 rounded-full blur-3xl" />
      </div>

      {/* 3. My Accounts Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-black text-[#1a1b20]">My accounts</h1>
          <button
            onClick={() => setShowOpenAccount(true)}
            className="flex items-center gap-2 text-[#1a1b20] font-bold text-[13px] hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm transition-all"
          >
            <span className="text-[20px] leading-none">+</span> Open account
          </button>
        </div>

        {/* Tabs and Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex p-0.5 bg-gray-100 rounded-lg h-9">
            <button
              onClick={() => setWorkspace('real')}
              className={cn(
                "px-6 h-full flex items-center justify-center text-[13px] font-bold rounded-md transition-all",
                workspace === 'real' ? "bg-white text-[#1a1b20] shadow-sm" : "text-[#5f6368] hover:text-[#1a1b20]"
              )}
            >
              Real
            </button>
            <button
              onClick={() => setWorkspace('demo')}
              className={cn(
                "px-6 h-full flex items-center justify-center text-[13px] font-bold rounded-md transition-all",
                workspace === 'demo' ? "bg-white text-[#1a1b20] shadow-sm" : "text-[#5f6368] hover:text-[#1a1b20]"
              )}
            >
              Demo
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
               <div className="flex items-center gap-2 text-[#5f6368] text-[13px] border border-gray-200 rounded-lg px-3 h-9 bg-white cursor-pointer hover:bg-gray-50">
                 <RefreshCw className="h-4 w-4" />
                 <span className="font-bold uppercase tracking-wider text-[11px]">{sortBy}</span>
                 <ChevronDown className="h-4 w-4" />
               </div>
               <div className="absolute right-0 top-full mt-1 w-[140px] bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
                 {['newest', 'oldest', 'balance'].map(s => (
                   <button key={s} onClick={() => setSortBy(s as any)} className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 text-[#1a1b20] capitalize">{s}</button>
                 ))}
               </div>
             </div>
             
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8e94]" />
               <input 
                 type="text" 
                 placeholder="Search account #" 
                 className="pl-9 pr-4 h-9 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#ffce00] w-[180px] transition-all" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="flex items-center border border-gray-200 rounded-lg h-9 overflow-hidden">
                <button onClick={() => setViewMode('list')} className={cn("px-3 h-full border-r border-gray-100", viewMode === 'list' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50')}>
                  <ListIcon className="h-4 w-4 text-[#5f6368]" />
                </button>
                <button onClick={() => setViewMode('grid')} className={cn("px-3 h-full", viewMode === 'grid' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50')}>
                  <LayoutGrid className="h-4 w-4 text-[#5f6368]" />
                </button>
             </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-300" /></div>
        ) : displayAccounts.length === 0 ? (
          <div className="py-16 text-center border-b border-gray-100">
            <h3 className="text-[18px] font-black text-[#1a1b20] mb-2">No active accounts</h3>
            <p className="text-[#848e9c] text-[14px]">Create a new account or restore an archived account to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {displayAccounts.map(account => (
               <AccountCard key={account.id} account={account} navigate={navigate} showToast={showToast} viewMode={viewMode} />
             ))}
          </div>
        )}
      </div>

      {/* 4. Archived Accounts Section */}
      <div className="pt-8">
        <div className="flex items-center justify-between mb-6 group cursor-pointer">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-black text-[#1a1b20]">Archived accounts</h2>
            <Info className="h-4 w-4 text-[#8b8e94]" />
          </div>
          <button className="text-[13px] font-bold text-[#1a1b20] flex items-center gap-2 hover:underline">
            Hide accounts <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm group/arch">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-gray-100 text-[#8b8e94] px-2 py-0.5 rounded text-[10px] font-black uppercase">Real</span>
            <span className="bg-gray-100 text-[#8b8e94] px-2 py-0.5 rounded text-[10px] font-black uppercase">MT5</span>
            <span className="bg-gray-100 text-[#8b8e94] px-2 py-0.5 rounded text-[10px] font-black uppercase">Standard</span>
            <span className="text-[13px] font-black text-[#1a1b20] ml-2"># 196450149</span>
            <span className="text-[13px] font-bold text-[#8b8e94] ml-2">Standard</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#1a1b20]">Balance unavailable</span>
              <span className="text-[12px] text-[#8b8e94]">This account was archived automatically on 20 Apr 2026 at 05:16 (UTC+5.5)</span>
            </div>
            <button 
              onClick={() => showToast('Restoring account...', 'info')}
              className="h-10 px-6 bg-gray-50 hover:bg-gray-100 text-[#1a1b20] font-black text-[13px] rounded-lg border border-gray-100 transition-all flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restore
            </button>
          </div>
        </div>
      </div>

      {showOpenAccount && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowOpenAccount(false); setOpenStep(1); }} />
          <div className="bg-white rounded-[32px] w-full max-w-[500px] relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-[22px] font-black text-[#1a1b20]">
                {openStep === 1 ? 'Open new account' : `Open ${selectedType === 'LIVE' ? 'Real' : 'Demo'} account`}
              </h3>
              <button 
                onClick={() => { setShowOpenAccount(false); setOpenStep(1); }} 
                className="h-10 w-10 flex items-center justify-center text-[#8b8e94] hover:bg-gray-50 rounded-full"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>
            
            <div className="p-8">
              {openStep === 1 ? (
                <div className="space-y-6">
                   <p className="text-[14px] text-[#5f6368] mb-6">Choose whether you want to trade with real funds or practice with a virtual balance.</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => { setSelectedType('LIVE'); setOpenStep(2); }}
                        className="p-6 border border-gray-100 rounded-2xl hover:border-[#ffce00] hover:bg-gray-50/50 cursor-pointer transition-all group"
                      >
                         <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                         </div>
                         <h4 className="text-[17px] font-black text-[#1a1b20] mb-1">Real account</h4>
                         <p className="text-[12px] text-[#5f6368] leading-tight">Trade with real funds on global markets.</p>
                      </div>
                      <div 
                        onClick={() => { setSelectedType('DEMO'); setOpenStep(2); }}
                        className="p-6 border border-gray-100 rounded-2xl hover:border-[#ffce00] hover:bg-gray-50/50 cursor-pointer transition-all group"
                      >
                         <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                            <Layout className="h-6 w-6 text-gray-600" />
                         </div>
                         <h4 className="text-[17px] font-black text-[#1a1b20] mb-1">Demo account</h4>
                         <p className="text-[12px] text-[#5f6368] leading-tight">Practice trading with $10,000 virtual balance.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">Trading Platform</label>
                    <div className="flex gap-2">
                       {['MetaTrader 5', 'Exness Terminal'].map(p => (
                         <div key={p} className={cn("flex-1 py-3 px-4 border rounded-xl text-center text-[13px] font-bold cursor-pointer transition-all", p === 'MetaTrader 5' ? 'border-[#ffce00] bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-50 grayscale')}>
                            {p}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">Account Type</label>
                    <div className="space-y-2">
                       {[
                         { id: 'Standard', desc: 'The most popular account for all traders' },
                         { id: 'Pro', desc: 'Market execution with zero spread' }
                       ].map(c => (
                         <div 
                           key={c.id} 
                           onClick={() => setSelectedClass(c.id as any)}
                           className={cn("p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all", selectedClass === c.id ? 'border-[#ffce00] bg-white shadow-sm' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50')}
                         >
                            <div>
                               <p className="text-[14px] font-black text-[#1a1b20]">{c.id}</p>
                               <p className="text-[12px] text-[#5f6368]">{c.desc}</p>
                            </div>
                            {selectedClass === c.id && <div className="h-5 w-5 bg-[#ffce00] rounded-full flex items-center justify-center"><div className="h-2 w-2 bg-white rounded-full" /></div>}
                         </div>
                       ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenAccount(selectedType!, 2000, 'Exness MT5')}
                    className="w-full py-4 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black text-[15px] rounded-2xl shadow-xl shadow-[#ffce00]/10 transition-all active:scale-[0.98]"
                  >
                    Create Account
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-50">
                <p className="text-[12px] text-[#8b8e94] text-center leading-relaxed">
                  By clicking Create Account, you agree to our <br/>
                  <span className="text-[#1a1b20] font-bold hover:underline cursor-pointer">Client Agreement</span> and <span className="text-[#1a1b20] font-bold hover:underline cursor-pointer">Risk Disclosure</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Account Card ─── */
function AccountCard({
  account,
  navigate,
  showToast,
  viewMode
}: {
  account: TradingAccount;
  navigate: any;
  showToast: (msg: string, type?: any) => void;
  viewMode: 'list' | 'grid';
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showLeverage, setShowLeverage] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [newName, setNewName] = useState(account.server || ''); // Use server as temp name field if missing
  const [newLeverage, setNewLeverage] = useState(account.leverage || 200);
  const [isUpdating, setIsUpdating] = useState(false);

  const isDemo = account.accountType === 'DEMO';
  const balanceVal = parseFloat(account.balance || '0').toFixed(2);
  const [intPart, fracPart] = balanceVal.split('.');
  const equity = parseFloat(account.equity || account.balance || '0').toFixed(2);
  const freeMargin = parseFloat(account.freeMargin || account.balance || '0').toFixed(2);
  const leverage = account.leverage || 200;

  const handleRename = async () => {
    setIsUpdating(true);
    try {
      await fetchApi(`/accounts/${account.id}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
      showToast('Account renamed successfully', 'success');
      setShowRename(false);
      window.location.reload(); // Simple refresh for now
    } catch (e: any) {
      showToast(e.message || 'Failed to rename account', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateLeverage = async () => {
    setIsUpdating(true);
    try {
      await fetchApi(`/accounts/${account.id}/leverage`, {
        method: 'PATCH',
        body: JSON.stringify({ leverage: newLeverage }),
      });
      showToast('Leverage updated successfully', 'success');
      setShowLeverage(false);
      window.location.reload();
    } catch (e: any) {
      showToast(e.message || 'Failed to update leverage', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isDemo ? 'bg-gray-100 text-[#8b8e94]' : 'bg-[#e8f0fe] text-[#1c6ed4]'}`}>
                  {isDemo ? 'Demo' : 'Real'}
                </span>
                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-black text-[10px] uppercase">
                  {account.platform || 'MT5'}
                </span>
                <span className="bg-[#ffce00]/10 text-[#1a1b20] px-2 py-0.5 rounded font-black text-[10px] uppercase">
                  Standard
                </span>
                <span className="text-[#1a1b20] font-bold ml-1 text-[13px]">
                  #{account.accountNumber}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center text-[#8b8e94] hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] rounded-xl shadow-xl border-gray-100 p-1">
                  <DropdownMenuLabel className="text-[11px] font-black uppercase text-[#8b8e94] px-3 py-2">Account Options</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setShowInfo(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold text-[#1a1b20] cursor-pointer hover:bg-gray-50">
                    <Info className="h-4 w-4" strokeWidth={2.5} /> Account Information
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLeverage(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold text-[#1a1b20] cursor-pointer hover:bg-gray-50">
                    <Settings className="h-4 w-4" strokeWidth={2.5} /> Change Leverage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRename(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold text-[#1a1b20] cursor-pointer hover:bg-gray-50">
                    <Pencil className="h-4 w-4" strokeWidth={2.5} /> Rename Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-50" />
                  <DropdownMenuItem onClick={() => showToast('Archiving...', 'info')} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold text-red-600 cursor-pointer hover:bg-red-50">
                    <Archive className="h-4 w-4" strokeWidth={2.5} /> Archive Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className={`flex ${viewMode === 'grid' ? 'flex-col gap-6' : 'items-end justify-between'}`}>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#8b8e94] uppercase mb-1">Total Balance</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] font-black text-[#1a1b20] tabular-nums tracking-tighter leading-none">
                    {Number(intPart).toLocaleString()}
                  </span>
                  <span className="text-[16px] text-[#8b8e94] font-bold">
                    .{fracPart} <span className="text-[13px]">{account.baseCurrency || 'USD'}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`/terminal?accountId=${account.id}`, '_blank')}
                  className="bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black h-10 px-6 gap-2 rounded-lg text-[13px] shadow-sm transition-all active:scale-95 flex items-center"
                >
                  <div className="bg-[#1a1b20] h-4 w-4 rounded-sm flex items-center justify-center">
                     <div className="h-2 w-2 bg-[#ffce00] rounded-[1px]" />
                  </div>
                  Trade
                </button>
                
                {isDemo ? (
                  <button
                    onClick={() => showToast('Balance set to 10,000 USD', 'success')}
                    className="h-10 px-4 bg-gray-50 text-[#1a1b20] font-bold rounded-lg text-[13px] hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    Set Balance
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/deposit')}
                      className="h-10 px-4 bg-gray-50 text-[#1a1b20] font-bold rounded-lg text-[13px] hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => navigate('/withdrawal')}
                      className="h-10 px-4 bg-gray-50 text-[#1a1b20] font-bold rounded-lg text-[13px] hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      Withdraw
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full py-2 flex items-center justify-center gap-1.5 transition-colors border-t border-gray-50 ${expanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
          >
            <span className="text-[11px] font-black uppercase text-[#8b8e94]">
              {expanded ? 'Hide Details' : 'Show Details'}
            </span>
            {expanded ? <ChevronUp className="h-3 w-3 text-[#8b8e94]" /> : <ChevronDown className="h-3 w-3 text-[#8b8e94]" />}
          </button>

          {expanded && (
            <div className="px-6 py-5 bg-[#fafbfc] border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <DetailBox label="Leverage" value={`1:${leverage}`} />
                <DetailBox label="Equity" value={`${Number(equity).toLocaleString()} USD`} />
                <DetailBox label="Free Margin" value={`${Number(freeMargin).toLocaleString()} USD`} />
                <DetailBox label="P/L" value="0.00 USD" valueColor="text-[#26a69a]" />
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                <div className="flex items-center gap-8">
                  <InfoItem label="Server" value="Exness-MT5Trial11" />
                  <InfoItem label="Login" value={account.accountNumber} />
                </div>
                <button 
                  onClick={() => showToast('Password change opening...', 'info')}
                  className="flex items-center gap-2 text-[#1c6ed4] text-[13px] font-bold hover:underline"
                >
                  Change trading password
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modals */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="max-w-[400px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Rename account</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <label className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">New account name</label>
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Strategy"
              className="h-12 rounded-xl focus:ring-[#ffce00] border-gray-100 font-bold"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowRename(false)} className="h-12 rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleRename} 
              disabled={isUpdating}
              className="h-12 px-8 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black rounded-xl shadow-lg shadow-[#ffce00]/10"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeverage} onOpenChange={setShowLeverage}>
        <DialogContent className="max-w-[400px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Change leverage</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-[13px] text-[#5f6368]">Current leverage: 1:{leverage}</p>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">Select new leverage</label>
              <div className="grid grid-cols-2 gap-2">
                {[50, 100, 200, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    onClick={() => setNewLeverage(val)}
                    className={cn(
                      "py-3 border rounded-xl font-bold text-[13px] transition-all",
                      newLeverage === val ? "border-[#ffce00] bg-white shadow-sm ring-1 ring-[#ffce00]" : "border-gray-50 bg-gray-50/50 hover:bg-gray-50"
                    )}
                  >
                    1:{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-[#fef9e7] rounded-xl flex items-start gap-3">
               <AlertCircle className="h-4 w-4 text-[#8b5e3c] mt-0.5" />
               <p className="text-[11px] text-[#8b5e3c] leading-relaxed">
                 Closing all open positions is required to change your account leverage. Your margin will be recalculated according to the new leverage.
               </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowLeverage(false)} className="h-12 rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleUpdateLeverage} 
              disabled={isUpdating}
              className="h-12 px-8 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black rounded-xl shadow-lg shadow-[#ffce00]/10"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-[450px] rounded-[32px] p-0 overflow-hidden">
          <div className="p-8 bg-[#1a1b20] text-white">
            <h3 className="text-[20px] font-black">Account Information</h3>
            <p className="text-gray-400 text-[13px] mt-1">Trading account details for MT5 platform</p>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 gap-6">
                <InfoRow label="Server" value="Exness-MT5Trial11" />
                <InfoRow label="Trading Login" value={account.accountNumber} />
                <InfoRow label="Account Type" value="Standard" />
                <InfoRow label="Leverage" value={`1:${leverage}`} />
                <InfoRow label="Base Currency" value={account.baseCurrency || 'USD'} />
             </div>
             <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                <Button 
                  onClick={() => setShowInfo(false)}
                  className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-[#1a1b20] font-black rounded-xl"
                >
                  Close
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-black text-[#1a1b20]">{value}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(value)}
          className="p-1.5 text-gray-300 hover:text-[#1a1b20] transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function DetailBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-[#8b8e94] uppercase mb-1">{label}</span>
      <span className={`text-[14px] font-black tabular-nums ${valueColor || 'text-[#1a1b20]'}`}>{value}</span>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] font-bold text-[#8b8e94] uppercase">{label}</span>
      <span className="text-[13px] font-black text-[#1a1b20]">{value}</span>
      <button 
        onClick={() => { navigator.clipboard.writeText(value); }}
        className="p-1 text-[#8b8e94] hover:text-[#1a1b20] transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AccountTypeCard({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <div onClick={onClick} className="p-5 border border-gray-100 rounded-2xl hover:border-[#ffce00] hover:shadow-lg hover:shadow-[#ffce00]/5 transition-all cursor-pointer group">
      <div className="mb-4">{icon}</div>
      <h4 className="text-[16px] font-black text-[#1a1b20] mb-1 group-hover:text-[#ffce00] transition-colors">{title}</h4>
      <p className="text-[12px] text-[#5f6368] leading-relaxed">{desc}</p>
    </div>
  );
}

function TabButton({ active, label, onClick, count }: { active: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-3 text-[14px] font-bold transition-all ${
        active ? 'text-[#1a1b20]' : 'text-[#8b8e94] hover:text-[#1a1b20]'
      }`}
    >
      <div className="flex items-center gap-1.5 px-1">
        {label}
        {count !== undefined && count > 0 && <span className="bg-gray-100 text-[#8b8e94] text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
      </div>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffce00] rounded-full" />}
    </button>
  );
}
