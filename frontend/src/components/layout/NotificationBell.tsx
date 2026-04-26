import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await fetchApi('/notifications?limit=20');
      setNotifications(data?.items ?? []);
      setUnread(data?.unread ?? 0);
    } catch (_) {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetchApi('/notifications/read-all', { method: 'PATCH' });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const typeColor = (type: string) => {
    if (type === 'trade') return 'bg-sleek-green/10 text-sleek-green';
    if (type === 'margin_call') return 'bg-sleek-red/10 text-sleek-red';
    if (type === 'deposit' || type === 'withdrawal') return 'bg-sleek-gold/10 text-sleek-gold';
    return 'bg-sleek-panel text-sleek-muted';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative h-8 w-8 flex items-center justify-center rounded-md text-sleek-muted hover:text-sleek-text hover:bg-sleek-hover transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-sleek-red rounded-full border border-sleek-dark animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-sleek-dark border border-sleek-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sleek-border">
            <span className="text-xs font-black text-white uppercase tracking-widest">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-sleek-gold font-bold hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sleek-muted text-xs font-bold uppercase tracking-widest">No notifications</div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className={`px-4 py-3 border-b border-sleek-border/40 hover:bg-sleek-hover/30 transition-colors ${!n.isRead ? 'bg-sleek-panel/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${typeColor(n.type)}`}>{n.type.replace('_', ' ')}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                      <p className="text-[11px] text-sleek-muted mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-sleek-muted/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.isRead && <div className="h-2 w-2 bg-sleek-gold rounded-full shrink-0 mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
