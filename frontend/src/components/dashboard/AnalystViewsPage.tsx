import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Filter, 
  ChevronDown, Search, ExternalLink, 
  Zap, ArrowRight, Minus, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUi } from '../../contexts/UiContext';

interface Analysis {
  id: number;
  symbol: string;
  title: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  timeframe: string;
  date: string;
  summary: string;
  pivot: string;
  preference: string;
  resistance1: string;
  resistance2: string;
  support1: string;
  support2: string;
  category: string;
}

const ANALYSES: Analysis[] = [
  { 
    id: 1, 
    symbol: 'EUR/USD', 
    title: 'EUR/USD intraday: bullish bias', 
    direction: 'bullish', 
    timeframe: '30M', 
    date: '18 Dec, 14:30', 
    summary: 'The RSI is bullish and shows that a new upward movement is beginning.',
    pivot: '1.0505',
    preference: 'Long positions above 1.0505 with targets at 1.0545 & 1.0565 in extension.',
    resistance1: '1.0545',
    resistance2: '1.0565',
    support1: '1.0485',
    support2: '1.0465',
    category: 'forex'
  },
  { 
    id: 2, 
    symbol: 'XAU/USD', 
    title: 'Gold intraday: consolidation', 
    direction: 'neutral', 
    timeframe: '1H', 
    date: '18 Dec, 12:15', 
    summary: 'Gold is currently trading in a range between 2655 and 2675.',
    pivot: '2665',
    preference: 'Wait for a breakout. Neutral between 2655 and 2675.',
    resistance1: '2685',
    resistance2: '2710',
    support1: '2640',
    support2: '2620',
    category: 'metals'
  },
  { 
    id: 3, 
    symbol: 'GBP/USD', 
    title: 'GBP/USD: downside prevail', 
    direction: 'bearish', 
    timeframe: '4H', 
    date: '18 Dec, 10:00', 
    summary: 'The pair is below its pivot and remains under pressure.',
    pivot: '1.2720',
    preference: 'Short positions below 1.2720 with targets at 1.2630 & 1.2600 in extension.',
    resistance1: '1.2750',
    resistance2: '1.2780',
    support1: '1.2630',
    support2: '1.2600',
    category: 'forex'
  },
];

export function AnalystViewsPage() {
  const { showToast } = useUi();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = activeCategory === 'all' 
    ? ANALYSES 
    : ANALYSES.filter(a => a.category === activeCategory);

  const handleTrade = (symbol: string) => {
    navigate(`/terminal?symbol=${symbol.replace('/', '')}`);
    showToast(`Opening ${symbol} in Terminal`, 'success');
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Analyst Views</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <span className="text-[11px] text-[#8b8e94] font-bold uppercase tracking-wider">Market sentiment powered by</span>
             <img src="https://media.tradingcentral.com/logo/tc_logo_main.svg" alt="Trading Central" className="h-3 opacity-60 grayscale" />
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8e94]" />
              <input 
                type="text" 
                placeholder="Search instrument..." 
                className="h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#ffce00] w-64"
              />
           </div>
        </div>
      </div>

      {/* Horizontal Category Filter */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-0">
        {['all', 'forex', 'metals', 'crypto', 'indices', 'stocks'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 pb-3 text-[13px] font-bold transition-all relative capitalize ${
              activeCategory === cat ? 'text-[#1a1b20]' : 'text-[#8b8e94] hover:text-[#1a1b20]'
            }`}
          >
            {cat}
            {activeCategory === cat && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffce00] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Analysis List */}
      <div className="space-y-4">
        {filtered.map((analysis) => (
          <Card 
            key={analysis.id} 
            className={`border-gray-100 shadow-sm cursor-pointer transition-all overflow-hidden ${expandedId === analysis.id ? 'bg-[#fafbfc] border-[#ffce00]' : 'hover:bg-gray-50'}`}
            onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[14px] font-black text-[#1a1b20] bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">{analysis.symbol}</span>
                    <DirectionBadge direction={analysis.direction} />
                    <span className="h-1 w-1 bg-gray-300 rounded-full" />
                    <span className="text-[11px] font-black text-[#8b8e94] uppercase">{analysis.timeframe}</span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1a1b20] mb-2">{analysis.title}</h3>
                  <p className="text-[13px] text-[#5f6368] line-clamp-2 leading-relaxed">{analysis.summary}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                   <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8b8e94]">
                      <Clock className="h-3.5 w-3.5" /> {analysis.date}
                   </div>
                   <ChevronDown className={`h-5 w-5 text-[#8b8e94] transition-transform ${expandedId === analysis.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedId === analysis.id && (
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <section>
                           <h4 className="text-[12px] font-black text-[#8b8e94] uppercase mb-2">Analysis Preference</h4>
                           <p className="text-[14px] text-[#1a1b20] font-bold leading-relaxed">{analysis.preference}</p>
                        </section>
                        <section>
                           <h4 className="text-[12px] font-black text-[#8b8e94] uppercase mb-2">Pivot Point</h4>
                           <div className="inline-block px-3 py-1 bg-[#141D22] text-[#ffce00] rounded font-black text-[14px] tabular-nums">
                              {analysis.pivot}
                           </div>
                        </section>
                     </div>

                     <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[13px]">
                           <thead className="bg-[#fafbfc] border-b border-gray-100">
                              <tr>
                                 <th className="px-4 py-2 font-bold text-[#8b8e94]">Technical Levels</th>
                                 <th className="px-4 py-2 text-right font-bold text-[#8b8e94]">Price</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 font-mono">
                              <tr>
                                 <td className="px-4 py-2 text-[#8b8e94]">Resistance 2</td>
                                 <td className="px-4 py-2 text-right font-bold text-[#1a1b20]">{analysis.resistance2}</td>
                              </tr>
                              <tr className="bg-blue-50/30">
                                 <td className="px-4 py-2 text-[#1c6ed4]">Resistance 1</td>
                                 <td className="px-4 py-2 text-right font-bold text-[#1c6ed4]">{analysis.resistance1}</td>
                              </tr>
                              <tr className="bg-red-50/30">
                                 <td className="px-4 py-2 text-[#f04438]">Support 1</td>
                                 <td className="px-4 py-2 text-right font-bold text-[#f04438]">{analysis.support1}</td>
                              </tr>
                              <tr>
                                 <td className="px-4 py-2 text-[#8b8e94]">Support 2</td>
                                 <td className="px-4 py-2 text-right font-bold text-[#1a1b20]">{analysis.support2}</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                     <Button 
                       onClick={() => handleTrade(analysis.symbol)}
                       className="bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black h-10 px-6 rounded-lg text-[13px]"
                     >
                        Trade Now
                     </Button>
                     <Button variant="outline" className="h-10 border-gray-200 text-[#1a1b20] font-black gap-2">
                        View Detailed Chart <ExternalLink className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Tip */}
      <div className="bg-[#fef9e7] rounded-xl p-5 border border-[#fde047]/30 flex items-start gap-4 shadow-sm">
         <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-sm">
            <Zap className="h-5 w-5 text-[#f59e0b]" />
         </div>
         <div>
            <h4 className="text-[14px] font-bold text-[#1a1b20] mb-1">Stay updated with instant signals</h4>
            <p className="text-[13px] text-[#5f6368] leading-relaxed">
              Enable notifications to receive trade alerts directly on your phone or desktop as soon as our analysts identify a new opportunity.
            </p>
         </div>
      </div>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === 'bullish') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-black text-[#22c55e] bg-[#e6f4ea] px-2 py-0.5 rounded uppercase tracking-tighter">
        <TrendingUp className="h-3 w-3" /> Bullish
      </span>
    );
  }
  if (direction === 'bearish') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-black text-[#f04438] bg-[#ffebee] px-2 py-0.5 rounded uppercase tracking-tighter">
        <TrendingDown className="h-3 w-3" /> Bearish
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-black text-[#8b8e94] bg-[#f0f1f5] px-2 py-0.5 rounded uppercase tracking-tighter">
      <Minus className="h-3 w-3" /> Neutral
    </span>
  );
}
