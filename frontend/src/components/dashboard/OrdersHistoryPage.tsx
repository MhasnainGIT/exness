import React, { useEffect, useState } from 'react';
import { 
  ChevronDown, Calendar, Download, 
  Search, Filter, RefreshCw, Info,
  ArrowUpRight, ArrowDownLeft, ExternalLink,
  ChevronRight
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useUi } from '../../contexts/UiContext';
import { Button } from '@/components/ui/button';

export function OrdersHistoryPage() {
  const { showToast, workspace } = useUi();
  const [tab, setTab] = useState<'closed' | 'open'>('closed');
  const [orders, setOrders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use a global click listener or just a simple state to toggle

  useEffect(() => {
    fetchApi('/accounts')
      .then((data) => {
        const accs = data?.accounts ?? data ?? [];
        const filtered = accs.filter((a: any) => a.accountType.toLowerCase() === workspace);
        setAccounts(filtered);
        if (filtered.length > 0 && !filtered.find((a: any) => a.id === selectedAccountId)) {
          setSelectedAccountId(filtered[0].id);
        }
      })
      .catch(console.error);
  }, [workspace]);

  useEffect(() => {
    if (!selectedAccountId) return;
    setLoading(true);
    const statusParam = tab === 'closed' ? 'FILLED' : 'PENDING';
    fetchApi(`/trading/orders/history?status=${statusParam}&accountId=${selectedAccountId}&limit=50`)
      .then((res) => setOrders(Array.isArray(res) ? res : res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId, tab]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">History of orders</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Review your trading performance and executed orders</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-10 border-gray-200 text-[#1a1b20] font-black gap-2">
              <Download className="h-3.5 w-3.5" /> Export Report
           </Button>
        </div>
      </div>

      {/* Account & Time Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
         <div className="flex-1 min-w-[300px] flex items-center gap-2">
            <div className="relative flex-1">
               <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-11 px-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 bg-white transition-colors relative z-20"
               >
                  <div className="flex items-center gap-3">
                     <span className="bg-[#e8f0fe] text-[#1c6ed4] text-[10px] font-black px-1.5 py-0.5 rounded uppercase">MT5</span>
                     <span className="text-[14px] font-bold text-[#1a1b20]">
                        {selectedAccount ? `Standard #${selectedAccount.accountNumber}` : 'Select instance'}
                     </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#8b8e94] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
               </button>
               
               {isDropdownOpen && (
                 <>
                   <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-2 max-h-[300px] overflow-y-auto">
                     <div className="px-3 pb-2 mb-2 border-b border-gray-100">
                        <p className="text-[11px] font-bold text-[#8b8e94] uppercase tracking-wider">{workspace} Accounts</p>
                     </div>
                     {accounts.length === 0 && (
                        <div className="px-4 py-3 text-[13px] text-[#8b8e94]">No {workspace} accounts found</div>
                     )}
                     {accounts.map(acc => (
                       <button
                         key={acc.id}
                         onClick={() => { setSelectedAccountId(acc.id); setIsDropdownOpen(false); }}
                         className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors ${acc.id === selectedAccountId ? 'bg-gray-50/50' : ''}`}
                       >
                         <div>
                            <p className="text-[14px] font-bold text-[#1a1b20]">Standard #{acc.accountNumber}</p>
                            <p className="text-[12px] text-[#5f6368]">{parseFloat(acc.balance).toFixed(2)} USD</p>
                         </div>
                         {acc.id === selectedAccountId && <div className="h-2 w-2 rounded-full bg-[#22c55e]" />}
                       </button>
                     ))}
                   </div>
                 </>
               )}
            </div>
            
            <button className="h-11 px-4 border border-gray-200 rounded-lg flex items-center gap-2 font-bold text-[13px] text-[#1a1b20] hover:bg-gray-50 bg-white shadow-sm">
               <Calendar className="h-4 w-4 text-[#8b8e94]" />
               All time
               <ChevronDown className="h-3.5 w-3.5 text-[#8b8e94]" />
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-0">
        <div className="flex items-center gap-8">
           <TabBtn active={tab === 'closed'} label="Closed orders" onClick={() => setTab('closed')} />
           <TabBtn active={tab === 'open'} label="Open orders" onClick={() => setTab('open')} />
        </div>
        
        <div className="pb-2 flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 text-[#8b8e94] ${loading ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-bold text-[#8b8e94] uppercase tracking-wider">Historical data sync</span>
           </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-[400px] gap-4">
              <RefreshCw className="h-8 w-8 text-gray-200 animate-spin" />
              <p className="text-[#8b8e94] font-medium text-[14px]">Fetching order history...</p>
           </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-12">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
               <Info className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-[18px] font-black text-[#1a1b20] mb-2">No orders found</h3>
            <p className="text-[14px] text-[#5f6368] max-w-sm">
              Your trading activity for this account will appear here once you open or close a position in the terminal.
            </p>
            <Button 
               onClick={() => showToast('Redirecting to terminal...', 'info')}
               className="mt-8 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black h-11 px-8 rounded-lg text-[13px]"
            >
               Go to terminal
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#fafbfc] border-b border-gray-100">
              <tr className="text-[#8b8e94] font-bold uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Instrument</th>
                <th className="px-3 py-4">Type</th>
                <th className="px-3 py-4">Volume</th>
                <th className="px-3 py-4">Open Price</th>
                <th className="px-3 py-4">Close Price</th>
                <th className="px-3 py-4 text-right">Profit (USD)</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 transition-opacity">
              {orders.map((order) => {
                 const isProfit = parseFloat(order.profit || '0') >= 0;
                 return (
                  <tr key={order.id} className="hover:bg-[#fafbfc] cursor-pointer group transition-colors">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-50 rounded flex items-center justify-center border border-gray-100 shadow-sm text-[12px] font-black text-[#1a1b20]">
                             {order.instrument?.symbol?.substring(0, 2) || 'FX'}
                          </div>
                          <div>
                             <p className="font-black text-[#1a1b20]">{order.instrument?.symbol || order.instrumentSymbol || 'N/A'}</p>
                             <p className="text-[11px] text-[#8b8e94]">Order #{order.id.substring(0, 8)}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-3 py-5">
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-tighter ${
                        order.side === 'BUY' ? 'bg-[#e6f4ea] text-[#22c55e]' : 'bg-[#ffebee] text-[#f04438]'
                      }`}>
                        {order.side === 'BUY' ? <><ArrowUpRight className="inline h-3 w-3 mr-1" /> BUY</> : <><ArrowDownLeft className="inline h-3 w-3 mr-1" /> SELL</>}
                      </span>
                    </td>
                    <td className="px-3 py-5 font-black text-[#1a1b20] tabular-nums">{parseFloat(order.volumeLots || '0').toFixed(2)}</td>
                    <td className="px-3 py-5 text-[#5f6368] font-bold tabular-nums italic">{parseFloat(order.executedPrice || order.requestedPrice || '0').toFixed(5)}</td>
                    <td className="px-3 py-5 text-[#5f6368] font-bold tabular-nums italic">{parseFloat(order.closePrice || '0').toFixed(5)}</td>
                    <td className={`px-3 py-5 text-right font-black tabular-nums text-[15px] ${isProfit ? 'text-[#22c55e]' : 'text-[#f04438]'}`}>
                      {isProfit ? '+' : ''}{parseFloat(order.profit || '0').toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-right text-[#8b8e94] font-bold flex flex-col items-end">
                       <span>{new Date(order.placedAt || order.createdAt).toLocaleDateString()}</span>
                       <span className="text-[11px] font-medium">{new Date(order.placedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Helpful Hint */}
      <div className="bg-[#f0f4ff] border border-[#dbeafe] rounded-xl p-5 flex items-start gap-4 shadow-sm">
         <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
            <Info className="h-5 w-5 text-[#1c6ed4]" />
         </div>
         <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-[#1a1b20]">Trade terminal analytics</h4>
            <p className="text-[13px] text-[#5f6368] leading-relaxed">
              For a detailed breakdown of your trading performance including win rate, drawdowns, and average profit, visit the <b>Performance Analytics</b> section under the Analytics menu.
            </p>
         </div>
      </div>
    </div>
  );
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-3 text-[14px] font-bold transition-all ${
        active ? 'text-[#1a1b20]' : 'text-[#8b8e94] hover:text-[#1a1b20]'
      }`}
    >
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffce00] rounded-full" />}
    </button>
  );
}
