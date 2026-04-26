import React from 'react';
import { useUi } from '../../contexts/UiContext';
import { Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TradingSettingsPage() {
  const { oneClickTrading, setOneClickTrading, slTpUnit, setSlTpUnit } = useUi();

  return (
    <div className="max-w-[700px] mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Trading settings</h1>

      <div className="space-y-6">
        {/* One-click trading */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-[15px] font-black text-[#1a1b20]">One-click trading</h3>
              <p className="text-[13px] text-[#5f6368] leading-relaxed max-w-[450px]">
                Allows you to open and close positions with a single click. When this mode is enabled, 
                you skip the confirmation window.
              </p>
            </div>
            <button
              onClick={() => setOneClickTrading(!oneClickTrading)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                oneClickTrading ? "bg-[#ffce00]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                oneClickTrading ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </section>

        {/* Orders execution */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[15px] font-black text-[#1a1b20]">Orders execution</h3>
            <Info className="h-4 w-4 text-[#8b8e94]" />
          </div>
          <div className="space-y-3">
             <RadioOption 
                label="Allow hedging" 
                desc="Allows you to open opposite positions on the same instrument." 
                selected={true} 
             />
             <RadioOption 
                label="New order behavior" 
                desc="Place new orders at the top of the list." 
                selected={false} 
             />
          </div>
        </section>

        {/* Stop Loss and Take Profit Unit */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-[15px] font-black text-[#1a1b20] mb-1">Stop Loss and Take Profit</h3>
            <p className="text-[13px] text-[#5f6368]">Select the preferred unit for setting SL/TP values in the terminal.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <UnitCard 
              label="Asset Price" 
              desc="Set exact price" 
              active={slTpUnit === 'PRICE'} 
              onClick={() => setSlTpUnit('PRICE')}
            />
            <UnitCard 
              label="Pips" 
              desc="Set distance in pips" 
              active={slTpUnit === 'PIPS'} 
              onClick={() => setSlTpUnit('PIPS')}
            />
            <UnitCard 
              label="Currency (USD)" 
              desc="Set in profit/loss amount" 
              active={slTpUnit === 'USD'} 
              onClick={() => setSlTpUnit('USD')}
            />
          </div>
        </section>
      </div>

      <div className="bg-[#fef9e7] border border-[#fde047]/20 rounded-xl p-4 flex items-start gap-4">
         <Info className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
         <p className="text-[13px] text-[#5f6368] leading-normal">
           These settings are applied globally across all your trading accounts. 
           Be careful when enabling **One-click trading** as orders will be executed instantly.
         </p>
      </div>
    </div>
  );
}

function RadioOption({ label, desc, selected }: { label: string; desc: string; selected: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
      <div className={cn(
        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
        selected ? "border-[#ffce00] bg-[#ffce00]" : "border-gray-200"
      )}>
        {selected && <Check className="h-3 w-3 text-white font-black" />}
      </div>
      <div>
        <div className="text-[13px] font-bold text-[#1a1b20]">{label}</div>
        <div className="text-[12px] text-[#8b8e94]">{desc}</div>
      </div>
    </div>
  );
}

function UnitCard({ label, desc, active, onClick }: { label: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1",
        active ? "border-[#ffce00] bg-[#ffce00]/5" : "border-gray-100 bg-white hover:border-gray-200"
      )}
    >
      <span className="text-[13px] font-black text-[#1a1b20]">{label}</span>
      <span className="text-[11px] text-[#5f6368]">{desc}</span>
    </div>
  );
}
