import React, { useState } from 'react';
import { 
  Clock, TrendingUp, TrendingDown, ExternalLink, 
  Search, Filter, ChevronDown, Share2, 
  Bookmark, MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUi } from '../../contexts/UiContext';

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  summary: string;
}

const NEWS: NewsItem[] = [
  { 
    id: 1, 
    title: 'Federal Reserve Holds Interest Rates Steady at 5.25-5.50%', 
    source: 'FXStreet', 
    time: '45m ago', 
    category: 'Central Banks', 
    impact: 'high', 
    summary: 'The Federal Reserve maintained its benchmark interest rate, signaling potential cuts in early 2025 pending inflation data.' 
  },
  { 
    id: 2, 
    title: 'EUR/USD Rises After ECB Rate Decision; Eyes 1.0600', 
    source: 'FXStreet', 
    time: '2h ago', 
    category: 'Forex', 
    impact: 'high', 
    summary: 'The Euro gained against the Dollar following ECB President Lagarde comments on cautious rate adjustments.' 
  },
  { 
    id: 3, 
    title: 'Gold steady as traders weigh Middle East geopolitical risk', 
    source: 'FXStreet', 
    time: '3h ago', 
    category: 'Commodities', 
    impact: 'medium', 
    summary: 'Gold remains elevated as investors seek safe havens amid ongoing geopolitical uncertainties.' 
  },
  { 
    id: 4, 
    title: 'GBP/USD retreats from 1.2800 on fresh BoE commentary', 
    source: 'FXStreet', 
    time: '5h ago', 
    category: 'Forex', 
    impact: 'medium', 
    summary: 'Consumer prices in the UK dropped more than expected, fueling expectations of Bank of England rate cuts.' 
  },
];

export function MarketNewsPage() {
  const { showToast } = useUi();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNews = activeCategory === 'all' 
    ? NEWS 
    : NEWS.filter(n => n.category.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">FX News</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <span className="text-[11px] text-[#8b8e94] font-bold uppercase tracking-wider">Financial news powered by</span>
             <span className="text-[11px] text-[#1c6ed4] font-black tracking-tighter italic">FXSTREET</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8e94]" />
              <input 
                type="text" 
                placeholder="Search news..." 
                className="h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#ffce00] w-64 shadow-sm"
              />
           </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-0">
        {['all', 'forex', 'commodities', 'crypto', 'economics', 'central banks'].map((cat) => (
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

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <Card 
            key={news.id} 
            className="border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all group overflow-hidden"
            onClick={() => showToast('Full article opening...', 'info')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      news.impact === 'high' ? 'bg-[#f04438]' : news.impact === 'medium' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                    }`} />
                    <span className="text-[11px] font-black text-[#8b8e94] uppercase tracking-wider">{news.category}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] font-bold text-[#8b8e94] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {news.time}
                    </span>
                  </div>
                  
                  <h3 className="text-[18px] font-bold text-[#1a1b20] leading-tight group-hover:text-[#1c6ed4] transition-colors">
                    {news.title}
                  </h3>
                  
                  <p className="text-[14px] text-[#5f6368] leading-relaxed line-clamp-2">
                    {news.summary}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] font-bold text-[#8b8e94]">Source: {news.source}</span>
                    <div className="flex items-center gap-4">
                       <button className="text-[#8b8e94] hover:text-[#1a1b20] transition-colors">
                          <Bookmark className="h-4 w-4" />
                       </button>
                       <button className="text-[#8b8e94] hover:text-[#1a1b20] transition-colors">
                          <Share2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                </div>
                
                {/* News Thumbnail Placeholder */}
                <div className="h-24 w-32 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0 group-hover:bg-gray-100 transition-colors overflow-hidden">
                   <div className="text-[32px] font-black text-gray-100 select-none">FX</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <button className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-[#1a1b20] font-bold text-[13px] rounded-lg transition-colors">
        Load more news
      </button>
    </div>
  );
}
