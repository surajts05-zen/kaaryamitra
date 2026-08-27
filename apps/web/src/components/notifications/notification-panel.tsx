import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/ui/button';

// ─── Notification type → accent color ────────────────────────────────────────

function typeAccent(type: string): string {
  if (type.includes('approved') || type.includes('completed')) return '#22c55e';
  if (type.includes('rejected')) return '#ef4444';
  if (type.includes('applied') || type.includes('assigned')) return '#A8E600';
  return '#6b7280';
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const { notifications, unreadCount, isOpen, setOpen, markRead, markAllRead, isFetching } =
    useNotificationStore();
  const navigate = useNavigate();
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setOpen]);

  function handleNotificationClick(n: { id: string; link: string | null; readAt: string | null }) {
    if (!n.readAt) markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-km-lime text-[9px] font-bold text-km-dark shadow-glow-lime">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-km-lime/15 px-2 py-0.5 text-[11px] font-semibold text-km-forest dark:text-km-lime">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isFetching && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const accent = typeAccent(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3.5 border-b last:border-0 transition-colors hover:bg-muted/50 flex gap-3 items-start ${
                      isUnread ? 'bg-primary/[0.03]' : ''
                    }`}
                  >
                    {/* Accent dot */}
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: isUnread ? accent : 'transparent', border: isUnread ? 'none' : '1.5px solid #d1d5db' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-tight ${isUnread ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
