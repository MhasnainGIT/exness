import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';

export function WalletPage() {
  const { user } = useAuth();
  const { openWalletModal } = useUi();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/wallets/history?limit=10')
      .then(res => setHistory(Array.isArray(res) ? res : res.data || []))
      .catch(console.error);
  }, []);

  const balance = user?.wallet?.balance || '0.00';
  const currency = user?.wallet?.currency || 'USD';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-sleek-panel border border-sleek-border shadow-xl rounded-xl md:col-span-2">
          <CardContent className="p-8 flex flex-col justify-between h-full min-h-[200px]">
             <div>
                <span className="text-xs font-bold text-sleek-muted uppercase tracking-widest">Total Balance</span>
                <div className="flex items-baseline gap-2 mt-2">
                   <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{parseFloat(balance).toLocaleString()}</span>
                   <span className="text-xl font-bold text-sleek-muted">{currency}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3 mt-8">
                <Button onClick={() => openWalletModal('deposit')} className="bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black uppercase tracking-wider px-6 h-12">
                   <ArrowDownLeft className="h-4 w-4 mr-2" /> Deposit
                </Button>
                <Button onClick={() => openWalletModal('withdraw')} variant="outline" className="border border-sleek-border bg-sleek-darker hover:bg-sleek-hover text-white font-bold uppercase tracking-wider px-6 h-12">
                   <ArrowUpRight className="h-4 w-4 mr-2" /> Withdraw
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold text-sleek-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <History className="h-4 w-4" /> Recent Transactions
        </h2>
        <div className="bg-sleek-panel border border-sleek-border rounded-xl overflow-hidden">
           {history.length === 0 ? (
             <div className="p-10 text-center text-sleek-muted">No recent transactions.</div>
           ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-sleek-darker/50">
                   <tr>
                      <th className="p-4 font-medium text-sleek-muted">Type</th>
                      <th className="p-4 font-medium text-sleek-muted">Date</th>
                      <th className="p-4 font-medium text-sleek-muted">Status</th>
                      <th className="p-4 font-medium text-sleek-muted text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-sleek-border">
                   {history.map(tx => (
                     <tr key={tx.id} className="hover:bg-sleek-hover transition-colors">
                        <td className="p-4 font-bold text-white capitalize">{tx.type.toLowerCase().replace('_', ' ')}</td>
                        <td className="p-4 text-sleek-muted">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                           <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-sm ${tx.status === 'COMPLETED' ? 'bg-sleek-green/20 text-sleek-green' : tx.status === 'PENDING' ? 'bg-sleek-gold/20 text-sleek-gold' : 'bg-sleek-red/20 text-sleek-red'}`}>
                             {tx.status}
                           </span>
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-sleek-green' : 'text-white'}`}>
                           {tx.type === 'DEPOSIT' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
}
