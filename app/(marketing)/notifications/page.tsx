import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export const metadata = { title: "Notifications — Rollnexa" };

export default async function NotificationsPage() {
  const session = await requireSession();
  if (!session) redirect("/login?callbackUrl=/notifications");

  return <NotificationCenter />;
}
