import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";

export const metadata = {
  title: "My Inquiries — Rollnexa",
  description: "View all inquiries you have sent to sellers on Rollnexa.",
};

export default async function BuyerInquiriesPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login?callbackUrl=/buyer/inquiries");

  let inquiries: {
    id: string;
    message: string;
    status: string;
    createdAt: Date;
    sellerId: string;
    machine: {
      id: string;
      title: string;
      slug: string;
      imageUrl: string | null;
      brandName: string;
    };
    sellerName: string;
  }[] = [];
  let loadFailed = false;
  const conversationMap = new Map<string, string>();

  try {
    const rows = await prisma.inquiry.findMany({
      where: { buyerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sellerId: true,
        message: true,
        status: true,
        createdAt: true,
        machine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: { select: { name: true } },
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
        seller: {
          select: {
            name: true,
            profile: { select: { companyName: true } },
          },
        },
      },
    });

    inquiries = rows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      sellerId: row.sellerId,
      machine: {
        id: row.machine.id,
        title: row.machine.title,
        slug: row.machine.slug,
        imageUrl: row.machine.images[0]?.url ?? null,
        brandName: row.machine.brand.name,
      },
      sellerName:
        row.seller.profile?.companyName || row.seller.name || "Seller",
    }));

    const conversations = await prisma.conversation.findMany({
      where: {
        buyerId: session.user.id,
        OR: rows.map((row) => ({
          sellerId: row.sellerId,
          machineId: row.machine.id,
        })),
      },
      select: { id: true, sellerId: true, machineId: true },
    });
    for (const c of conversations) {
      conversationMap.set(`${c.sellerId}:${c.machineId}`, c.id);
    }
  } catch (error) {
    console.error("[buyer/inquiries] Failed:", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="rn-eyebrow">Contact History</p>
        <h2 className="rn-page-title text-2xl sm:text-3xl">My Inquiries</h2>
        <p className="mt-2 text-sm text-rn-muted">
          One-time inquiry messages you have sent to sellers.
        </p>
      </div>

      {loadFailed ? (
        <div className="rn-panel text-center">
          <h3 className="font-display text-xl font-bold text-rn-ink">
            Unable to load inquiries
          </h3>
          <p className="mt-2 text-sm text-rn-muted">
            Please try again in a moment.
          </p>
          <Link href="/buyer/inquiries" className="rn-btn-primary mt-5">
            Retry
          </Link>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rn-panel text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-rn-ink/5">
            <MessageSquare className="size-6 text-rn-muted" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
            You haven&apos;t contacted any sellers yet.
          </h3>
          <p className="mt-2 text-sm text-rn-muted">
            When you send a one-time inquiry about a machine, it will appear
            here.
          </p>
          <Link href="/machines" className="rn-btn-primary mt-5">
            Browse Machines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-rn-muted">
            {inquiries.length} inquiry{inquiries.length === 1 ? "" : "s"}
          </p>
          <ul className="space-y-3">
            {inquiries.map((inquiry) => {
              const conversationId = conversationMap.get(
                `${inquiry.sellerId}:${inquiry.machine.id}`
              );
              return (
                <li key={inquiry.id} className="rn-card overflow-hidden">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <div className="shrink-0">
                    {inquiry.machine.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inquiry.machine.imageUrl}
                        alt={inquiry.machine.title}
                        className="h-20 w-28 rounded-lg object-cover sm:h-24 sm:w-32"
                      />
                    ) : (
                      <div className="h-20 w-28 rounded-lg bg-rn-ink/5 sm:h-24 sm:w-32" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/machines/${inquiry.machine.slug}`}
                          className="font-display text-base font-bold text-rn-ink hover:text-rn-gold"
                        >
                          {inquiry.machine.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-rn-muted">
                          {inquiry.machine.brandName} · Seller:{" "}
                          {inquiry.sellerName}
                        </p>
                      </div>
                      <MachineStatusBadge status={inquiry.status} />
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-rn-ink/75">
                      {inquiry.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-rn-muted">
                        Sent{" "}
                        {new Date(inquiry.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                      <Link
                        href={`/machines/${inquiry.machine.slug}`}
                        className="text-xs font-semibold text-rn-gold underline-offset-4 hover:underline"
                      >
                        View Machine →
                      </Link>
                      {conversationId ? (
                        <Link
                          href={`/buyer/messages?c=${conversationId}`}
                          className="text-xs font-semibold text-rn-ink underline-offset-4 hover:underline"
                        >
                          View Conversation →
                        </Link>
                      ) : (
                        <Link
                          href={`/machines/${inquiry.machine.slug}`}
                          className="text-xs font-semibold text-rn-ink underline-offset-4 hover:underline"
                        >
                          Continue Conversation →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
