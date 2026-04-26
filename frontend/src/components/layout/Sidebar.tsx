import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal, Wallet, Users, Award, FileBox, ExternalLink,
  ChevronUp, ChevronDown, Copy, Heart, Settings, Layout, BookOpen, ChevronsLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface NavChild {
  title: string;
  href: string;
  external?: boolean;
  modal?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  children?: NavChild[];
  href?: string;
  badge?: string;
}

const navItems: NavSection[] = [
  {
    title: 'Trading',
    icon: SlidersHorizontal,
    children: [
      { title: 'My accounts', href: '/' },
      { title: 'Performance', href: '/performance' },
      { title: 'History of orders', href: '/history-of-orders' },
      { title: 'Exness Terminal', href: '/terminal', external: true },
    ],
  },
  {
    title: 'Payments & wallet',
    icon: Wallet,
    children: [
      { title: 'Deposit', href: '/deposit' },
      { title: 'Withdrawal', href: '/withdrawal' },
      { title: 'Transaction history', href: '/transaction-history' },
      { title: 'Crypto wallet', href: '/crypto-wallet' },
    ],
  },
  {
    title: 'Analytics',
    icon: BookOpen,
    children: [
      { title: 'Analyst Views', href: '/analyst-views' },
      { title: 'Market News', href: '/market-news' },
      { title: 'Economic Calendar', href: '/economic-calendar', external: true },
    ],
  },
  {
    title: 'Exness benefits',
    icon: Award,
    children: [
      { title: 'Trading Conditions', href: '/trading-conditions' },
      { title: 'Savings', href: '/savings' },
      { title: 'Virtual Private Server', href: '/vps' },
    ],
  },
  {
    title: 'Copy Trading',
    icon: Layout,
    href: '/copy-trading'
  },
  {
    title: 'Support hub',
    icon: Heart,
    href: '/support',
    badge: 'New'
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'Profile', href: '/profile' },
      { title: 'Security', href: '/security' },
      { title: 'Trading Terminal', href: '/terminal', external: true },
    ],
  },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useUi();

  // Track which sections are expanded - Default all to true for clarity as in Exness
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    Trading: true,
    'Payments & wallet': true,
    'Analytics': false
  });

  const toggleSection = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActivePath = (href: string) => {
    if (href === '/') return location.pathname === '/' || location.pathname === '/accounts';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'h-full bg-white border-r border-gray-100 transition-all duration-300 flex flex-col z-[100] select-none group',
        isOpen ? 'w-[230px]' : 'w-0 overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="px-5 h-[64px] flex items-center flex-shrink-0">
        <Link to="/" className="text-[24px] font-black tracking-tighter text-[#1a1b20] lowercase leading-none flex items-baseline gap-0.5">
          exness <span className="h-2 w-2 bg-[#ffce00] rounded-full" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        {navItems.map((section) => {
          if (!section.children) {
            const active = isActivePath(section.href || '');
            return (
              <div key={section.title} className="mb-0.5">
                <button
                  onClick={() => {
                    if (section.href) navigate(section.href);
                    else showToast(`${section.title} coming soon`, 'info');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all",
                    active ? "bg-[#f5f0ff] text-[#2d1b69]" : "text-[#5f6368] hover:bg-[#f7f8fa] hover:text-[#1a1b20]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className={cn("h-[18px] w-[18px] stroke-[1.8] flex-shrink-0", active ? "text-[#5b3e9e]" : "text-[#8b8e94]")} />
                    <span>{section.title}</span>
                  </div>
                  {section.badge && (
                    <span className="bg-[#e8f0fe] text-[#1c6ed4] text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {section.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          const isExpanded = expanded[section.title] ?? false;
          return (
            <div key={section.title} className="mb-0.5">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-[#5f6368] hover:bg-[#f7f8fa] hover:text-[#1a1b20] transition-all"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="h-[18px] w-[18px] text-[#8b8e94] stroke-[1.8] flex-shrink-0" />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-[#8b8e94]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[#8b8e94]" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-2 mt-0.5 space-y-0.5">
                  {section.children.map((child) => {
                    const active = isActivePath(child.href);
                    return (
                      <Link
                        key={child.title}
                        to={child.href}
                        target={child.external ? '_blank' : undefined}
                        className={cn(
                          'flex items-center justify-between pl-10 pr-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                          active
                            ? 'bg-[#f0f3f7] text-[#1a1b20] font-bold'
                            : 'text-[#5f6368] hover:bg-[#f7f8fa] hover:text-[#1a1b20]'
                        )}
                      >
                        <span>{child.title}</span>
                        {child.external && (
                          <ExternalLink className="h-3 w-3 text-[#8b8e94]" strokeWidth={1.5} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refer traders banner */}
      <div className="px-3 pb-3 flex-shrink-0 mt-auto">
        <div
          onClick={() => showToast('Referral program opening...', 'info')}
          className="p-4 rounded-xl bg-[#f5f0ff] border border-[#ede5ff] flex gap-3 items-center cursor-pointer hover:bg-[#efe8ff] transition-all group/banner"
        >
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Users className="h-5 w-5 text-[#5b3e9e]" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-black text-[#2d1b69] tracking-tight">Refer traders, earn</span>
            <span className="text-[12px] font-black text-[#2d1b69] tracking-tight">commission</span>
          </div>
        </div>
      </div>

      <div
        className="h-14 flex items-center justify-center border-t border-gray-50 hover:bg-gray-50 cursor-pointer flex-shrink-0 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronsLeft className={cn("h-5 w-5 text-[#8b8e94] transition-transform", !isOpen && "rotate-180")} />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </aside>
  );
}
