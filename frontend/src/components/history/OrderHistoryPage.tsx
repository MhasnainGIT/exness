import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ accountId: '', status: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const accs = await fetchApi('/accounts');
      const accList = accs?.accounts ?? accs ?? [];
      setAccounts(accList);

      const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
      if (filters.accountId) params.set('accountId', filters.accountId);
      if (filters.status) params.set('status', filters.status);

      const data = await fetchApi(`/trading/orders/history?${params}`);
      setOrders(data?.orders ?? []);
      setPagination({ total: data?.pagination?.total ?? 0, pages: data?.pagination?.pages ?? 1 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters.page, filters.accountId, filters.status]);

  const selectCls = "bg-sleek-panel border border-sleek-border rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-sleek-gold";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider italic">Order History</h1>
        <Button variant="ghost" size="icon" onClick={load} className="text-sleek-muted hover:text-white"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filters.accountId} onChange={e => setFilters({ ...filters, accountId: e.target.value, page: 1 })} className={selectCls}>
          <option value="">All Accounts</option>
          {accounts.map((a: any) => <option key={a.id} value={a.id}>#{a.accountNumber} ({a.accountType})</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} className={selectCls}>
          <option value="">All Statuses</option>
          {['FILLED', 'PENDING', 'CANCELLED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card className="bg-sleek-panel border border-sleek-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sleek-muted text-sm">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sleek-muted text-sm font-bold uppercase tracking-widest">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-sleek-darker/50 border-b border-sleek-border">
                  <tr>{['Order #', 'Symbol', 'Side', 'Type', 'Volume', 'Price', 'Status', 'Date'].map(h => (
                    <th key={h} className="p-4 font-bold text-sleek-muted uppercase tracking-wider text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id} className="border-b border-sleek-border/40 hover:bg-sleek-hover/30 transition-colors">
                      <td className="p-4 font-mono text-sleek-muted text-[10px]">{o.orderNumber}</td>
                      <td className="p-4 font-black text-white">{o.instrument?.symbol}</td>
                      <td className="p-4"><span className={`font-black ${o.side === 'BUY' ? 'text-sleek-green' : 'text-sleek-red'}`}>{o.side}</span></td>
                      <td className="p-4 text-sleek-muted">{o.type}</td>
                      <td className="p-4 font-mono text-white">{parseFloat(o.volumeLots).toFixed(2)}</td>
                      <td className="p-4 font-mono text-white">{o.executedPrice ? parseFloat(o.executedPrice).toFixed(5) : '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          o.status === 'FILLED' ? 'bg-sleek-green/10 text-sleek-green' :
                          o.status === 'PENDING' ? 'bg-sleek-gold/10 text-sleek-gold' :
                          'bg-sleek-red/10 text-sleek-red'}`}>{o.status}</span>
                      </td>
                      <td className="p-4 text-sleek-muted">{new Date(o.placedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="border-sleek-border text-sleek-muted hover:text-white">Prev</Button>
          <span className="text-sleek-muted text-sm">{filters.page} / {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="border-sleek-border text-sleek-muted hover:text-white">Next</Button>
        </div>
      )}
    </div>
  );
}
