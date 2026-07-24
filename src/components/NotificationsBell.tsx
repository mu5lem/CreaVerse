import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as NotificationRow[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) {
      toast.error(error.message);
      await load();
    }
  };

  if (!profile) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="press relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-secondary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-ember)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-slide-in-right absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="font-display text-base text-foreground">Notifications</div>
            <button type="button" onClick={markAllRead} className="press inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" /> Mark read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              items.map((n) => (
                <a
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-border p-3 text-sm transition hover:bg-secondary ${n.read ? "opacity-70" : "bg-[var(--color-parchment)]/40"}`}
                >
                  <div className="font-medium text-foreground">{n.message}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {n.type} · {new Date(n.created_at).toLocaleString()}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}