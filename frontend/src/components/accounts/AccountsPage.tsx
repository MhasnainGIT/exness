import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Plus, RefreshCw, Settings } from 'lucide-react';

const LEVERAGES = [1, 2, 5, 10, 25, 50, 100, 200, 400, 500, 1000, 2000];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-sleek-dark border border-sleek-border rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="text-sleek-muted hover:text-white text-xl font-bold">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'leverage' | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [form, setForm] = useState({ accountType: 'DEMO', leverage: 200, baseCurrency: 'USD' });
  const [newLeverage, setNewLeverage] = useState(200);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/accounts');
      setAccounts(data?.accounts ?? data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createAccount = async () => {
    setSubmitting(true); setMsg({ text: '', ok: true });
    try {
      await fetchApi('/accounts', { method: 'POST', body: JSON.stringify(form) });
      setMsg({ text: 'Account created!', ok: true });
      await load();
      setTimeout(() => { setModal(null); setMsg({ text: '', ok: true }); }, 1200);
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setSubmitting(false); }
  };

  const updateLeverage = async () => {
    if (!selectedAccount) return;
    setSubmitting(true); setMsg({ text: '', ok: true });
    try {
      await fetchApi(`/accounts/${selectedAccount.id}/leverage`, { method: 'PATCH', body: JSON.stringify({ leverage: newLeverage }) });
      setMsg({ text: 'Leverage updated!', ok: true });
      await load();
      setTimeout(() => { setModal(null); setMsg({ text: '', ok: true }); }, 1200);
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setSubmitting(false); }
  };

  const inputCls = "w-full bg-sleek-panel border border-sleek-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-sleek-gold";
  const labelCls = "text-[10px] font-black text-sleek-muted uppercase tracking-widest block mb-2";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider italic">My Accounts</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={load} className="text-sleek-muted hover:text-white"><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => setModal('create')} className="bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-9 px-4 gap-2 text-xs uppercase tracking-wider">
            <Plus className="h-4 w-4" /> New Account
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sleek-muted">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 bg-sleek-panel rounded-xl border border-sleek-border border-dashed">
          <p className="text-sleek-muted text-sm font-bold uppercase tracking-widest">No accounts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc: any) => {
            const bal = parseFloat(acc.balance).toFixed(2);
            const [i, f] = bal.split('.');
            return (
              <Card key={acc.id} className="bg-sleek-panel border border-sleek-border hover:border-sleek-gold/30 transition-all rounded-xl">
                <CardContent className="p-0">
                  <div className="bg-sleek-dark/50 px-6 py-2.5 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-sleek-muted border-b border-sleek-border">
                    <span className={`px-2 py-0.5 rounded-sm ${acc.accountType === 'LIVE' ? 'bg-sleek-gold text-black' : 'bg-sleek-muted text-black'}`}>{acc.accountType}</span>
                    <span className="text-sleek-text">{acc.platform}</span>
                    <span className="text-sleek-gold"># {acc.accountNumber}</span>
                    <span className="text-sleek-muted">Leverage: 1:{acc.leverage}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-sm ${acc.status === 'ACTIVE' ? 'bg-sleek-green/10 text-sleek-green' : 'bg-sleek-red/10 text-sleek-red'}`}>{acc.status}</span>
                  </div>
                  <div className="px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-sleek-muted uppercase tracking-widest mb-1">Balance</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white tabular-nums">{Number(i).toLocaleString()}</span>
                          <span className="text-sm font-bold text-sleek-muted">.{f}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-sleek-muted uppercase tracking-widest mb-1">Equity</p>
                        <span className="text-lg font-black text-white tabular-nums">{parseFloat(acc.equity).toFixed(2)}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-sleek-muted uppercase tracking-widest mb-1">Free Margin</p>
                        <span className="text-lg font-black text-white tabular-nums">{parseFloat(acc.freeMargin).toFixed(2)}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-sleek-muted uppercase tracking-widest mb-1">Margin Level</p>
                        <span className="text-lg font-black text-white tabular-nums">{parseFloat(acc.marginLevel || '0').toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => navigate(`/terminal?accountId=${acc.id}`)} className="bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-10 px-5 gap-2 text-xs uppercase tracking-wider">
                        <Play className="h-3.5 w-3.5 fill-black" /> Trade
                      </Button>
                      <Button variant="outline" onClick={() => { setSelectedAccount(acc); setNewLeverage(acc.leverage); setModal('leverage'); }}
                        className="border-sleek-border bg-sleek-dark hover:bg-sleek-hover text-sleek-text h-10 px-4 gap-2 text-xs uppercase tracking-wider">
                        <Settings className="h-3.5 w-3.5 text-sleek-gold" /> Leverage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="Open New Account" onClose={() => { setModal(null); setMsg({ text: '', ok: true }); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Account Type</label>
              <select className={inputCls} value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
                <option value="DEMO">Demo</option>
                <option value="LIVE">Live</option>
              </select></div>
            <div><label className={labelCls}>Leverage</label>
              <select className={inputCls} value={form.leverage} onChange={e => setForm({ ...form, leverage: Number(e.target.value) })}>
                {LEVERAGES.map(l => <option key={l} value={l}>1:{l}</option>)}
              </select></div>
            <div><label className={labelCls}>Base Currency</label>
              <select className={inputCls} value={form.baseCurrency} onChange={e => setForm({ ...form, baseCurrency: e.target.value })}>
                {['USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            {msg.text && <p className={`text-sm font-bold ${msg.ok ? 'text-sleek-green' : 'text-sleek-red'}`}>{msg.text}</p>}
            <Button onClick={createAccount} disabled={submitting} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'leverage' && selectedAccount && (
        <Modal title={`Change Leverage — #${selectedAccount.accountNumber}`} onClose={() => { setModal(null); setMsg({ text: '', ok: true }); }}>
          <div className="space-y-4">
            <p className="text-sleek-muted text-xs">Current leverage: 1:{selectedAccount.leverage}</p>
            <div><label className={labelCls}>New Leverage</label>
              <select className={inputCls} value={newLeverage} onChange={e => setNewLeverage(Number(e.target.value))}>
                {LEVERAGES.map(l => <option key={l} value={l}>1:{l}</option>)}
              </select></div>
            {msg.text && <p className={`text-sm font-bold ${msg.ok ? 'text-sleek-green' : 'text-sleek-red'}`}>{msg.text}</p>}
            <Button onClick={updateLeverage} disabled={submitting} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
              {submitting ? 'Updating...' : 'Update Leverage'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
