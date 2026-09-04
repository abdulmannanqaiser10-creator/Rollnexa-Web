import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Notifications",
  description: "Your Rollnexa notifications",
  path: "/notifications",
  noIndex: true,
});

export default async function NotificationsPage() {
  const session = await requireSession();
  if (!session) redirect("/login?callbackUrl=/notifications");

  return <NotificationCenter />;
}
