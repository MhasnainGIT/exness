import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WalletModal } from '../components/modals/WalletModal';
import { TradeSettingsModal } from '../components/modals/TradeSettingsModal';
import { InternalTransferModal } from '../components/modals/InternalTransferModal';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface UiContextType {
  // Toasts
  showToast: (message: string, type?: ToastType) => void;
  // Modals
  openWalletModal: (defaultTab?: 'deposit' | 'withdraw') => void;
  closeWalletModal: () => void;
  openTradeSettingsModal: (params: { positionId: string; sl: string; tp: string }) => void;
  closeTradeSettingsModal: () => void;
  // Trading Settings
  oneClickTrading: boolean;
  setOneClickTrading: (val: boolean) => void;
  slTpUnit: 'PRICE' | 'PIPS' | 'USD';
  setSlTpUnit: (unit: 'PRICE' | 'PIPS' | 'USD') => void;
  // Workspace
  workspace: 'real' | 'demo';
  setWorkspace: (w: 'real' | 'demo') => void;
  // Internal Transfer
  openInternalTransferModal: () => void;
  closeInternalTransferModal: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [tradeSettingsOpen, setTradeSettingsOpen] = useState(false);
  const [tradeSettingsParams, setTradeSettingsParams] = useState({ positionId: '', sl: '', tp: '' });
  const [internalTransferOpen, setInternalTransferOpen] = useState(false);

  // Persistent Settings
  const [workspace, setWorkspaceState] = useState<'real' | 'demo'>(() => {
    return (localStorage.getItem('ex_workspace') as any) || 'real';
  });
  const [oneClickTrading, setOneClickTradingState] = useState<boolean>(() => {
    return localStorage.getItem('ex_one_click') === 'true';
  });
  const [slTpUnit, setSlTpUnitState] = useState<'PRICE' | 'PIPS' | 'USD'>(() => {
    return (localStorage.getItem('ex_sltp_unit') || 'PRICE') as any;
  });

  const setOneClickTrading = (val: boolean) => {
    setOneClickTradingState(val);
    localStorage.setItem('ex_one_click', val.toString());
  };

  const setSlTpUnit = (unit: 'PRICE' | 'PIPS' | 'USD') => {
    setSlTpUnitState(unit);
    localStorage.setItem('ex_sltp_unit', unit);
  };

  const setWorkspace = (w: 'real' | 'demo') => {
    setWorkspaceState(w);
    localStorage.setItem('ex_workspace', w);
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openWalletModal = (defaultTab: 'deposit' | 'withdraw' = 'deposit') => {
    setWalletModalTab(defaultTab);
    setWalletModalOpen(true);
  };

  const openTradeSettingsModal = (params: { positionId: string; sl: string; tp: string }) => {
    setTradeSettingsParams(params);
    setTradeSettingsOpen(true);
  };

  return (
    <UiContext.Provider
      value={{
        showToast,
        openWalletModal,
        closeWalletModal: () => setWalletModalOpen(false),
        openTradeSettingsModal,
        closeTradeSettingsModal: () => setTradeSettingsOpen(false),
        oneClickTrading,
        setOneClickTrading,
        slTpUnit,
        setSlTpUnit,
        workspace,
        setWorkspace,
        openInternalTransferModal: () => setInternalTransferOpen(true),
        closeInternalTransferModal: () => setInternalTransferOpen(false)
      }}
    >
      {children}

      {/* Global Modals */}
      {walletModalOpen && <WalletModal defaultTab={walletModalTab} onClose={() => setWalletModalOpen(false)} />}
      {tradeSettingsOpen && <TradeSettingsModal params={tradeSettingsParams} onClose={() => setTradeSettingsOpen(false)} />}
      {internalTransferOpen && <InternalTransferModal onClose={() => setInternalTransferOpen(false)} />}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-sleek-panel border border-sleek-border shadow-2xl rounded-lg p-4 flex items-center gap-3 w-80 animate-in slide-in-from-right fade-in">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-sleek-green shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-sleek-red shrink-0" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-sleek-gold shrink-0" />}
            <p className="text-sm text-sleek-text font-medium flex-1 leading-snug">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-sleek-muted hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used within UiProvider');
  return context;
}
