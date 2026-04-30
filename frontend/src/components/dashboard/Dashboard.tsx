import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MoreVertical, LayoutGrid, List as ListIcon, 
  ChevronDown, ChevronUp, RefreshCw, Copy, 
  Search, User, Info, Layout, Settings, Pencil, X, Archive, HelpCircle
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuGroup, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface TradingAccount {
  id: string; accountNumber: string; accountType: 'LIVE' | 'DEMO';
  platform: string; balance: string; equity: string; freeMargin: string;
  baseCurrency: string; leverage?: number; server?: string; status: 'ACTIVE' | 'CLOSED';
}

export function Dashboard() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showArchived, setShowArchived] = useState(true);
  const navigate = useNavigate();
  const { showToast, workspace, setWorkspace } = useUi();
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Balance'>('Newest');

  useEffect(() => {
    fetchApi('/accounts').then(d => setAccounts(d?.accounts ?? d ?? [])).finally(() => setLoading(false));
  }, []);

  const displayAccounts = accounts.filter(a => a.accountType === (workspace === 'real' ? 'LIVE' : 'DEMO') && a.status === 'ACTIVE')
    .sort((a, b) => {
      if (sortBy === 'Balance') return parseFloat(b.balance) - parseFloat(a.balance);
      if (sortBy === 'Oldest') return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id);
    });

  const archivedCount = accounts.filter(a => a.status === 'CLOSED').length;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto w-full pb-32 font-sans text-[#212529]">
      {/* Top Warning Banner */}
      <div className="bg-[#FFF9E7] border border-[#FDE047] rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-[#FDE047]">
            <User className="h-5 w-5 text-[#848e9c]" />
          </div>
          <span className="text-[14px] font-medium text-[#212529]">Hello. Fill in your account details to make your first deposit</span>
        </div>
        <div className="flex gap-4">
          <button className="text-[14px] font-semibold text-[#212529] hover:opacity-70">Learn more</button>
          <button 
            onClick={() => navigate('/profile')} 
            className="h-10 px-6 bg-[#FFD700] hover:bg-[#F2CC00] font-semibold text-[14px] rounded-lg transition-colors"
          >
            Complete
          </button>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-[#F1E9E6] rounded-xl p-8 relative overflow-hidden h-[140px] flex flex-col justify-center border border-[#E9ECEF] group cursor-pointer">
        <div className="relative z-10">
          <h2 className="text-[24px] font-bold text-[#212529] mb-1">Become a partner</h2>
          <p className="text-[#5f6368] text-[15px]">Invite a friend and earn up to 40% of our revenue</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[40%] bg-[url('https://images.unsplash.com/photo-1611974708305-96dd0ba18d3e?auto=format&fit=crop&q=80&w=400')] bg-cover opacity-20 group-hover:scale-105 transition-transform duration-700" />
      </div>

      <div className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-bold text-[#212529]">My accounts</h1>
          <button className="flex items-center gap-2 font-semibold text-[14px] bg-[#F1F3F5] hover:bg-[#E9ECEF] px-4 py-2 rounded-lg transition-colors">
            <span className="text-lg">+</span> Open account
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-6 border-b border-[#E9ECEF] w-full max-w-fit">
            <button 
              onClick={() => setWorkspace('real')} 
              className={cn("pb-3 text-[14px] font-semibold transition-all px-2", workspace === 'real' ? "border-b-2 border-black text-black" : "text-[#848e9c] hover:text-black")}
            >
              Real
            </button>
            <button 
              onClick={() => setWorkspace('demo')} 
              className={cn("pb-3 text-[14px] font-semibold transition-all px-2", workspace === 'demo' ? "border-b-2 border-black text-black" : "text-[#848e9c] hover:text-black")}
            >
              Demo
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
               <button className="flex items-center gap-2 text-[#212529] text-[13px] font-semibold hover:opacity-70 transition-opacity">
                 <RefreshCw className="h-4 w-4 text-[#848e9c]" /> {sortBy} <ChevronDown className="h-4 w-4 text-[#848e9c]" />
               </button>
               <div className="absolute right-0 top-full mt-1 w-[140px] bg-white border border-[#E9ECEF] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
                 {['Newest', 'Oldest', 'Balance'].map(s => (
                   <button 
                    key={s} 
                    onClick={() => setSortBy(s as any)} 
                    className="w-full text-left px-3 py-2 rounded-md text-[13px] font-medium hover:bg-[#F8F9FA]"
                   >
                     {s}
                   </button>
                 ))}
               </div>
             </div>
             <div className="flex items-center border border-[#E9ECEF] rounded-lg overflow-hidden h-9">
                <button onClick={() => setViewMode('list')} className={cn("px-3 h-full flex items-center", viewMode === 'list' ? 'bg-[#F1F3F5]' : 'bg-white hover:bg-[#F8F9FA]')}><ListIcon className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')} className={cn("px-3 h-full flex items-center border-l border-[#E9ECEF]", viewMode === 'grid' ? 'bg-[#F1F3F5]' : 'bg-white hover:bg-[#F8F9FA]')}><LayoutGrid className="h-4 w-4" /></button>
             </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className={cn("gap-4", viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col')}>
           {displayAccounts.map(account => <AccountCard key={account.id} account={account} showToast={showToast} />)}
           {displayAccounts.length === 0 && !loading && (
             <div className="text-center py-20 bg-[#F8F9FA] rounded-xl border border-dashed border-[#E9ECEF]">
                <p className="text-[#848e9c] text-sm">No active accounts</p>
                <p className="text-[#848e9c] text-xs mt-1">Create a new account or restore an archived account to get started.</p>
             </div>
           )}
        </div>
      </div>

      {/* Archived Accounts */}
      <div className="pt-12">
        <div className="flex items-center justify-between mb-8 border-b border-[#E9ECEF] pb-4">
          <h2 className="text-[20px] font-bold text-[#212529]">Archived accounts <HelpCircle className="inline h-4 w-4 text-[#848e9c] ml-1" /></h2>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className="text-[13px] font-semibold text-[#848e9c] hover:text-black flex items-center gap-1"
          >
            {showArchived ? 'Hide accounts' : 'Show accounts'} {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        
        {showArchived && (
          <div className="space-y-4">
            {accounts.filter(a => a.status === 'CLOSED').map(acc => (
              <div key={acc.id} className="bg-white border border-[#E9ECEF] rounded-xl p-6 flex items-center justify-between hover:border-[#CED4DA] transition-colors">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2 text-[12px] font-semibold text-[#848e9c]">
                       <span className="uppercase">Real</span>
                       <span className="uppercase">MT5</span>
                       <span className="uppercase">Standard</span>
                       <span className="text-black">#{acc.accountNumber} Standard</span>
                     </div>
                     <span className="text-[18px] font-bold text-[#212529] mt-2">Balance unavailable <span className="text-[12px] font-normal text-[#848e9c] ml-2">This account was archived automatically</span></span>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => fetchApi(`/accounts/${acc.id}/restore`, { method: 'PATCH' }).then(() => window.location.reload())} className="h-9 px-6 bg-[#F1F3F5] hover:bg-[#E9ECEF] font-semibold text-[13px] rounded-lg flex items-center gap-2 transition-colors">
                    <RefreshCw className="h-4 w-4" /> Restore
                  </button>
                  <button className="h-9 px-6 border border-[#E9ECEF] hover:bg-[#F8F9FA] font-semibold text-[13px] rounded-lg flex items-center gap-2 transition-colors">
                    Manage statements
                  </button>
                </div>
              </div>
            ))}
            {archivedCount === 0 && (
              <p className="text-center py-8 text-[#848e9c] text-sm italic">No archived accounts</p>
            )}
          </div>
        )}
      </div>

      {/* PWA Banner (Like Screenshot 3 bottom) */}
      <div className="fixed bottom-4 left-0 right-0 z-[100] flex justify-center px-4">
        <div className="bg-white border border-[#E9ECEF] shadow-2xl py-2.5 px-6 rounded-full flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-[#FFD700] rounded flex items-center justify-center font-bold text-[13px]">ex</div>
            <span className="text-[13px] font-semibold">Add Exness App to Home screen</span>
          </div>
          <button onClick={() => {}} className="hover:opacity-50"><X className="h-4 w-4 text-[#848e9c]" /></button>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account, showToast }: any) {
  const [showBal, setShowBal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [amt, setAmt] = useState('10000');
  const [int, frac] = parseFloat(account.balance).toFixed(2).split('.');

  const floatingPL = parseFloat(account.equity || account.balance) - parseFloat(account.balance);

  return (
    <Card className="bg-white border border-[#E9ECEF] shadow-none rounded-xl overflow-hidden hover:border-[#CED4DA] transition-all">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-[#848e9c] tracking-tight">{account.accountType === 'DEMO' ? 'Demo' : 'Real'}</span>
              <span className="text-[11px] font-bold uppercase text-[#848e9c] tracking-tight">{account.platform || 'MT5'}</span>
              <span className="text-[11px] font-bold uppercase text-[#848e9c] tracking-tight">Standard</span>
              <span className="text-[#212529] font-semibold text-[13px] ml-1">
                #{account.accountNumber} Standard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-1 hover:bg-[#F1F3F5] rounded-full transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-5 w-5 text-[#848e9c]" /> : <ChevronDown className="h-5 w-5 text-[#848e9c]" />}
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#212529] leading-none">
                {Number(int).toLocaleString()}
              </span>
              <span className="text-[16px] text-[#848e9c] font-medium">
                .{frac} <span className="text-[13px] ml-1">USD</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.open(`/terminal?accountId=${account.id}`, '_blank')} 
                className="bg-[#FFD700] hover:bg-[#F2CC00] text-black font-semibold h-9 px-6 rounded-lg text-[13px] transition-colors"
              >
                Trade
              </button>
              {account.accountType === 'DEMO' && (
                <button onClick={() => setShowBal(true)} className="bg-[#F1F3F5] hover:bg-[#E9ECEF] text-black font-semibold h-9 px-4 rounded-lg text-[13px] transition-colors">
                  Set Balance
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 w-9 flex items-center justify-center hover:bg-[#F1F3F5] rounded-lg transition-colors outline-none">
                   <MoreVertical className="h-4 w-4 text-[#848e9c]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-lg shadow-xl border-[#E9ECEF]">
                   <DropdownMenuItem className="px-3 py-2 cursor-pointer text-[13px] font-medium flex gap-2"><Info className="h-4 w-4" /> Account Info</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => fetchApi(`/accounts/${account.id}/archive`, { method: 'PATCH' }).then(() => window.location.reload())} className="px-3 py-2 cursor-pointer text-[13px] font-medium text-red-500 flex gap-2 hover:bg-red-50"><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-8 pt-6 border-t border-[#E9ECEF] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
               {[ 
                 ['Actual leverage', `1:${account.leverage || 200}`], 
                 ['Free margin', `${parseFloat(account.freeMargin || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                 ['Equity', `${parseFloat(account.equity || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                 ['Floating P/L', `${floatingPL > 0 ? '+' : ''}${floatingPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`], 
               ].map(([l, v], i) => (
                 <div key={i} className="flex justify-between items-center">
                   <span className="text-[13px] text-[#848e9c]">{l}</span>
                   <span className={cn("text-[13px] font-bold", l === 'Floating P/L' ? (floatingPL >= 0 ? "text-[#03A66D]" : "text-[#D6344D]") : "text-[#212529]")}>{v}</span>
                 </div>
               ))}
               <div className="pt-4 flex gap-4 text-[12px] text-[#848e9c]">
                  <span>MT5 login: <span className="text-black font-bold">{account.accountNumber}</span></span>
                  <span>Server: <span className="text-black font-bold">Exness-MT5Trial</span></span>
               </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showBal} onOpenChange={setShowBal}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 border-none shadow-2xl">
          <DialogTitle className="text-[20px] font-bold mb-4">Set balance</DialogTitle>
          <div className="space-y-4">
            <Input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="h-12 bg-[#F1F3F5] border-none rounded-lg text-[18px] font-bold px-4" />
            <div className="bg-[#FFF9E7] rounded-lg p-3 flex gap-2 text-[12px] text-[#212529]"><Info className="h-4 w-4 text-[#FFD700] shrink-0" /> Balance update is instant.</div>
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setShowBal(false)} className="flex-1 h-10 rounded-lg font-bold bg-[#F1F3F5] hover:bg-[#E9ECEF]">Cancel</Button>
            <Button onClick={() => fetchApi(`/accounts/${account.id}/balance`, { method: 'PATCH', body: JSON.stringify({ balance: parseFloat(amt) }) }).then(() => window.location.reload())} className="flex-1 h-10 rounded-lg bg-[#FFD700] hover:bg-[#F2CC00] text-black font-bold">Set balance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
