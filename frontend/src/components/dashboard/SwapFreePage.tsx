import React from 'react';
import { Check, Info, ArrowRight, Shield, Zap, Award } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { Card, CardContent } from '@/components/ui/card';

const SWAP_FREE_INSTRUMENTS = [
  { group: 'Forex Majors', instruments: 'EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD' },
  { group: 'Forex Minors', instruments: 'EURGBP, EURJPY, GBPJPY, AUDJPY, CADJPY' },
  { group: 'Metals', instruments: 'XAUUSD (Gold)' },
  { group: 'Indices', instruments: 'USTEC, US30, US500, DE30' },
  { group: 'Crypto', instruments: 'BTCUSD, ETHUSD, SOLUSD' },
];

export function SwapFreePage() {
  const { showToast } = useUi();

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold text-[#1a1b20]">Extended Swap-Free</h1>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-[#f0fdf4] text-[#22c55e] text-[12px] font-bold rounded-full border border-[#bbf7d0]">
          <Check className="h-3.5 w-3.5" /> Program Active
        </span>
      </div>
      <p className="text-[14px] text-[#5f6368] -mt-3">Trade without overnight charges on most popular instruments</p>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-[#141D22] to-[#1b262c] rounded-xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-[24px] font-black mb-3">Keep your positions open for longer</h2>
          <p className="text-[#8b8e94] text-[15px] leading-relaxed mb-6">
            Our Extended Swap-free program is available to all clients. We don't charge swaps on most of our symbols, allowing you to hold trades overnight without any extra costs.
          </p>
          <div className="flex flex-wrap gap-4">
            <Feature icon={<Shield className="h-4 w-4" />} text="No hidden fees" />
            <Feature icon={<Zap className="h-4 w-4" />} text="Automatic activation" />
            <Feature icon={<Award className="h-4 w-4" />} text="Fair use policy" />
          </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
           <Award className="h-64 w-64" />
        </div>
      </div>

      {/* Status Section */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-[#ffce00] rounded-full flex items-center justify-center flex-shrink-0">
               <span className="text-[20px] font-black text-[#1a1b20]">!</span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1a1b20] mb-1">Your Swap-free Status</h3>
              <p className="text-[13px] text-[#5f6368] mb-4">You are currently qualified for the Extended Swap-free level. This is based on your trading activity.</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#22c55e] w-[100%]" />
                </div>
                <span className="text-[12px] font-bold text-[#22c55e]">Extended</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruments Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-bold text-[#1a1b20]">
          Swap-free Instruments
        </div>
        <table className="w-full text-left text-[13px]">
           <thead className="bg-[#fafbfc] border-b border-gray-100 font-medium text-[#8b8e94]">
             <tr>
               <th className="px-6 py-3">Category</th>
               <th className="px-6 py-3">Included Instruments</th>
               <th className="px-6 py-3 text-right">Status</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {SWAP_FREE_INSTRUMENTS.map((item) => (
               <tr key={item.group} className="hover:bg-[#fafbfc]">
                 <td className="px-6 py-4 font-bold text-[#1a1b20]">{item.group}</td>
                 <td className="px-6 py-4 text-[#5f6368]">{item.instruments}</td>
                 <td className="px-6 py-4 text-right">
                    <span className="text-[11px] font-black text-[#22c55e] uppercase">Swap-Free</span>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StepCard 
          num="01" 
          title="Open Trades" 
          desc="Open positions on any of the symbols part of the program." 
        />
        <StepCard 
          num="02" 
          title="Hold Overnight" 
          desc="Keep your trades open beyond the daily market close." 
        />
        <StepCard 
          num="03" 
          title="Zero Charges" 
          desc="No interest is subtracted or added to your account balance." 
        />
      </div>

      <button 
        onClick={() => showToast('Swap-free policy details opening...', 'info')}
        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-[#1a1b20] font-bold h-12 rounded-lg text-[14px] flex items-center justify-center gap-2 transition-colors"
      >
        View Detailed Policy <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium text-[#e2e4e7]">
      <div className="text-[#ffce00]">{icon}</div>
      {text}
    </div>
  );
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-[28px] font-black text-gray-100 mb-2">{num}</div>
      <h4 className="text-[15px] font-bold text-[#1a1b20] mb-2">{title}</h4>
      <p className="text-[13px] text-[#5f6368] leading-relaxed">{desc}</p>
    </div>
  );
}
