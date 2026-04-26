import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Download, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, 
  HelpCircle, ExternalLink, Calendar,
  CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUi } from '../../contexts/UiContext';
import { fetchApi } from '../../lib/api';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  method: string;
  amount: string;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  date: string;
  account: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'DEPOSIT', method: 'Bank Card', amount: '500.00', currency: 'USD', status: 'COMPLETED', date: '2024-03-15 14:30', account: '#847321' },
  { id: '2', type: 'WITHDRAWAL', method: 'Bitcoin', amount: '120.00', currency: 'USD', status: 'PENDING', date: '2024-03-15 12:15', account: '#847321' },
  { id: '3', type: 'TRANSFER', method: 'Between accounts', amount: '1,000.00', currency: 'USD', status: 'COMPLETED', date: '2024-03-14 09:45', account: '#847321' },
];

export function TransactionHistoryPage() {
  const { showToast } = useUi();
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = () => {
    setLoading(true);
    fetchApi('/wallets/transactions')
      .then(res => {
        const data = Array.isArray(res) ? res : (res.data || []);
        setTransactions(data);
      })
      .catch(err => showToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    if (filterType !== 'All' && t.type !== filterType.toUpperCase()) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus.toUpperCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Transaction history</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTransactions}
            className="flex items-center gap-2 text-[13px] font-bold text-[#8b8e94] hover:text-[#1a1b20] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={() => showToast('Downloading CSV...', 'info')}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1c6ed4] hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Export as CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
           <button className="flex items-center gap-2 px-3 h-10 border border-gray-200 rounded-lg text-[13px] text-[#1a1b20] font-bold hover:bg-gray-50 bg-white">
              <Calendar className="h-4 w-4 text-[#8b8e94]" /> 
              Last 30 days
              <ChevronDown className="h-4 w-4 text-[#8b8e94]" />
           </button>
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8e94]" />
              <input 
                type="text" 
                placeholder="Search by ID or account" 
                className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#ffce00]"
              />
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <FilterSelect label="Type" value={filterType} options={['All', 'Deposit', 'Withdrawal', 'Transfer']} onChange={setFilterType} />
           <FilterSelect label="Status" value={filterStatus} options={['All', 'Completed', 'Pending', 'Rejected']} onChange={setFilterStatus} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafbfc] border-b border-gray-100 font-bold text-[#8b8e94]">
            <tr>
              <th className="px-6 py-4">Transaction Type</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4 text-center">Account</th>
              <th className="px-6 py-4">Method / ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-[#8b8e94] italic">Loading transactions...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={6} className="text-center py-20 text-[#8b8e94] italic">No transactions found</td></tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#fafbfc] cursor-pointer group transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        tx.type === 'DEPOSIT' ? 'bg-[#e6f4ea] text-[#22c55e]' : 
                        tx.type === 'WITHDRAWAL' ? 'bg-[#ffebee] text-[#ef5350]' : 
                        'bg-[#f0f1f5] text-[#5f6368]'
                      }`}>
                        {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="h-4 w-4" /> : 
                         tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="h-4 w-4" /> : 
                         <RefreshCw className="h-4 w-4" />}
                      </div>
                      <span className="font-bold text-[#1a1b20]">{tx.type === 'TRANSFER' ? 'Internal Transfer' : tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[#5f6368]">{new Date(tx.date || Date.now()).toLocaleString()}</td>
                  <td className="px-6 py-5 text-center font-bold text-[#1a1b20]">{tx.account || 'Wallet'}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#1a1b20]">{tx.method || 'System'}</span>
                      <span className="text-[11px] text-[#8b8e94]">ID: {tx.id.slice(0, 12)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`flex items-center gap-1.5 text-[12px] font-bold ${
                      tx.status === 'COMPLETED' ? 'text-[#22c55e]' : 
                      tx.status === 'PENDING' ? 'text-[#f59e0b]' : 
                      'text-[#ef5350]'
                    }`}>
                      {tx.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                       tx.status === 'PENDING' ? <Clock className="h-3.5 w-3.5" /> : 
                       <XCircle className="h-3.5 w-3.5" />}
                      {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className={`px-6 py-5 text-right font-black tabular-nums text-[15px] ${
                    tx.type === 'WITHDRAWAL' ? 'text-[#ef5350]' : 'text-[#1a1b20]'
                  }`}>
                    {tx.type === 'WITHDRAWAL' ? '-' : '+'}{parseFloat(tx.amount).toLocaleString()} <span className="text-[11px] text-[#8b8e94] font-bold">{tx.currency || 'USD'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
           <span className="text-[12px] text-[#8b8e94]">Showing 3 of 3 transactions</span>
           <div className="flex items-center gap-2">
              <button disabled className="px-3 h-8 border border-gray-200 rounded text-[12px] text-gray-300">Previous</button>
              <button disabled className="px-3 h-8 border border-gray-200 rounded text-[12px] text-gray-300">Next</button>
           </div>
        </div>
      </div>

      {/* Support Tip */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4">
         <div className="h-10 w-10 bg-[#f4f5f7] rounded-lg flex items-center justify-center flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-[#5f6368]" />
         </div>
         <div>
            <h4 className="text-[14px] font-bold text-[#1a1b20] mb-1">Didn't find what you're looking for?</h4>
            <p className="text-[13px] text-[#5f6368] mb-3">If a transaction is missing or you have questions about a status, our support team can help.</p>
            <div className="flex items-center gap-4">
               <button className="text-[#1c6ed4] text-[13px] font-bold hover:underline">Contact Support</button>
               <button className="text-[#1c6ed4] text-[13px] font-bold hover:underline flex items-center gap-1">
                  View support requests <ExternalLink className="h-3 w-3" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 h-10 border border-gray-200 rounded-lg text-[13px] text-[#1a1b20] font-bold bg-white hover:bg-gray-50"
      >
        <span className="text-[#8b8e94] font-medium">{label}:</span> {value}
        <ChevronDown className="h-4 w-4 text-[#8b8e94]" />
      </button>
      
      {open && (
         <>
         <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
         <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 shadow-xl rounded-lg z-[110] overflow-hidden py-1">
            {options.map((opt) => (
               <button 
                 key={opt}
                 onClick={() => { onChange(opt); setOpen(false); }}
                 className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${value === opt ? 'text-[#1c6ed4] font-bold bg-blue-50/50' : 'text-[#5f6368]'}`}
               >
                 {opt}
               </button>
            ))}
         </div>
         </>
      )}
    </div>
  );
}
