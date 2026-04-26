import React from 'react';
import { Clock, TrendingUp, ExternalLink, Search } from 'lucide-react';
import { motion } from 'motion/react';

const MOCK_NEWS = [
  { id: 1, title: 'EUR/USD eyes 1.0800 as ECB signals caution', time: '12m ago', category: 'Forex' },
  { id: 2, title: 'Gold hits new highs amid geopolitical tension', time: '28m ago', category: 'Commodities' },
  { id: 3, title: 'BTCUSD breaks $76k, eyes structural targets', time: '45m ago', category: 'Crypto' },
  { id: 4, title: 'Oil prices steady as supply concerns ease', time: '1h ago', category: 'Energy' },
  { id: 5, title: 'USDJPY volatility spikes on BoJ commentary', time: '2h ago', category: 'Forex' },
];

export function NewsSidebar({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col h-full bg-[#16181d]"
    >
      <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
        <span className="text-[10px] tracking-widest font-black text-[#848e9c] uppercase">Market News</span>
        <div className="flex items-center gap-1.5 grayscale opacity-60">
           <span className="text-[9px] font-bold text-[#1e75e4] italic">FXSTREET</span>
        </div>
      </div>
      
      <div className="p-3">
        <div className="bg-[#0c0d10] border border-[#2b2f36] rounded px-3 py-1.5 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-[#5f6368]" />
          <input type="text" placeholder="Search news" className="bg-transparent border-none text-[12px] text-white outline-none w-full placeholder:text-[#5f6368]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {MOCK_NEWS.map(news => (
          <div key={news.id} className="p-3 border-b border-[#2b2f36]/30 hover:bg-white/5 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black text-[#5f6368] uppercase tracking-wider">{news.category}</span>
              <span className="text-[9px] text-[#5f6368]">•</span>
              <span className="text-[9px] text-[#5f6368] flex items-center gap-1 uppercase font-bold"><Clock className="h-2.5 w-2.5" /> {news.time}</span>
            </div>
            <h4 className="text-[12px] font-bold text-[#d1d4dc] leading-snug group-hover:text-white transition-colors">
              {news.title}
            </h4>
          </div>
        ))}
        
        <div className="p-4 flex justify-center">
           <button className="text-[10px] font-black text-[#ffce00] uppercase tracking-widest hover:underline flex items-center gap-1">
             View All News <ExternalLink className="h-3 w-3" />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
