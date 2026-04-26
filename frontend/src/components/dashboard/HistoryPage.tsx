import React, { useEffect, useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/trading/orders/history?status=FILLED&limit=50')
      .then(res => setHistory(Array.isArray(res) ? res : res.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Order History</h1>

      <div className="bg-sleek-panel border border-sleek-border rounded-xl overflow-hidden mt-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-sleek-darker/50">
              <tr>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted">Order #</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted">Asset</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted">Side</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted">Lots</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted">Price</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-sleek-muted text-right">Date</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-sleek-border">
              {history.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-sleek-muted">No orders found.</td></tr>
              ) : (
                history.map(order => (
                  <tr key={order.id} className="hover:bg-sleek-hover transition-colors">
                    <td className="p-4 text-xs font-mono text-sleek-muted">#{order.orderNumber.substring(0, 8)}</td>
                    <td className="p-4 font-bold text-white">{order.instrument?.symbol || order.instrumentId.substring(0, 6)}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${order.side === 'BUY' ? 'bg-sleek-green/20 text-sleek-green' : 'bg-sleek-red/20 text-sleek-red'}`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{parseFloat(order.volumeLots).toFixed(2)}</td>
                    <td className="p-4 font-mono">{parseFloat(order.executedPrice || order.requestedPrice).toFixed(5)}</td>
                    <td className="p-4 text-right text-xs text-sleek-muted">{new Date(order.placedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
