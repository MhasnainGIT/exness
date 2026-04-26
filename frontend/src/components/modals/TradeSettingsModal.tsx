import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';

export function TradeSettingsModal({ params, onClose }: { params: { positionId: string; sl: string; tp: string }; onClose: () => void }) {
  const [sl, setSl] = useState(params.sl);
  const [tp, setTp] = useState(params.tp);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi(`/trading/positions/${params.positionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          stopLoss: sl ? Number(sl) : null, 
          takeProfit: tp ? Number(tp) : null 
        })
      });
      showToast('Trade settings updated successfully', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update trade settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-sleek-dark border border-sleek-border rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-sleek-border">
          <h2 className="text-sm font-black text-white italic uppercase tracking-wider">Modify Position</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-sleek-muted hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sleek-muted uppercase tracking-widest">Stop Loss Price</label>
            <input 
              type="number"
              step="0.00001"
              value={sl}
              onChange={e => setSl(e.target.value)}
              className="w-full bg-sleek-panel border border-sleek-border rounded-md py-2.5 px-3 text-white font-mono text-sm focus:ring-1 focus:ring-sleek-gold outline-none"
              placeholder="Not set"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sleek-muted uppercase tracking-widest">Take Profit Price</label>
            <input 
              type="number"
              step="0.00001"
              value={tp}
              onChange={e => setTp(e.target.value)}
              className="w-full bg-sleek-panel border border-sleek-border rounded-md py-2.5 px-3 text-white font-mono text-sm focus:ring-1 focus:ring-sleek-gold outline-none"
              placeholder="Not set"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black uppercase tracking-wider py-5 mt-2 text-xs">
            {loading ? 'Saving...' : `Modify Position`}
          </Button>
        </form>
      </div>
    </div>
  );
}
