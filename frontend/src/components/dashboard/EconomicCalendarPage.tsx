import React, { useState } from 'react';
import { 
  Calendar, Clock, ChevronDown, Filter, 
  TrendingUp, TrendingDown, Minus, Info,
  Globe, Search, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUi } from '../../contexts/UiContext';

interface EconomicEvent {
  id: number;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous: string;
  forecast: string;
  actual: string;
}

const EVENTS: EconomicEvent[] = [
  { id: 1, time: '14:30', country: 'US', flag: '🇺🇸', event: 'Initial Jobless Claims', impact: 'high', previous: '242K', forecast: '230K', actual: '225K' },
  { id: 2, time: '14:30', country: 'US', flag: '🇺🇸', event: 'GDP Price Index (Q4)', impact: 'medium', previous: '1.7%', forecast: '1.9%', actual: '1.9%' },
  { id: 3, time: '16:00', country: 'EU', flag: '🇪🇺', event: 'Consumer Confidence (Dec)', impact: 'medium', previous: '-15.1', forecast: '-14.3', actual: '' },
  { id: 4, time: '01:30', country: 'AU', flag: '🇦🇺', event: 'Employment Change', impact: 'high', previous: '55.2K', forecast: '25.0K', actual: '35.6K' },
];

export function EconomicCalendarPage() {
  const { showToast } = useUi();
  const [activeDate, setActiveDate] = useState('Today');
  const [impactFilter, setImpactFilter] = useState('all');
  const [showTimezone, setShowTimezone] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Economic Calendar</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Global financial events and economic indicators</p>
        </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTimezone(true)}
              className="flex items-center gap-2 px-3 h-10 border border-gray-200 rounded-lg text-[13px] text-[#1a1b20] font-bold bg-white hover:bg-gray-50"
            >
               <Globe className="h-4 w-4 text-[#8b8e94]" /> (GMT +00:00)
            </button>
         </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-0 overflow-x-auto no-scrollbar">
        {['Yesterday', 'Today', 'Tomorrow', 'This Week', 'Next Week'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveDate(tab)}
            className={`px-4 pb-3 text-[13px] font-bold transition-all relative whitespace-nowrap ${
              activeDate === tab ? 'text-[#1a1b20]' : 'text-[#8b8e94] hover:text-[#1a1b20]'
            }`}
          >
            {tab}
            {activeDate === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffce00] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#8b8e94] uppercase tracking-wider">Impact</span>
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg">
                <ImpactBtn label="High" active={impactFilter === 'high'} onClick={() => setImpactFilter('high')} color="bg-[#f04438]" />
                <ImpactBtn label="Med" active={impactFilter === 'medium'} onClick={() => setImpactFilter('medium')} color="bg-[#f59e0b]" />
                <ImpactBtn label="Low" active={impactFilter === 'low'} onClick={() => setImpactFilter('low')} color="bg-[#22c55e]" />
                <button 
                  onClick={() => setImpactFilter('all')}
                  className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-tighter transition-all ${impactFilter === 'all' ? 'bg-[#141D22] text-white shadow-md' : 'text-[#8b8e94] hover:text-[#1a1b20]'}`}
                >
                  All
                </button>
              </div>
           </div>
           
           <div className="h-6 w-px bg-gray-100" />
           
           <button 
              onClick={() => setShowCountries(true)}
              className="flex items-center gap-2 text-[13px] font-bold text-[#1a1b20] hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
               <Filter className="h-3.5 w-3.5 text-[#8b8e94]" /> Countries
               <ChevronDown className="h-3.5 w-3.5 text-[#8b8e94]" />
            </button>
        </div>
        
        <button className="flex items-center gap-2 text-[13px] font-bold text-[#1c6ed4] hover:underline">
           <RefreshCw className="h-3.5 w-3.5" /> Auto-refresh
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
           <thead className="bg-[#fafbfc] border-b border-gray-100 font-bold text-[#8b8e94]">
             <tr>
               <th className="px-6 py-4 w-[100px]">Time</th>
               <th className="px-3 py-4 w-[60px]">Country</th>
               <th className="px-3 py-4 w-[80px]">Impact</th>
               <th className="px-3 py-4">Event</th>
               <th className="px-3 py-4 text-right">Actual</th>
               <th className="px-3 py-4 text-right">Forecast</th>
               <th className="px-6 py-4 text-right">Previous</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {EVENTS.map((event) => (
               <tr key={event.id} className="hover:bg-[#fafbfc] transition-colors cursor-pointer group">
                 <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 font-bold text-[#1a1b20]">
                       <Clock className="h-3.5 w-3.5 text-[#8b8e94]" /> {event.time}
                    </div>
                 </td>
                 <td className="px-3 py-5 text-[20px]">{event.flag}</td>
                 <td className="px-3 py-5">
                    <div className="flex gap-0.5">
                       {[1, 2, 3].map((dot) => (
                         <span 
                           key={dot}
                           className={`h-1.5 w-1.5 rounded-full ${
                             event.impact === 'high' ? 'bg-[#f04438]' :
                             event.impact === 'medium' && dot <= 2 ? 'bg-[#f59e0b]' :
                             event.impact === 'low' && dot <= 1 ? 'bg-[#22c55e]' :
                             'bg-gray-100'
                           }`}
                         />
                       ))}
                    </div>
                 </td>
                 <td className="px-3 py-5 font-bold text-[#1a1b20] group-hover:text-[#1c6ed4] transition-colors">
                    {event.event}
                 </td>
                 <td className={`px-3 py-5 text-right font-black tabular-nums transition-colors ${event.actual ? (parseFloat(event.actual) > parseFloat(event.forecast) ? 'text-[#22c55e]' : 'text-[#f04438]') : 'text-[#8b8e94]'}`}>
                    {event.actual || '-'}
                 </td>
                 <td className="px-3 py-5 text-right text-[#5f6368] font-medium tabular-nums">{event.forecast}</td>
                 <td className="px-6 py-5 text-right text-[#8b8e94] font-medium tabular-nums">{event.previous}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* Helpful Hint */}
      <div className="bg-[#f0f4ff] border border-[#dbeafe] rounded-xl p-5 flex items-start gap-4 shadow-sm">
         <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
            <Info className="h-5 w-5 text-[#1c6ed4]" />
         </div>
         <div>
            <h4 className="text-[14px] font-bold text-[#1a1b20] mb-1">Impact on currency pairs</h4>
            <p className="text-[13px] text-[#5f6368] leading-relaxed">
              Events with <span className="text-[#f04438] font-bold">high impact</span> (3 red dots) usually result in large price movements in associated currency pairs. For example, US non-farm payrolls can significantly affect all USD pairs.
            </p>
         </div>
      </div>

      {/* Modals */}
      {showTimezone && (
        <Modal title="Select Timezone" onClose={() => setShowTimezone(false)}>
           <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {['GMT -12:00', 'GMT -11:00', 'GMT -05:00 (EST)', 'GMT +00:00 (UTC)', 'GMT +01:00 (London)', 'GMT +05:30 (Mumbai)', 'GMT +08:00 (Singapore)', 'GMT +09:00 (Tokyo)'].map(tz => (
                <button key={tz} onClick={() => setShowTimezone(false)} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-[#1a1b20]">
                   {tz}
                </button>
              ))}
           </div>
        </Modal>
      )}

      {showCountries && (
        <Modal title="Filter by Country" onClose={() => setShowCountries(false)}>
           <div className="grid grid-cols-2 gap-4">
              {['United States', 'Eurozone', 'United Kingdom', 'Australia', 'Japan', 'Canada', 'Switzerland', 'New Zealand'].map(c => (
                <label key={c} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border border-transparent cursor-pointer transition-all">
                   <div className="w-5 h-5 border-2 border-gray-200 rounded flex items-center justify-center bg-white group-hover:border-[#ffce00]">
                      <div className="h-2 w-2 bg-[#ffce00] rounded-sm" />
                   </div>
                   <span className="text-[13px] font-bold text-[#1a1b20]">{c}</span>
                </label>
              ))}
           </div>
           <Button onClick={() => setShowCountries(false)} className="w-full bg-[#1a1b20] hover:bg-black text-white h-11 rounded-lg font-bold text-[13px] mt-6">Apply Filters</Button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[24px] w-full max-w-[420px] relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-[16px] font-black text-[#1a1b20]">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-[#8b8e94] hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-xl">×</span>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ImpactBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-tighter flex items-center gap-1.5 transition-all ${
        active ? 'bg-[#141D22] text-white shadow-md' : 'text-[#8b8e94] hover:text-[#1a1b20]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </button>
  );
}
