import React, { useEffect, useState } from 'react';
import { HelpCircle, Grid, User, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { NotificationBell } from './NotificationBell';
import { useUi } from '../../contexts/UiContext';

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspace } = useUi();
  const [tradingBalance, setTradingBalance] = useState<string | null>(null);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const fetchBalance = () => {
    fetchApi('/accounts')
      .then((data: any) => {
        const accs = data?.accounts ?? data ?? [];
        const typeFilter = workspace === 'real' ? 'LIVE' : 'DEMO';
        const sum = accs
            .filter((a: any) => a.accountType === typeFilter)
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.equity || curr.balance || '0'), 0);
        setTradingBalance(sum.toFixed(2));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // 5s to reflect trade changes quickly
    return () => clearInterval(interval);
  }, [workspace]); // Re-fetch or recalculate when workspace changes

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const balance = tradingBalance ?? '0.00';

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or secondary nav could go here */}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-black text-[#1a1b20] tabular-nums">{balance}</span>
          <span className="text-[11px] font-bold text-[#8b8e94]">USD</span>
        </div>

        <div className="flex items-center gap-1.5 border-l border-gray-100 pl-6 h-10">
          <NavIconButton icon={<Globe className="h-[18px] w-[18px]" />} onClick={() => setShowLanguage(true)} />
          <NavIconButton icon={<HelpCircle className="h-[18px] w-[18px]" />} onClick={() => setShowHelp(true)} />
          <NotificationBell />
          <NavIconButton icon={<Grid className="h-[18px] w-[18px]" />} onClick={() => setShowApps(true)} />
          
          <button 
            onClick={() => navigate('/profile')}
            className="h-10 w-10 rounded-full flex items-center justify-center text-[#8b8e94] hover:bg-gray-50 hover:text-[#1a1b20] transition-colors ml-2 border border-transparent hover:border-gray-100"
          >
            <User className="h-[20px] w-[20px]" />
          </button>
        </div>

        {/* Modals */}
        {showLanguage && (
          <Modal title="Select Language" onClose={() => setShowLanguage(false)}>
            <div className="grid grid-cols-2 gap-2">
              {['English', 'हिन्दी', 'Tiếng Việt', 'Bahasa Indonesia', 'Español', 'Français', 'Português', 'Русский'].map(lang => (
                <button key={lang} onClick={() => setShowLanguage(false)} className="p-3 text-left hover:bg-gray-50 rounded-lg text-[13px] font-bold text-[#1a1b20]">
                  {lang}
                </button>
              ))}
            </div>
          </Modal>
        )}

        {showApps && (
          <Modal title="Our products" onClose={() => setShowApps(false)}>
            <div className="grid grid-cols-3 gap-6 p-2">
              {[
                { name: 'Terminal', icon: <Grid className="h-6 w-6 text-orange-500" />, href: '/terminal' },
                { name: 'Copy Trading', icon: <LogOut className="h-6 w-6 text-blue-500 rotate-90" />, href: '/copy-trading' },
                { name: 'Social Trading', icon: <User className="h-6 w-6 text-green-500" /> },
                { name: 'Exness Trade', icon: <Globe className="h-6 w-6 text-indigo-500" /> },
                { name: 'Investment', icon: <HelpCircle className="h-6 w-6 text-red-500" /> },
                { name: 'Partnership', icon: <Grid className="h-6 w-6 text-yellow-500" /> }
              ].map(app => (
                <div key={app.name} onClick={() => { if (app.href) navigate(app.href); setShowApps(false); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    {app.icon}
                  </div>
                  <span className="text-[11px] font-black text-[#1a1b20] text-center">{app.name}</span>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {showHelp && (
          <Modal title="Support Center" onClose={() => setShowHelp(false)}>
            <div className="space-y-4">
              <div className="p-4 bg-[#f5f0ff] rounded-xl border border-[#ede5ff] flex items-center justify-between group cursor-pointer" onClick={() => setShowHelp(false)}>
                <div>
                  <h4 className="text-[13px] font-black text-[#2d1b69]">Live Chat</h4>
                  <p className="text-[11px] text-[#5b3e9e]">Talk to our specialist right now</p>
                </div>
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ChevronRight className="h-4 w-4 text-[#5b3e9e]" />
                </div>
              </div>
              <div className="space-y-2">
                 <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-[#1a1b20]">Exness Help Center</button>
                 <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-[#1a1b20]">Legal Documents</button>
                 <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-[#1a1b20]">Trading Conditions</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </header>
  );
}

function NavIconButton({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="h-9 w-9 flex items-center justify-center text-[#8b8e94] hover:text-[#1a1b20] hover:bg-gray-50 rounded-md transition-all"
    >
      {icon}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl w-full max-w-[420px] relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[18px] font-black text-[#1a1b20]">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-[#8b8e94] hover:bg-gray-50 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);
