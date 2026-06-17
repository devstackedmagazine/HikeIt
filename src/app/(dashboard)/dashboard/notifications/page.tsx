import type { Metadata } from "next";

import { NotificationsList } from "@/components/features/notifications/notifications-list";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getNotifications } from "@/server/queries/notifications";

export const metadata: Metadata = { title: "Njoftimet" };

export default async function NotificationsPage() {
  const user = await getRequiredUser();
  const { notifications } = await getNotifications(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Njoftimet</h1>
      <NotificationsList initialItems={notifications} />
    </div>
  );
}
