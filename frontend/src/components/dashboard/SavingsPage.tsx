import React, { useState } from 'react';
import { 
  PiggyBank, TrendingUp, Shield, 
  ArrowRight, Calculator, CheckCircle2,
  Info, Zap, Clock, ChevronDown
} from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SavingsPage() {
  const { showToast } = useUi();
  const [amount, setAmount] = useState<string>('10000');
  const [period, setPeriod] = useState<string>('monthly');
  
  const annualRate = 3.00;
  const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  
  const monthlyEarnings = (numAmount * (annualRate / 100)) / 12;
  const dailyEarnings = (numAmount * (annualRate / 100)) / 365;
  const annualEarnings = (numAmount * (annualRate / 100));

  const displayEarnings = period === 'monthly' ? monthlyEarnings : period === 'daily' ? dailyEarnings : annualEarnings;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Savings</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Earn consistent returns on your idle trading capital</p>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#141D22] to-[#1b262c] rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-10 w-10 bg-[#ffce00] rounded-full flex items-center justify-center shadow-md">
                <PiggyBank className="h-5 w-5 text-[#1a1b20]" />
             </div>
             <span className="text-[11px] font-black uppercase tracking-widest text-[#ffce00]">Exness Savings Program</span>
          </div>
          <h2 className="text-[32px] font-black mb-3">Earn up to 3% APR while you sleep</h2>
          <p className="text-[#8b8e94] text-[15px] leading-relaxed mb-6">
            Put your money to work without locking it up. Interest is calculated daily and paid out instantly to your wallet.
          </p>
          <div className="flex items-center gap-6">
             <StatMini label="Daily Payout" />
             <StatMini label="No Lock-up" />
             <StatMini label="Zero Fees" />
          </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
           <TrendingUp className="h-64 w-64 text-[#ffce00]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Card */}
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardContent className="p-8">
             <h3 className="text-[16px] font-bold text-[#1a1b20] mb-6 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#8b8e94]" /> Returns Calculator
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div>
                      <label className="text-[12px] font-black text-[#8b8e94] uppercase mb-1.5 block">Saving Amount (USD)</label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1b20] font-bold">$</span>
                         <input 
                           type="text" 
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full h-12 pl-7 pr-4 border border-gray-200 rounded-lg text-[15px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ffce00] focus:border-[#ffce00]"
                         />
                      </div>
                   </div>
                   
                   <div className="flex gap-2 p-1 bg-gray-50 rounded-lg border border-gray-100">
                      {['daily', 'monthly', 'annual'].map((p) => (
                        <button 
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`flex-1 h-9 rounded-md text-[12px] font-black uppercase tracking-tighter transition-all ${period === p ? 'bg-white text-[#1a1b20] shadow-sm' : 'text-[#8b8e94] hover:text-[#5f6368]'}`}
                        >
                          {p}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="bg-[#f0f4ff] border border-[#dbeafe] rounded-xl p-6 flex flex-col justify-center">
                   <span className="text-[12px] font-black text-[#1c6ed4] uppercase mb-1">Estimated {period} Earnings</span>
                   <div className="flex items-baseline gap-1.5">
                      <span className="text-[32px] font-black text-[#1a1b20] tracking-tighter">
                        +${displayEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[14px] text-[#1c6ed4] font-bold italic">USD</span>
                   </div>
                   <p className="text-[11px] text-[#8b8e94] mt-2 font-medium">Based on current variable rate of {annualRate}% per year.</p>
                </div>
             </div>
             
             <button 
               onClick={() => showToast('Savings activation request sent', 'success')}
               className="w-full mt-8 h-12 bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black rounded-lg text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
             >
                Start Earning Now <ArrowRight className="h-4 w-4" />
             </button>
          </CardContent>
        </Card>

        {/* Benefits Sidebar */}
        <div className="space-y-4">
           <h3 className="text-[14px] font-black text-[#8b8e94] uppercase tracking-wider px-1">Why Savings?</h3>
           <BenefitBox 
             icon={<Zap className="h-4 w-4 text-[#ffce00]" />} 
             title="Instant Withdrawals" 
             desc="Your principal and interest are never locked. Move them back to your trading accounts anytime." 
           />
           <BenefitBox 
             icon={<Shield className="h-4 w-4 text-[#22c55e]" />} 
             title="Principal Protection" 
             desc="We use advanced hedging strategies to ensure your savings base remains secure from market volatility." 
           />
           <BenefitBox 
             icon={<Clock className="h-4 w-4 text-[#1c6ed4]" />} 
             title="Poured Daily" 
             desc="Earnings are calculated every 24 hours and added directly to your wallet balance." 
           />
        </div>
      </div>

      {/* FAQ / How it works grid */}
      <section className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
         <h3 className="text-[18px] font-bold text-[#1a1b20]">How the savings program works</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step num="1" title="Fund Wallet" desc="Deposit funds into your main wallet or transfer from trading accounts." />
            <Step num="2" title="Auto-Calculate" desc="Our system checks your balance every 24h at 00:00 GMT." />
            <Step num="3" title="Collect Interest" desc="Earnings are paid out the next day. Compound your returns for more growth." />
         </div>
      </section>
    </div>
  );
}

function StatMini({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-bold text-[#e2e4e7]">
       <CheckCircle2 className="h-4 w-4 text-[#ffce00]" /> {label}
    </div>
  );
}

function BenefitBox({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-gray-100 shadow-sm border-l-2 border-l-[#ffce00]">
       <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
             {icon}
             <h4 className="text-[13px] font-bold text-[#1a1b20]">{title}</h4>
          </div>
          <p className="text-[11px] text-[#5f6368] leading-relaxed">{desc}</p>
       </CardContent>
    </Card>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="space-y-2">
       <div className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-[14px] font-black text-[#8b8e94] border border-gray-100 shadow-sm">
          {num}
       </div>
       <h4 className="text-[15px] font-bold text-[#1a1b20]">{title}</h4>
       <p className="text-[13px] text-[#5f6368] leading-relaxed">{desc}</p>
    </div>
  );
}
