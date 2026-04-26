import React from 'react';
import { 
  Server, Check, Zap, Globe, Shield, 
  ArrowRight, CheckCircle2, Cpu, HardDrive, 
  Settings, Info, Lock
} from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VPS_PLANS = [
  { 
    name: 'Standard', 
    ram: '1 GB', 
    cpu: '1 vCPU', 
    storage: '25 GB SSD', 
    price: 'Free', 
    condition: 'Min $500 total equity', 
    popular: false,
    color: 'border-b-[#1c6ed4]'
  },
  { 
    name: 'Advanced', 
    ram: '2 GB', 
    cpu: '2 vCPU', 
    storage: '50 GB SSD', 
    price: 'Free', 
    condition: 'Min $1,000 total equity', 
    popular: true,
    color: 'border-b-[#ffce00]'
  },
  { 
    name: 'Premium', 
    ram: '4 GB', 
    cpu: '4 vCPU', 
    storage: '100 GB SSD', 
    price: 'Free', 
    condition: 'Min $3,000 total equity', 
    popular: false,
    color: 'border-b-[#22c55e]'
  },
];

export function VPSPage() {
  const { showToast } = useUi();

  return (
    <div className="space-y-8 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Virtual Private Server</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Host your trading terminal on a secure and stable server</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-bold text-[#1c6ed4] hover:underline">
           VPS Guidelines
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#141D22] rounded-xl p-8 text-white relative overflow-hidden shadow-lg border border-white/5">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
             <span className="bg-[#ffce00] text-[#1a1b20] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Premium Service</span>
          </div>
          <h2 className="text-[32px] font-black mb-4 leading-tight">Trade 24/7 without terminal downtime</h2>
          <p className="text-[#8b8e94] text-[15px] leading-relaxed mb-8">
            Our VPS service is designed specifically for automated trading. Get ultra-low latency to Exness trade servers, pre-installed MT4/MT5, and enterprise-grade reliability for your Expert Advisors.
          </p>
          <div className="flex flex-wrap gap-4">
             <LinkStat icon={<Zap className="h-4 w-4 text-[#ffce00]" />} label="<1ms latency" />
             <LinkStat icon={<Globe className="h-4 w-4 text-[#22c55e]" />} label="London & Amsterdam data centers" />
             <LinkStat icon={<Shield className="h-4 w-4 text-[#1c6ed4]" />} label="Encrypted connection" />
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] opacity-10 blur-2xl flex items-center justify-center">
           <Server className="h-80 w-80 text-white" />
        </div>
      </div>

      {/* Plans Section */}
      <section className="space-y-6">
        <h3 className="text-[16px] font-bold text-[#1a1b20]">Choose your VPS plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VPS_PLANS.map((plan) => (
            <Card 
              key={plan.name} 
              className={`border-gray-100 shadow-sm relative overflow-hidden flex flex-col pt-1 border-t-0 border-r-0 border-l-0 border-b-4 ${plan.color} ${plan.popular ? 'bg-[#fafbfc] ring-1 ring-[#ffce00]/20' : 'bg-white'}`}
            >
              <CardContent className="p-8 flex-1 flex flex-col">
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-[#ffce00] text-[#1a1b20] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                    Most Popular
                  </div>
                )}
                <h4 className="text-[20px] font-black text-[#1a1b20] mb-6">{plan.name}</h4>
                
                <div className="space-y-4 mb-8 flex-1">
                  <SpecRow icon={<Cpu className="h-4 w-4" />} label="CPU" value={plan.cpu} />
                  <SpecRow icon={<Settings className="h-4 w-4" />} label="RAM" value={plan.ram} />
                  <SpecRow icon={<HardDrive className="h-4 w-4" />} label="Storage" value={plan.storage} />
                  <div className="pt-4 border-t border-gray-100 mt-4">
                     <span className="text-[12px] font-black text-[#8b8e94] uppercase block mb-1">Price</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-black text-[#22c55e]">{plan.price}</span>
                        <span className="text-[12px] text-[#8b8e94] font-bold">/ Month*</span>
                     </div>
                     <p className="text-[11px] text-[#8b8e94] mt-1 italic">{plan.condition}</p>
                  </div>
                </div>

                <Button 
                  onClick={() => showToast(`${plan.name} VPS requested`, 'info')}
                  className={`w-full h-11 font-black text-[13px] rounded-lg transition-all active:scale-95 ${plan.popular ? 'bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] shadow-md' : 'bg-white border border-gray-200 text-[#1a1b20] hover:bg-gray-50'}`}
                >
                  Activate Now <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Requirements info */}
      <div className="bg-[#fef9e7] border border-[#fde047]/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
         <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm flex-shrink-0">
               <Info className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
               <h4 className="text-[14px] font-bold text-[#1a1b20] mb-1">Verify your profile to qualify</h4>
               <p className="text-[13px] text-[#5f6368] leading-relaxed max-w-xl">
                 VPS hosting is available for verified accounts. The service remains free as long as you maintain the minimum required equity in your trading accounts.
               </p>
            </div>
         </div>
         <Button variant="outline" className="border-gray-200 bg-white hover:bg-gray-50 font-bold h-10 px-6 rounded-lg text-[13px] whitespace-nowrap">
            View Eligibility
         </Button>
      </div>
    </div>
  );
}

function LinkStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-default">
       {icon}
       <span className="text-[13px] font-bold text-[#e2e4e7]">{label}</span>
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-2 text-[#5f6368]">
          {icon}
          <span className="text-[13px] font-medium">{label}</span>
       </div>
       <span className="text-[13px] font-black text-[#1a1b20]">{value}</span>
    </div>
  );
}
