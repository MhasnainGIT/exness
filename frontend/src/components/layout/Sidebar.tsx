import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal, Wallet, Users, Award, FileBox, ExternalLink,
  ChevronUp, ChevronDown, Copy, Heart, Settings, Layout, BookOpen, ChevronsLeft,
  PieChart, History, Globe, LineChart, Newspaper, Calendar, ShieldCheck, HelpCircle
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
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  children?: NavChild[];
  href?: string;
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
    icon: PieChart,
    children: [
      { title: 'Analyst Views', href: '/analyst-views' },
      { title: 'Market News', href: '/market-news' },
      { title: 'Economic Calendar', href: '/economic-calendar' },
    ],
  },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useUi();

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    Trading: true,
    'Payments & wallet': false,
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
        'h-full bg-white border-r border-[#E9ECEF] transition-all duration-300 flex flex-col z-[100] select-none',
        isOpen ? 'w-[240px]' : 'w-0 overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="px-5 h-[64px] flex items-center flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#FFD700] rounded flex items-center justify-center font-bold text-[10px]">ex</div>
          <span className="text-xl font-bold tracking-tight text-black">exness</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {navItems.map((section) => {
          const isExpanded = expanded[section.title] ?? false;
          return (
            <div key={section.title} className="mb-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-[#212529] hover:bg-[#F8F9FA] transition-all"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="h-[18px] w-[18px] text-[#848e9c]" />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-[#848e9c]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[#848e9c]" />
                )}
              </button>

              {isExpanded && section.children && (
                <div className="mt-1 space-y-0.5">
                  {section.children.map((child) => {
                    const active = isActivePath(child.href);
                    return (
                      <Link
                        key={child.title}
                        to={child.href}
                        target={child.external ? '_blank' : undefined}
                        className={cn(
                          'flex items-center justify-between pl-10 pr-3 py-2 rounded-lg text-[13px] transition-all',
                          active
                            ? 'bg-[#F1F3F5] text-black font-semibold'
                            : 'text-[#5f6368] hover:bg-[#F8F9FA] hover:text-black'
                        )}
                      >
                        <span>{child.title}</span>
                        {child.external && (
                          <ExternalLink className="h-3 w-3 text-[#848e9c]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <Link
          to="/copy-trading"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-[#212529] hover:bg-[#F8F9FA] transition-all"
        >
          <PieChart className="h-[18px] w-[18px] text-[#848e9c]" />
          <span>Copy Trading</span>
        </Link>
      </div>

      {/* Refer traders banner */}
      <div className="px-3 pb-4 mt-auto">
        <div className="p-4 rounded-xl bg-[#F3F0FF] border border-[#E9E4FF] flex gap-3 items-center cursor-pointer hover:bg-[#EBE5FF] transition-all">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Users className="h-5 w-5 text-[#6D28D9]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-semibold text-[#4C1D95]">Refer traders, earn</span>
            <span className="text-[12px] font-semibold text-[#4C1D95]">commission</span>
          </div>
        </div>
      </div>

      <div
        className="h-12 flex items-center justify-center border-t border-[#E9ECEF] hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronsLeft className={cn("h-5 w-5 text-[#848e9c] transition-transform", !isOpen && "rotate-180")} />
      </div>
    </aside>
  );
}
