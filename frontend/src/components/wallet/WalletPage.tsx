import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { ArrowDownLeft, ArrowUpRight, Repeat, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CREDIT_CARD', 'CRYPTO', 'SKRILL', 'NETELLER', 'PERFECT_MONEY'];

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

export function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [form, setForm] = useState({ amount: '', paymentMethod: 'BANK_TRANSFER', toAccountId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [w, t, a] = await Promise.all([
        fetchApi('/wallets'),
        fetchApi('/wallets/transactions?limit=50'),
        fetchApi('/accounts'),
      ]);
      setWallet(w?.wallet ?? w);
      setTransactions(t?.items ?? t ?? []);
      setAccounts(a?.accounts ?? a ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (type: 'deposit' | 'withdraw' | 'transfer') => {
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (type === 'deposit') {
        await fetchApi('/wallets/deposit', { method: 'POST', body: JSON.stringify({ amount: parseFloat(form.amount), paymentMethod: form.paymentMethod }) });
        setSuccess('Deposit successful!');
      } else if (type === 'withdraw') {
        await fetchApi('/wallets/withdraw', { method: 'POST', body: JSON.stringify({ amount: parseFloat(form.amount), paymentMethod: form.paymentMethod }) });
        setSuccess('Withdrawal request submitted!');
      } else {
        await fetchApi('/wallets/transfer', { method: 'POST', body: JSON.stringify({ amount: parseFloat(form.amount), toAccountId: form.toAccountId }) });
        setSuccess('Transfer successful!');
      }
      await load();
      setTimeout(() => { setModal(null); setSuccess(''); setForm({ amount: '', paymentMethod: 'BANK_TRANSFER', toAccountId: '' }); }, 1500);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const balance = wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00';
  const [intPart, fracPart] = balance.split('.');

  const txColor = (type: string) => {
    if (['DEPOSIT', 'TRADE_PNL'].includes(type)) return 'text-sleek-green';
    if (type === 'WITHDRAWAL') return 'text-sleek-red';
    return 'text-sleek-muted';
  };

  const inputCls = "w-full bg-sleek-panel border border-sleek-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-sleek-gold";
  const labelCls = "text-[10px] font-black text-sleek-muted uppercase tracking-widest block mb-2";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-sleek-panel border border-sleek-border">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className={labelCls}>Wallet Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tabular-nums">{Number(intPart).toLocaleString()}</span>
                <span className="text-2xl font-bold text-sleek-muted">.{fracPart} USD</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setModal('deposit')} className="bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 px-6 gap-2 uppercase text-xs tracking-wider">
                <ArrowDownLeft className="h-4 w-4" /> Deposit
              </Button>
              <Button onClick={() => setModal('withdraw')} variant="outline" className="border-sleek-border bg-sleek-dark hover:bg-sleek-hover text-sleek-text font-bold h-11 px-6 gap-2 uppercase text-xs tracking-wider">
                <ArrowUpRight className="h-4 w-4 text-sleek-gold" /> Withdraw
              </Button>
              <Button onClick={() => setModal('transfer')} variant="outline" className="border-sleek-border bg-sleek-dark hover:bg-sleek-hover text-sleek-text font-bold h-11 px-6 gap-2 uppercase text-xs tracking-wider">
                <Repeat className="h-4 w-4 text-sleek-gold" /> Transfer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white uppercase tracking-wider italic">Transaction History</h2>
        <Button variant="ghost" size="icon" onClick={load} className="text-sleek-muted hover:text-white"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Card className="bg-sleek-panel border border-sleek-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sleek-muted text-sm">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-sleek-muted text-sm font-bold uppercase tracking-widest">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-sleek-darker/50 border-b border-sleek-border">
                  <tr>{['Type', 'Amount', 'Status', 'Method', 'Date'].map(h => (
                    <th key={h} className="p-4 font-bold text-sleek-muted uppercase tracking-wider text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-sleek-border/40 hover:bg-sleek-hover/30 transition-colors">
                      <td className={`p-4 font-black ${txColor(tx.type)}`}>{tx.type.replace(/_/g, ' ')}</td>
                      <td className={`p-4 font-black tabular-nums ${parseFloat(tx.amount) >= 0 ? 'text-white' : 'text-sleek-red'}`}>
                        {parseFloat(tx.amount) >= 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(2)} USD
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          tx.status === 'COMPLETED' ? 'bg-sleek-green/10 text-sleek-green' :
                          tx.status === 'PENDING' ? 'bg-sleek-gold/10 text-sleek-gold' :
                          'bg-sleek-red/10 text-sleek-red'}`}>{tx.status}</span>
                      </td>
                      <td className="p-4 text-sleek-muted">{tx.metadata?.paymentMethod?.replace(/_/g, ' ') || '—'}</td>
                      <td className="p-4 text-sleek-muted">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modal === 'deposit' && (
        <Modal title="Deposit Funds" onClose={() => { setModal(null); setError(''); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Amount (USD)</label>
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="0.00" /></div>
            <div><label className={labelCls}>Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select></div>
            {error && <p className="text-sleek-red text-sm font-bold">{error}</p>}
            {success && <p className="text-sleek-green text-sm font-bold">{success}</p>}
            <Button onClick={() => handleSubmit('deposit')} disabled={submitting || !form.amount} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
              {submitting ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'withdraw' && (
        <Modal title="Withdraw Funds" onClose={() => { setModal(null); setError(''); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Amount (USD)</label>
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="0.00" />
              <p className="text-[10px] text-sleek-muted mt-1">Available: {balance} USD</p></div>
            <div><label className={labelCls}>Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select></div>
            {error && <p className="text-sleek-red text-sm font-bold">{error}</p>}
            {success && <p className="text-sleek-green text-sm font-bold">{success}</p>}
            <Button onClick={() => handleSubmit('withdraw')} disabled={submitting || !form.amount} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
              {submitting ? 'Processing...' : 'Withdraw'}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'transfer' && (
        <Modal title="Transfer to Trading Account" onClose={() => { setModal(null); setError(''); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Trading Account</label>
              <select value={form.toAccountId} onChange={e => setForm({ ...form, toAccountId: e.target.value })} className={inputCls}>
                <option value="">Select account</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>#{a.accountNumber} — {a.accountType} — {parseFloat(a.balance).toFixed(2)} {a.baseCurrency}</option>)}
              </select></div>
            <div><label className={labelCls}>Amount (USD)</label>
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="0.00" /></div>
            {error && <p className="text-sleek-red text-sm font-bold">{error}</p>}
            {success && <p className="text-sleek-green text-sm font-bold">{success}</p>}
            <Button onClick={() => handleSubmit('transfer')} disabled={submitting || !form.amount || !form.toAccountId} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
              {submitting ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
