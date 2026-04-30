import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../lib/api';

export interface PriceData {
  symbol: string;
  bid: number;
  ask: number;
  spread?: number;
  timestamp: number;
  direction?: 'up' | 'down' | 'neutral';
}

interface MarketContextType {
  prices: Record<string, PriceData>;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  isConnected: boolean;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const activeSubscriptions = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, []);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    // Use WS_URL from api.ts which points to the backend directly (e.g. localhost:5000/ws)
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      setIsConnected(true);
      if (activeSubscriptions.current.size > 0) {
        ws.current?.send(JSON.stringify({
          type: 'subscribe',
          symbols: Array.from(activeSubscriptions.current),
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'snapshot' || message.type === 'prices') {
          setPrices(prev => {
            const next = { ...prev };
            Object.entries(message.data as Record<string, PriceData>).forEach(([sym, data]) => {
              const old = prev[sym];
              let direction: 'up' | 'down' | 'neutral' = 'neutral';
              if (old) {
                if (data.bid > old.bid) direction = 'up';
                else if (data.bid < old.bid) direction = 'down';
                else direction = old.direction || 'neutral';
              }
              next[sym] = { ...data, direction };
            });
            return next;
          });
        }
      } catch (_) {}
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (e) => {
      console.warn('[MarketWS] error:', e);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  };

  const subscribe = (symbols: string[]) => {
    symbols.forEach(s => activeSubscriptions.current.add(s.toUpperCase()));
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', symbols }));
    }
  };

  const unsubscribe = (symbols: string[]) => {
    symbols.forEach(s => activeSubscriptions.current.delete(s.toUpperCase()));
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'unsubscribe', symbols }));
    }
  };

  // Keepalive ping every 25s
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <MarketContext.Provider value={{ prices, subscribe, unsubscribe, isConnected }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within a MarketProvider');
  return context;
}
