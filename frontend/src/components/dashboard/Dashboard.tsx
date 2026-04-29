import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MoreVertical, LayoutGrid, List as ListIcon, 
  ChevronDown, ChevronUp, RefreshCw, Copy, 
  Search, User, Info, Layout, Settings, Pencil, X, Archive
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
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const navigate = useNavigate();
  const { showToast, workspace, setWorkspace } = useUi();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'balance'>('newest');

  useEffect(() => {
    fetchApi('/accounts').then(d => setAccounts(d?.accounts ?? d ?? [])).finally(() => setLoading(false));
  }, []);

  const displayAccounts = accounts.filter(a => a.accountType === (workspace === 'real' ? 'LIVE' : 'DEMO') && a.status === 'ACTIVE')
    .sort((a, b) => sortBy === 'balance' ? parseFloat(b.balance) - parseFloat(a.balance) : b.id.localeCompare(a.id));

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto w-full pb-32 font-sans text-[#1a1b20]">
      <div className="bg-[#fef9e7]/60 border border-[#fde047]/30 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm"><User className="h-5 w-5 text-[#8b8e94]" /></div>
          <span className="text-[14px] font-bold">Hello. Fill in your account details to make your first deposit</span>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-5 text-[13px] font-black hover:bg-black/5 rounded-lg">Learn more</button>
          <button onClick={() => navigate('/profile')} className="h-10 px-7 bg-[#ffce00] hover:bg-[#e6bb00] font-black text-[13px] rounded-lg shadow-sm">Complete</button>
        </div>
      </div>

      <div className="bg-[#f2f3f5] rounded-3xl p-10 relative overflow-hidden h-[160px] flex flex-col justify-center border border-gray-100 group cursor-pointer">
        <div className="relative z-10">
          <h2 className="text-[28px] font-black mb-1">Become a partner</h2>
          <p className="text-[#5f6368] text-[15px]">Invite a friend and earn up to 40% of our revenue</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-[60%] bg-gradient-to-l from-gray-200/50 to-transparent" />
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] font-black tracking-tighter">My accounts</h1>
          <button className="flex items-center gap-2.5 font-black text-[13px] bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all">+ Open account</button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex p-1 bg-[#f2f3f5] rounded-xl h-[40px]">
            {['real', 'demo'].map(w => (
              <button key={w} onClick={() => setWorkspace(w as any)} className={cn("px-8 h-full flex items-center justify-center text-[13px] font-black rounded-lg transition-all capitalize", workspace === w ? "bg-white text-[#1a1b20] shadow-sm" : "text-[#5f6368]")}>{w}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
               <div className="flex items-center gap-2 text-[#1a1b20] text-[13px] border border-gray-200 rounded-lg px-4 h-[40px] bg-white cursor-pointer hover:bg-gray-50 uppercase tracking-widest text-[10px] font-black">
                 <RefreshCw className="h-4 w-4 text-[#8b8e94]" /> {sortBy} <ChevronDown className="h-4 w-4 text-[#8b8e94]" />
               </div>
               <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
                 {['newest', 'oldest', 'balance'].map(s => <button key={s} onClick={() => setSortBy(s as any)} className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 capitalize">{s}</button>)}
               </div>
             </div>
             <div className="flex items-center border border-gray-200 rounded-lg h-[40px] bg-white">
                <button onClick={() => setViewMode('list')} className={cn("px-4 h-full border-r", viewMode === 'list' && 'bg-gray-100')}><ListIcon className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')} className={cn("px-4 h-full", viewMode === 'grid' && 'bg-gray-100')}><LayoutGrid className="h-4 w-4" /></button>
             </div>
          </div>
        </div>

        <div className={cn("gap-4", viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col')}>
           {displayAccounts.map(account => <AccountCard key={account.id} account={account} showToast={showToast} />)}
        </div>
      </div>

      <div className="pt-12">
        <h2 className="text-[24px] font-black mb-8">Archived accounts</h2>
        <div className="space-y-4">
          {accounts.filter(a => a.status === 'CLOSED').map(acc => (
            <div key={acc.id} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex flex-col gap-1.5">
                   <div className="flex items-center gap-2"><span className="bg-gray-100 text-[#8b8e94] px-2 py-0.5 rounded text-[10px] font-black uppercase">MT5</span><span className="text-[14px] font-black">#{acc.accountNumber}</span></div>
                   <span className="text-[18px] font-black text-[#8b8e94]">{parseFloat(acc.balance).toLocaleString()} {acc.baseCurrency}</span>
                 </div>
              </div>
              <button onClick={() => fetchApi(`/accounts/${acc.id}/restore`, { method: 'PATCH' }).then(() => window.location.reload())} className="h-10 px-8 bg-gray-50 hover:bg-gray-100 font-black text-[13px] rounded-lg border border-gray-200 flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Restore</button>
            </div>
          ))}
        </div>
      </div>

      {showPwaBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pb-6">
          <div className="bg-white border border-gray-200 shadow-2xl py-3 px-6 rounded-full flex items-center gap-10">
            <div className="flex items-center gap-3"><div className="h-8 w-8 bg-[#ffce00] rounded-lg flex items-center justify-center font-black text-[14px]">ex</div><span className="text-[14px] font-black">Add Exness App to Home screen</span></div>
            <button onClick={() => setShowPwaBanner(false)}><X className="h-5 w-5 text-[#8b8e94]" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, showToast }: any) {
  const [showBal, setShowBal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [amt, setAmt] = useState('10000');
  const [int, frac] = parseFloat(account.balance).toFixed(2).split('.');

  const badgeColor = account.accountType === 'DEMO' ? 'bg-[#e6f6f0] text-[#03a66d]' : 'bg-[#e8f0fe] text-[#1c6ed4]';

  const floatingPL = parseFloat(account.equity || account.balance) - parseFloat(account.balance);

  return (
    <Card className="bg-white border border-[#eef0f2] shadow-none rounded-[16px] overflow-hidden hover:shadow-lg transition-all group">
      <CardContent className="p-0">
        <div className="p-8">
          <div className="flex justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <span className={cn("px-2 py-0.5 rounded-[4px] text-[11px] font-bold capitalize", badgeColor)}>
                {account.accountType === 'DEMO' ? 'Demo' : 'Real'}
              </span>
              <span className="bg-[#e6f6f0] text-[#03a66d] px-2 py-0.5 rounded-[4px] font-bold text-[11px]">
                {account.platform || 'MT5'}
              </span>
              <span className="bg-[#e6f6f0] text-[#03a66d] px-2 py-0.5 rounded-[4px] font-bold text-[11px]">
                Standard
              </span>
              <span className="text-[#1a1b20] font-bold text-[13px] ml-1">
                #{account.accountNumber} Standard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsExpanded(!isExpanded); }} 
                className="p-1 hover:bg-gray-50 rounded-full transition-colors outline-none cursor-pointer flex items-center justify-center"
              >
                {isExpanded ? <ChevronUp className="h-5 w-5 text-[#8b8e94]" /> : <ChevronDown className="h-5 w-5 text-[#8b8e94]" />}
              </button>
            </div>
          </div>

          <div className={cn("flex items-end justify-between", isExpanded ? "mb-8" : "mb-0")}>
            <div className="flex items-baseline gap-1">
              <span className="text-[36px] font-bold tracking-tight text-[#1a1b20] leading-none">
                {Number(int).toLocaleString()}
              </span>
              <span className="text-[18px] text-[#5f6368] font-bold">
                .{frac} <span className="text-[14px] ml-0.5">USD</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-white">
              <button onClick={() => window.open(`/terminal?accountId=${account.id}`, '_blank')} className="bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-bold h-[40px] px-6 rounded-lg text-[13px] flex items-center gap-2 shadow-sm transition-all focus:outline-none">
                <Layout className="h-4 w-4" /> Trade
              </button>
              {account.accountType === 'DEMO' && (
                <button onClick={() => setShowBal(true)} className="bg-[#f2f3f5] hover:bg-[#e6e8eb] text-[#1a1b20] font-bold h-[40px] px-4 rounded-lg text-[13px] flex items-center gap-2 transition-all">
                  <Settings className="h-4 w-4 text-[#1a1b20]" /> Set Balance
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-[#f2f3f5] hover:bg-[#e6e8eb] h-[40px] w-[40px] rounded-lg flex items-center justify-center transition-all outline-none cursor-pointer">
                   <MoreVertical className="h-4 w-4 text-[#1a1b20]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl p-1 border-[#eef0f2]">
                   <DropdownMenuItem className="px-3 py-2.5 rounded-lg hover:bg-[#f2f3f5] font-semibold text-[13px] flex gap-2 cursor-pointer"><Info className="size-4" /> Account Info</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => fetchApi(`/accounts/${account.id}/archive`, { method: 'PATCH' }).then(() => window.location.reload())} className="px-3 py-2.5 rounded-lg hover:bg-red-50 text-[#cf304a] font-semibold text-[13px] flex gap-2 cursor-pointer"><Archive className="size-4" /> Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 border-t border-[#eef0f2] pt-6 relative top-2 animate-in fade-in duration-300 slide-in-from-top-2">
               {[ 
                 ['Actual leverage', `1:${account.leverage || 200}`], 
                 ['Free margin', `${parseFloat(account.freeMargin || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                 ['Adjust leverage', `1:${account.leverage || 200}`], 
                 ['Equity', `${parseFloat(account.equity || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                 ['Floating P/L', `${floatingPL > 0 ? '+' : ''}${floatingPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`], 
                 ['Platform', account.platform || 'MT5'] 
               ].map(([l, v], i) => (
                 <div key={i} className="flex items-end">
                   <span className="text-[13px] text-[#5f6368] pb-0.5">{l}</span>
                   <div className="flex-1 border-b-[2px] border-dotted border-[#d1d4dc] mx-2 mb-1 opacity-50" />
                   <span className={cn("text-[13px] font-bold pb-0.5", l === 'Floating P/L' ? (floatingPL >= 0 ? "text-[#03a66d]" : "text-[#cf304a]") : "text-[#1a1b20]")}>{v}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="bg-white px-8 h-[60px] flex items-center justify-between border-t border-[#eef0f2]">
             <div className="flex gap-8 text-[12px]">
                <span className="text-[#5f6368]">Server&nbsp;&nbsp;<span className="text-[#1a1b20] font-bold">Exness-MT5Trial11</span> <Copy className="inline h-3.5 w-3.5 ml-1 text-[#8b8e94] cursor-pointer" /></span>
                <span className="text-[#5f6368]">MT5 login&nbsp;&nbsp;<span className="text-[#1a1b20] font-bold">{account.accountNumber}</span> <Copy className="inline h-3.5 w-3.5 ml-1 text-[#8b8e94] cursor-pointer" /></span>
                <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#1a1b20] ml-2 hover:underline"><Pencil className="h-3.5 w-3.5" /> Change trading password</button>
             </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showBal} onOpenChange={setShowBal}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogTitle className="text-[24px] font-black mb-6">Set balance</DialogTitle>
          <div className="space-y-6">
            <Input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="h-14 bg-[#f2f3f5] border-none rounded-2xl text-[20px] font-bold px-6" />
            <div className="bg-[#fef9e7] rounded-2xl p-4 flex gap-3 text-[13px] font-medium"><Info className="h-5 w-5 text-[#ffce00] shrink-0" /> Changes apply instantly.</div>
          </div>
          <DialogFooter className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={() => setShowBal(false)} className="flex-1 h-12 rounded-xl font-bold bg-[#f2f3f5] hover:bg-[#e6e8eb]">Cancel</Button>
            <Button onClick={() => fetchApi(`/accounts/${account.id}/balance`, { method: 'PATCH', body: JSON.stringify({ balance: parseFloat(amt) }) }).then(() => window.location.reload())} className="flex-1 h-12 rounded-xl bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-bold">Set balance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
