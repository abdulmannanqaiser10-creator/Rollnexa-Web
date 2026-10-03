import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { InquiryStatusActions } from "@/components/seller/InquiryStatusActions";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Inquiry Detail — Rollnexa Seller" };

export default async function SellerInquiryDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const { id } = await params;

  let inquiry: {
    id: string;
    message: string;
    status: string;
    createdAt: Date;
    machine: { id: string; title: string; slug: string; imageUrl: string | null };
    buyer: {
      name: string | null;
      email: string;
      phone: string | null;
      avatar: string | null;
      companyName: string | null;
    };
  } | null = null;

  try {
    const row = await prisma.inquiry.findFirst({
      where: { id, sellerId: session.user.id },
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        machine: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
        buyer: {
          select: {
            name: true,
            email: true,
            profile: { select: { phone: true, avatar: true, companyName: true } },
          },
        },
      },
    });

    if (row) {
      inquiry = {
        id: row.id,
        message: row.message,
        status: row.status,
        createdAt: row.createdAt,
        machine: {
          id: row.machine.id,
          title: row.machine.title,
          slug: row.machine.slug,
          imageUrl: resolveMachineImageUrl(row.machine.images[0]?.url),
        },
        buyer: {
          name: row.buyer.name,
          email: row.buyer.email,
          phone: row.buyer.profile?.phone ?? null,
          avatar: row.buyer.profile?.avatar ?? null,
          companyName: row.buyer.profile?.companyName ?? null,
        },
      };

      // Auto-mark as READ when seller opens it
      if (row.status === "NEW") {
        await prisma.inquiry.update({
          where: { id },
          data: { status: "READ" },
        });
        inquiry.status = "READ";
      }
    }
  } catch (error) {
    console.error("[seller/inquiries/[id]] Failed:", error);
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#111827]">
          Unable to load inquiry
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">Please try again in a moment.</p>
        <Link
          href="/seller/inquiries"
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#F5B800] px-5 text-sm font-bold text-[#080D12]"
        >
          Back to Inquiries
        </Link>
      </div>
    );
  }

  if (!inquiry) notFound();

  const displayName =
    inquiry.buyer.companyName || inquiry.buyer.name || "Buyer";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/seller/inquiries"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6B7280] hover:text-[#111827]"
          aria-label="Back to inquiries"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-[#111827]">
            Inquiry Detail
          </h1>
          <p className="text-sm text-[#6B7280]">
            {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="ml-auto">
          <MachineStatusBadge status={inquiry.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main: buyer message */}
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#080D12] text-sm font-bold text-[#F5B800]">
                {inquiry.buyer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inquiry.buyer.avatar}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </span>
              <div>
                <p className="font-semibold text-[#111827]">{displayName}</p>
                {inquiry.buyer.companyName && inquiry.buyer.name ? (
                  <p className="text-xs text-[#6B7280]">{inquiry.buyer.name}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#F6F7F9] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
                <MessageSquare className="size-3.5" />
                Message
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111827]">
                {inquiry.message}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`mailto:${inquiry.buyer.email}?subject=Re: ${encodeURIComponent(inquiry.machine.title)}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#111827] hover:border-[#F5B800]"
              >
                <Mail className="size-4 text-[#6B7280]" />
                Reply via Email
              </a>
              {inquiry.buyer.phone ? (
                <a
                  href={`tel:${inquiry.buyer.phone}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-[#111827] hover:border-[#F5B800]"
                >
                  <Phone className="size-4 text-[#6B7280]" />
                  Call Buyer
                </a>
              ) : null}
            </div>
          </section>

          <InquiryStatusActions
            inquiryId={inquiry.id}
            currentStatus={inquiry.status}
          />
        </div>

        {/* Sidebar: buyer info + machine */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-[#111827]">
              Buyer Contact
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Name
                </dt>
                <dd className="mt-0.5 font-medium text-[#111827]">{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Email
                </dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${inquiry.buyer.email}`}
                    className="font-medium text-[#111827] underline-offset-4 hover:underline"
                  >
                    {inquiry.buyer.email}
                  </a>
                </dd>
              </div>
              {inquiry.buyer.phone ? (
                <div>
                  <dt className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Phone
                  </dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${inquiry.buyer.phone}`}
                      className="font-medium text-[#111827] underline-offset-4 hover:underline"
                    >
                      {inquiry.buyer.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-[#111827]">
              Machine
            </h2>
            <div className="mt-3 flex items-start gap-3">
              {inquiry.machine.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inquiry.machine.imageUrl}
                  alt={inquiry.machine.title}
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="size-16 shrink-0 rounded-lg bg-[#F6F7F9]" />
              )}
              <div>
                <p className="font-semibold text-[#111827]">
                  {inquiry.machine.title}
                </p>
                <Link
                  href={`/machines/${inquiry.machine.slug}`}
                  className="mt-1 text-xs font-semibold text-[#F5B800] underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Listing ↗
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
