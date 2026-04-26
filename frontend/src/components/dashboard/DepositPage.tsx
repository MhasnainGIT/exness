import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CreditCard, Bitcoin, Wallet, ArrowRight, 
  Info, Clock, ShieldCheck, ChevronRight, Zap,
  Lock, AlertTriangle, ChevronDown
} from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { Button } from '@/components/ui/button';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  time: string;
  fee: string;
  limits: string;
  recommended?: boolean;
}

const METHODS: PaymentMethod[] = [
  { 
    id: 'internal', 
    name: 'Between your accounts', 
    icon: <RefreshIcon />, 
    iconBg: 'bg-[#f4f5f7]', 
    time: 'Instant', 
    fee: '0%', 
    limits: '1 - 1,000,000 USD' 
  },
  { 
    id: 'bankcard', 
    name: 'Bank Card', 
    icon: <CreditCard className="h-5 w-5" />, 
    iconBg: 'bg-[#e8f0fe]', 
    time: 'Instant', 
    fee: '0%', 
    limits: '10 - 10,000 USD',
    recommended: true 
  },
  { 
    id: 'bitcoin', 
    name: 'Bitcoin (BTC)', 
    icon: <Bitcoin className="h-5 w-5" />, 
    iconBg: 'bg-[#fff9e6]', 
    time: 'Up to 72 hours', 
    fee: '0%', 
    limits: '10 - 10,000,000 USD' 
  },
  { 
    id: 'usdt_trc20', 
    name: 'Tether (USDT TRC20)', 
    icon: <UsdtIcon />, 
    iconBg: 'bg-[#e6f4ea]', 
    time: 'Up to 1 hour', 
    fee: '0%', 
    limits: '10 - 1,000,000 USD',
    recommended: true
  },
  { 
    id: 'usdt_erc20', 
    name: 'Tether (USDT ERC20)', 
    icon: <UsdtIcon />, 
    iconBg: 'bg-[#e6f4ea]', 
    time: 'Up to 1 hour', 
    fee: '0%', 
    limits: '100 - 1,000,000 USD' 
  },
  { 
    id: 'ethereum', 
    name: 'Ethereum (ETH)', 
    icon: <EthIcon />, 
    iconBg: 'bg-[#f3e8ff]', 
    time: 'Up to 1 hour', 
    fee: '0%', 
    limits: '50 - 500,000 USD' 
  },
  { 
    id: 'neteller', 
    name: 'Neteller', 
    icon: <span className="font-black text-[10px] text-white">N</span>, 
    iconBg: 'bg-[#89d329]', 
    time: 'Instant', 
    fee: '0%', 
    limits: '10 - 50,000 USD' 
  },
  { 
    id: 'skrill', 
    name: 'Skrill', 
    icon: <span className="font-black text-[10px] text-white">S</span>, 
    iconBg: 'bg-[#810141]', 
    time: 'Instant', 
    fee: '0%', 
    limits: '10 - 50,000 USD' 
  },
];

export function DepositPage() {
  const { showToast } = useUi();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [step, setStep] = useState<'methods' | 'amount'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [targetAccount, setTargetAccount] = useState('Real Standard #12345678');

  return (
    <div className="space-y-8 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Deposit</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Select a payment method to fund your account</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-[13px] font-bold text-[#1c6ed4] hover:underline">
             How to deposit?
          </button>
        </div>
      </div>

      {step === 'methods' ? (
        <>
          {/* Verification Required Banner */}
          <div className="bg-[#fef9e7] border border-[#fde047]/30 rounded-xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-[#e8e8e8] shadow-sm">
                <ShieldCheck className="h-6 w-6 text-[#8b8e94]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1a1b20]">Verification required</h3>
                <p className="text-[13px] text-[#5f6368]">
                  Complete your profile to unlock all payment methods and withdrawal limits.
                </p>
              </div>
            </div>
            <Button
              onClick={() => showToast('Redirecting to profile verification...', 'info')}
              className="bg-[#f04438] hover:bg-[#d93d32] text-white font-bold px-6 h-9 rounded-lg text-[13px] shadow-md transition-all active:scale-95"
            >
              Complete
            </Button>
          </div>

          <section className="space-y-4 pt-4">
            <h2 className="text-[16px] font-bold text-[#1a1b20]">All payment methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {METHODS.map((method) => (
                <Card 
                  key={method.id} 
                  className={`border-gray-100 shadow-sm cursor-pointer transition-all duration-200 relative overflow-hidden group ${hoveredId === method.id ? 'shadow-md border-[#ffce00] -translate-y-0.5' : 'hover:border-gray-200'}`}
                  onMouseEnter={() => setHoveredId(method.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => { setSelectedMethod(method); setStep('amount'); }}
                >
                  <CardContent className="p-0">
                    <div className="p-5 flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${method.iconBg}`}>
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[15px] font-bold text-[#1a1b20] truncate">{method.name}</h3>
                          {method.recommended && (
                             <span className="bg-[#ffce00] text-[#1a1b20] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                               Recommended
                             </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#8b8e94] mt-1">{method.time} • Fee: {method.fee}</div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-[#8b8e94] mt-1 transition-transform ${hoveredId === method.id ? 'translate-x-1' : ''}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setStep('methods')}
            className="flex items-center gap-2 text-[#5f6368] hover:text-[#1a1b20] font-bold text-[13px] mb-6 transition-colors"
          >
            ← Back to all methods
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${selectedMethod?.iconBg}`}>
                        {selectedMethod?.icon}
                     </div>
                     <div>
                        <span className="text-[11px] font-black text-[#8b8e94] uppercase tracking-widest">Payment Method</span>
                        <h4 className="text-[14px] font-bold text-[#1a1b20]">{selectedMethod?.name}</h4>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[13px] font-bold text-[#5f6368]">To account</label>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-[#ffce00] transition-all">
                       <span className="text-[14px] font-bold text-[#1a1b20]">{targetAccount}</span>
                       <ChevronDown className="h-4 w-4 text-[#8b8e94]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[13px] font-bold text-[#5f6368]">Amount (USD)</label>
                    <div className="relative">
                       <input 
                         type="number" 
                         placeholder="0.00" 
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         className="w-full h-14 pl-4 pr-12 text-[24px] font-black text-[#1a1b20] border border-gray-200 rounded-xl focus:border-[#ffce00] outline-none transition-all placeholder:text-gray-100 tabular-nums" 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#1a1b20]">USD</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-[#8b8e94]">
                       <span>Limit: {selectedMethod?.limits}</span>
                       <span className="text-[#f04438]">Required</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { showToast('Processing deposit request...', 'info'); setTimeout(() => { setStep('methods'); showToast('Deposit request submitted!', 'success'); }, 2000); }}
                    className="w-full h-14 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black text-[15px] rounded-xl shadow-lg shadow-[#ffce00]/20 transition-all active:scale-[0.98] mt-4"
                  >
                    Continue
                  </button>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                 <Info className="h-5 w-5 text-blue-600 shrink-0" />
                 <p className="text-[12px] text-blue-800 leading-relaxed font-medium">
                   Deposits are usually processed instantly. In some cases, it may take up to 24 hours depending on the payment provider.
                 </p>
              </div>
            </div>

            <div className="space-y-4">
               <Card className="border-gray-100 shadow-sm rounded-2xl p-6">
                 <h4 className="text-[13px] font-black text-[#1a1b20] uppercase tracking-widest mb-4">Summary</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[13px]">
                       <span className="text-[#5f6368]">Amount</span>
                       <span className="font-bold text-[#1a1b20]">{amount || '0.00'} USD</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                       <span className="text-[#5f6368]">Commission</span>
                       <span className="font-bold text-green-600">0.00 USD</span>
                    </div>
                    <div className="h-px bg-gray-50 my-2" />
                    <div className="flex justify-between text-[15px] font-black">
                       <span className="text-[#1a1b20]">Total to pay</span>
                       <span className="text-[#1a1b20]">{amount || '0.00'} USD</span>
                    </div>
                 </div>
               </Card>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-[#e8f0fe] rounded-xl p-6 flex items-start gap-4">
         <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap className="h-5 w-5 text-[#1c6ed4]" />
         </div>
         <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-[#1a1b20]">Instant internal transfers</h4>
            <p className="text-[13px] text-[#5f6368] leading-relaxed">
              Use internal transfers to move funds between your trading accounts and your wallet in seconds, without any extra fees.
            </p>
         </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11l5-5 5 5" /><path d="M17 13l-5 5-5-5" /><path d="M12 6v12" />
    </svg>
  );
}

function UsdtIcon() {
  return (
    <div className="h-5 w-5 bg-[#26a17b] rounded-full flex items-center justify-center">
       <span className="text-white text-[10px] font-black">₮</span>
    </div>
  );
}

function EthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 417" preserveAspectRatio="xMidYMid">
      <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#343434"/><path d="M127.962 0L0 212.32l127.962 75.638V127.961z" fill="#8C8C8C"/><path d="M127.962 312.187l-1.575 1.92v98.199l1.575 4.634 128.038-180.32z" fill="#3C3C3C"/><path d="M127.962 416.94V312.187L0 236.62z" fill="#8C8C8C"/><path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fill="#141414"/><path d="M0 212.32l127.962 75.638v-133.8z" fill="#393939"/>
    </svg>
  );
}
