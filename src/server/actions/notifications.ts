"use server";

import { getOptionalSession } from "@/lib/auth/helpers";
import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/server/queries/notifications";

/** Mark specific notifications read (only the caller's own). */
export async function markAsRead(notificationIds: string[]): Promise<void> {
  const session = await getOptionalSession();
  if (!session) return;
  await markNotificationsRead(session.user.id, notificationIds);
}

/** Mark all of the caller's notifications read. */
export async function markAllAsRead(): Promise<void> {
  const session = await getOptionalSession();
  if (!session) return;
  await markAllNotificationsRead(session.user.id);
}
