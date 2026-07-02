import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Notification } from "@/lib/db/schema";
import { notifications } from "@/lib/db/schema";

export async function getUnreadNotifications(
  userId: string,
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt))
    .limit(5);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

export async function getNotifications(
  userId: string,
  page = 1,
): Promise<{
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}> {
  const limit = 20;
  const offset = (Math.max(1, page) - 1) * limit;

  const [rows, unreadCount, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    getUnreadCount(userId),
    db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return { notifications: rows, unreadCount, hasMore: offset + rows.length < total };
}

export async function markNotificationsRead(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  if (notificationIds.length === 0) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.id, notificationIds),
        isNull(notifications.readAt),
      ),
    );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}): Promise<Notification> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link ?? null,
    })
    .returning();
  return row!;
}
