import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';
import { useAuth } from '../../contexts/AuthContext';

export function WalletModal({ defaultTab, onClose }: { defaultTab: 'deposit' | 'withdraw', onClose: () => void }) {
  const [tab, setTab] = useState(defaultTab);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [loading, setLoading] = useState(false);
  const { showToast } = useUi();
  const { user } = useAuth(); // User usually has the balance or we fetch it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return showToast('Please enter a valid amount', 'error');
    
    setLoading(true);
    try {
      if (tab === 'deposit') {
        await fetchApi('/wallets/deposit', {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount), paymentMethod: method })
        });
        showToast('Deposit request submitted successfully', 'success');
      } else {
        await fetchApi('/wallets/withdraw', {
          method: 'POST',
          body: JSON.stringify({ amount: Number(amount), paymentMethod: method })
        });
        showToast('Withdrawal request submitted successfully', 'success');
      }
      onClose();
      // Optionally trigger a balance refresh hook if available
    } catch (err: any) {
      showToast(err.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-sleek-dark border border-sleek-border rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-sleek-border">
          <h2 className="text-lg font-black text-white italic uppercase tracking-wider">Wallet</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-sleek-muted hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex border-b border-sleek-border">
          <button 
            onClick={() => setTab('deposit')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'deposit' ? 'text-sleek-gold border-b-2 border-sleek-gold' : 'text-sleek-muted hover:text-white'}`}
          >
            <ArrowDownLeft className="h-4 w-4" /> Deposit
          </button>
          <button 
            onClick={() => setTab('withdraw')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'withdraw' ? 'text-sleek-gold border-b-2 border-sleek-gold' : 'text-sleek-muted hover:text-white'}`}
          >
            <ArrowUpRight className="h-4 w-4" /> Withdraw
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-sleek-muted">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sleek-muted font-bold">$</span>
              <input 
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-sleek-panel border border-sleek-border rounded-lg py-3 pl-8 pr-4 text-white font-mono text-lg focus:ring-1 focus:ring-sleek-gold outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-sleek-muted">Payment Method</label>
            <select 
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full bg-sleek-panel border border-sleek-border rounded-lg py-3 px-4 text-white font-medium focus:ring-1 focus:ring-sleek-gold outline-none appearance-none cursor-pointer"
            >
              <option value="BANK_TRANSFER">Bank Transfer (1-3 days)</option>
              <option value="CREDIT_CARD">Credit/Debit Card (Instant)</option>
              <option value="CRYPTO">Cryptocurrency (BTC/ETH/USDT)</option>
              <option value="SKRILL">Skrill</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black uppercase tracking-wider py-6">
            {loading ? 'Processing...' : `Confirm ${tab}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
