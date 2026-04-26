import React, { useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, 
  Bitcoin, Globe, ShieldCheck, Copy, 
  ExternalLink, Info, Plus, ChevronRight,
  TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUi } from '../../contexts/UiContext';
import { Button } from '@/components/ui/button';
import { fetchApi } from '../../lib/api';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: React.ReactNode;
  iconBg: string;
  balance: string;
  usdValue: string;
  change: string;
  trend: 'up' | 'down';
}

const ASSETS: Asset[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: <Bitcoin className="h-5 w-5" />, iconBg: 'bg-[#ff9500]', balance: '0.00000000', usdValue: '0.00', change: '+2.4%', trend: 'up' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: <EthIcon />, iconBg: 'bg-[#627eea]', balance: '0.00000000', usdValue: '0.00', change: '-1.2%', trend: 'down' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: <UsdtIcon />, iconBg: 'bg-[#26a17b]', balance: '0.00', usdValue: '0.00', change: '+0.01%', trend: 'up' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: <span className="font-black text-white">$</span>, iconBg: 'bg-[#2775ca]', balance: '0.00', usdValue: '0.00', change: '0.0%', trend: 'up' },
];

export function CryptoWalletPage() {
  const { showToast, openWalletModal, openInternalTransferModal } = useUi();
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    fetchApi('/wallets')
      .then((data: any) => setWallet(data?.wallet ?? data))
      .catch(console.error);
  }, []);

  const balance = wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00';
  
  const dynamicAssets = ASSETS.map(a => {
    if (a.id === 'usdt' || a.id === 'usdc') {
      return { ...a, balance: balance, usdValue: balance };
    }
    return a;
  });

  const [activeAsset, setActiveAsset] = useState<Asset>(dynamicAssets[0]);

  // Sync active asset when balance updates
  useEffect(() => {
    if (activeAsset.id === 'usdt' || activeAsset.id === 'usdc') {
      setActiveAsset(prev => ({ ...prev, balance: balance, usdValue: balance }));
    }
  }, [balance]);

  return (
    <div className="space-y-8 max-w-[1100px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-[#1a1b20] tracking-tight">Crypto wallet</h1>
          <p className="text-[14px] text-[#5f6368] mt-1">Manage your digital assets and internal transfers</p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={() => openWalletModal('deposit')} className="bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-black h-10 px-6 rounded-lg text-[13px] shadow-sm">
             <Plus className="h-4 w-4 mr-2" /> Buy Crypto
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Assets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-[14px] font-bold text-[#1a1b20] uppercase tracking-wider">Balances</h2>
             <button className="text-[#8b8e94] hover:text-[#1a1b20] transition-colors">
                <RefreshCw className="h-4 w-4" />
             </button>
          </div>
          <div className="space-y-2">
            {dynamicAssets.map((asset) => (
              <Card 
                key={asset.id} 
                className={`border-gray-100 cursor-pointer transition-all ${activeAsset.id === asset.id ? 'bg-[#fafbfc] border-[#ffce00] shadow-sm' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveAsset(asset)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${asset.iconBg} rounded-full flex items-center justify-center text-white shadow-sm`}>
                      {asset.icon}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#1a1b20]">{asset.name}</h3>
                      <p className="text-[11px] text-[#8b8e94] font-bold">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-[#1a1b20]">{asset.balance}</p>
                    <p className={`text-[11px] font-bold flex items-center justify-end gap-1 ${asset.trend === 'up' ? 'text-[#22c55e]' : 'text-[#f04438]'}`}>
                      {asset.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {asset.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <button className="w-full h-12 border border-dashed border-gray-200 rounded-lg text-[13px] text-[#8b8e94] font-medium hover:bg-gray-50 transition-colors">
             + Add more assets
          </button>
        </div>

        {/* Right Column: Asset Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="bg-[#141D22] p-8 text-white relative">
                 <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 ${activeAsset.iconBg} rounded-full flex items-center justify-center shadow-lg border-2 border-white/10`}>
                       {activeAsset.icon}
                    </div>
                    <div>
                       <h2 className="text-[20px] font-black">{activeAsset.name} Wallet</h2>
                       <p className="text-[#8b8e94] text-[13px]">Standard network address</p>
                    </div>
                 </div>
                 
                 <div className="mt-8 flex items-baseline gap-2">
                    <span className="text-[36px] font-black tracking-tighter leading-none">{activeAsset.balance}</span>
                    <span className="text-[14px] text-[#8b8e94] font-bold uppercase">{activeAsset.symbol}</span>
                 </div>
                 <p className="text-[#8b8e94] text-[15px] font-medium mt-1">≈ {activeAsset.usdValue} USD</p>

                 <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                    <button className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
                       <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                    </button>
                 </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => openWalletModal('deposit')} variant="outline" className="h-12 border-gray-200 text-[#1a1b20] font-black gap-2 transition-all active:scale-[0.98]">
                    <ArrowDownLeft className="h-4 w-4 text-[#22c55e]" /> Receive
                  </Button>
                  <Button onClick={() => openWalletModal('withdraw')} variant="outline" className="h-12 border-gray-200 text-[#1a1b20] font-black gap-2 transition-all active:scale-[0.98]">
                    <ArrowUpRight className="h-4 w-4 text-[#f04438]" /> Send
                  </Button>
                </div>

                <div onClick={() => openInternalTransferModal()} className="mt-8 p-4 bg-[#f4f5f7] rounded-xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Wallet className="h-4 w-4 text-[#1a1b20]" />
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-[#1a1b20]">Internal Transfer</p>
                        <p className="text-[11px] text-[#8b8e94]">Transfer to your trading accounts</p>
                     </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8b8e94] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Section */}
          <section className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h2 className="text-[14px] font-bold text-[#1a1b20] uppercase tracking-wider">Recent Activity</h2>
                <button className="text-[#1c6ed4] text-[13px] font-bold hover:underline">View all</button>
             </div>
             <Card className="border-gray-100 border-dashed bg-gray-50 flex items-center justify-center p-12">
                <div className="text-center">
                   <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm text-[#8b8e94]">
                      <Info className="h-6 w-6" />
                   </div>
                   <p className="text-[13px] text-[#1a1b20] font-bold">No transactions yet</p>
                   <p className="text-[12px] text-[#8b8e94] mt-1">Your {activeAsset.name} activity will appear here</p>
                </div>
             </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

function UsdtIcon() {
  return (
    <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
       <span className="text-[#26a17b] text-[10px] font-black">₮</span>
    </div>
  );
}

function EthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 417" fill="white">
      <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" opacity="0.6"/><path d="M127.962 0L0 212.32l127.962 75.638V127.961z"/><path d="M127.962 312.187l-1.575 1.92v98.199l1.575 4.634 128.038-180.32z" opacity="0.6"/><path d="M127.962 416.94V312.187L0 236.62z"/><path d="M127.961 287.958l127.96-75.637-127.96-58.162z" opacity="0.4"/><path d="M0 212.32l127.962 75.638v-133.8z" opacity="0.4"/>
    </svg>
  );
}
