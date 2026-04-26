import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';

export function InternalTransferModal({ onClose }: { onClose: () => void }) {
  const { showToast, workspace } = useUi();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    fetchApi('/wallets')
      .then((data: any) => setWallet(data?.wallet ?? data))
      .catch(console.error);
    
    fetchApi('/accounts')
      .then((data: any) => {
        const accs = data?.accounts ?? data ?? [];
        // Typically internal transfers go to REAL accounts unless stated otherwise
        const realAccs = accs.filter((a: any) => a.accountType === 'LIVE');
        setAccounts(realAccs);
        if (realAccs.length > 0) setSelectedAccountId(realAccs[0].id);
      })
      .catch(console.error);
  }, [workspace]);

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!selectedAccountId) {
      showToast('Please select a trading account', 'error');
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/wallets/transfer', {
        method: 'POST',
        body: JSON.stringify({ toAccountId: selectedAccountId, amount: parseFloat(amount) })
      });
      showToast(`Transfer successful!`, 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Transfer failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl w-full max-w-[400px] relative shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafbfc]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-50 text-[#1c6ed4] rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <h3 className="text-[16px] font-black text-[#1a1b20]">Internal Transfer</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-[#8b8e94] hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4 relative">
             <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-bold text-[#8b8e94] uppercase tracking-wider mb-1">From Wallet</p>
                   <p className="text-[14px] font-black text-[#1a1b20] flex items-center gap-2">
                     <Wallet className="h-4 w-4 text-[#8b8e94]" /> Main Wallet (USD)
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-bold text-[#8b8e94] uppercase tracking-wider mb-1">Available</p>
                   <p className="text-[14px] font-black text-[#22c55e]">{parseFloat(wallet?.balance || '0').toFixed(2)} USD</p>
                </div>
             </div>

             <div className="absolute left-1/2 -ml-4 top-[58px] h-8 w-8 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center z-10 text-[#8b8e94]">
                <ArrowRightLeft className="h-3.5 w-3.5 rotate-90" />
             </div>

             <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-[11px] font-bold text-[#8b8e94] uppercase tracking-wider mb-3">To Trading Account</p>
                <select 
                   value={selectedAccountId}
                   onChange={(e) => setSelectedAccountId(e.target.value)}
                   className="w-full text-[14px] font-black text-[#1a1b20] bg-transparent outline-none cursor-pointer"
                >
                   {accounts.length === 0 && <option value="" disabled>No real accounts available</option>}
                   {accounts.map(a => (
                     <option key={a.id} value={a.id}>Standard #{a.accountNumber} ({parseFloat(a.balance).toFixed(2)} USD)</option>
                   ))}
                </select>
             </div>
          </div>

          <div>
             <label className="text-[13px] font-bold text-[#1a1b20] mb-2 block">Amount to transfer (USD)</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8e94] font-black">$</span>
                <input
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full h-12 border border-gray-200 rounded-xl px-8 font-black text-[15px] focus:outline-none focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/20 transition-all font-mono"
                   placeholder="0.00"
                />
                <button 
                  onClick={() => setAmount(wallet?.balance || '0')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-[#1c6ed4] hover:underline uppercase"
                >
                  Max
                </button>
             </div>
          </div>
        </div>

        <div className="p-6 pt-0 mt-2">
          <Button 
            onClick={handleTransfer}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black rounded-xl text-[14px] shadow-sm disabled:opacity-50"
          >
            {loading ? 'Transferring...' : 'Confirm Transfer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
