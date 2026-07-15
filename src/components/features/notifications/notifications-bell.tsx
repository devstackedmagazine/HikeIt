"use client";

import {
  Bell,
  Calendar,
  CloudLightning,
  type LucideIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/datetime";
import { markAllAsRead, markAsRead } from "@/server/actions/notifications";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICONS: Record<string, LucideIcon> = {
  weather: CloudLightning,
  trip: Calendar,
  club: Users,
};

export function NotificationsBell({ light = true }: { light?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // Ignore transient polling errors.
    }
  }, []);

  useEffect(() => {
    // Initial fetch + 60s polling; setState happens after an awaited fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleMarkAll() {
    await markAllAsRead();
    void load();
  }

  async function handleClick(item: NotificationItem) {
    if (!item.readAt) {
      await markAsRead([item.id]);
      void load();
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Njoftimet"
        onClick={() => setOpen((v) => !v)}
        className={cn(!light && "text-summit/70 hover:bg-summit/10")}
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Njoftimet</span>
            {unread > 0 ? (
              <button
                onClick={handleMarkAll}
                className="text-xs text-primary hover:underline"
              >
                Shëno të gjitha si të lexuara
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nuk keni njoftime të reja
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => {
                const Icon = ICONS[item.type] ?? Bell;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleClick(item)}
                      className={cn(
                        "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted",
                        !item.readAt && "bg-primary/5",
                      )}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.body}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {timeAgo(item.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t px-3 py-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Shiko të gjitha
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
