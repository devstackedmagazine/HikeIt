import { getOptionalSession } from "@/lib/auth/helpers";
import {
  getUnreadCount,
  getUnreadNotifications,
} from "@/server/queries/notifications";

export const dynamic = "force-dynamic";

/** Lightweight feed for the notifications bell (latest unread + count). */
export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return Response.json({ notifications: [], unreadCount: 0 });
  }
  const [notifications, unreadCount] = await Promise.all([
    getUnreadNotifications(session.user.id),
    getUnreadCount(session.user.id),
  ]);
  return Response.json({ notifications, unreadCount });
}
