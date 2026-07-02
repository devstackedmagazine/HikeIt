"use client";

import {
  Bell,
  Calendar,
  CloudLightning,
  type LucideIcon,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Notification } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/datetime";
import { markAllAsRead, markAsRead } from "@/server/actions/notifications";

const ICONS: Record<string, LucideIcon> = {
  weather: CloudLightning,
  trip: Calendar,
  club: Users,
};

const TABS = [
  { value: "all", label: "Të gjitha" },
  { value: "unread", label: "Të palexuara" },
  { value: "weather", label: "Alarme moti" },
  { value: "trip", label: "Udhëtime" },
] as const;

export function NotificationsList({
  initialItems,
}: {
  initialItems: Notification[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");

  const filtered = items.filter((n) => {
    if (tab === "all") return true;
    if (tab === "unread") return n.readAt === null;
    return n.type === tab;
  });

  async function handleMarkAll() {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    router.refresh();
  }

  async function handleClick(n: Notification) {
    if (!n.readAt) {
      await markAsRead([n.id]);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date() } : x)),
      );
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                tab === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAll}>
          Shëno të gjitha si të lexuara
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground">
          Nuk keni njoftime të reja
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <Card
                key={n.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted",
                  !n.readAt && "border-primary/40 bg-primary/5",
                )}
                onClick={() => handleClick(n)}
              >
                <CardContent className="flex gap-3 py-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
