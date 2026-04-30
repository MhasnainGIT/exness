import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MessageSquare } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showToast } = useUi();

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] text-[#212529] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-1 flex-col transition-all duration-300 overflow-hidden min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Exness Chat Assistant Bubble */}
      <button
        onClick={() => showToast('Exness Assistant: Welcome! How can I support you today?', 'info')}
        className="fixed bottom-6 right-6 h-14 w-14 bg-[#ffce00] hover:bg-[#e6bb00] shadow-lg text-[#1a1b20] rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
      >
        <MessageSquare className="h-6 w-6" strokeWidth={2} />
      </button>
    </div>
  );
}
