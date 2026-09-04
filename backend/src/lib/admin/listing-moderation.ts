import "server-only";

import { prisma } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin/activity-log";
import {
  assertAdminTransition,
  type ListingStatusValue,
} from "@/lib/machines/listing-status";
import { createNotification } from "@/lib/notifications/service";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from "@/lib/emails/service";

const REJECTION_PRESETS: Record<string, string> = {
  MISSING_INFORMATION: "Please complete all required listing information.",
  POOR_IMAGE_QUALITY: "Please upload clearer, high-quality machine images.",
  INCORRECT_CATEGORY: "Please select the correct machine category.",
  INCORRECT_BRAND: "Please select the correct machine brand.",
  SUSPICIOUS_LISTING: "This listing requires additional verification before approval.",
  DUPLICATE_LISTING: "This listing appears to duplicate an existing machine.",
  INAPPROPRIATE_CONTENT: "Please remove inappropriate or misleading content.",
};

export function buildRejectionReason(params: {
  preset?: string;
  custom?: string;
}) {
  if (params.custom?.trim()) return params.custom.trim();
  if (params.preset && REJECTION_PRESETS[params.preset]) {
    return REJECTION_PRESETS[params.preset];
  }
  return null;
}

export async function moderateListing(params: {
  machineId: string;
  adminId: string;
  action: "approve" | "reject" | "archive" | "mark_sold" | "feature" | "unfeature";
  rejectionReason?: string | null;
}) {
  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId },
    select: { id: true, title: true, status: true, isFeatured: true, sellerId: true },
  });

  if (!machine) {
    return { error: "Machine not found" as const, status: 404 as const };
  }

  const now = new Date();

  if (params.action === "feature") {
    if (machine.status !== "PUBLISHED") {
      return {
        error: "Only published listings can be featured.",
        status: 400 as const,
      };
    }
    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: { isFeatured: true },
      select: { id: true, status: true, isFeatured: true },
    });
    await logAdminActivity({
      userId: params.adminId,
      action: "LISTING_FEATURED",
      description: `Featured listing "${machine.title}".`,
      targetId: machine.id,
    });
    return { data: updated };
  }

  if (params.action === "unfeature") {
    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: { isFeatured: false },
      select: { id: true, status: true, isFeatured: true },
    });
    await logAdminActivity({
      userId: params.adminId,
      action: "LISTING_UNFEATURED",
      description: `Removed featured status from listing "${machine.title}".`,
      targetId: machine.id,
    });
    return { data: updated };
  }

  let nextStatus: ListingStatusValue | null = null;

  switch (params.action) {
    case "approve":
      nextStatus = "PUBLISHED";
      break;
    case "reject":
      nextStatus = "REJECTED";
      break;
    case "archive":
      nextStatus = "ARCHIVED";
      break;
    case "mark_sold":
      nextStatus = "SOLD";
      break;
  }

  if (!nextStatus) {
    return { error: "Invalid moderation action", status: 400 as const };
  }

  try {
    assertAdminTransition(machine.status, nextStatus);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid status transition",
      status: 400 as const,
    };
  }

  if (params.action === "reject") {
    if (!params.rejectionReason?.trim()) {
      return {
        error: "A rejection reason is required.",
        status: 400 as const,
      };
    }
  }

  const updated = await prisma.machine.update({
    where: { id: machine.id },
    data: {
      status: nextStatus,
      ...(params.action === "approve"
        ? {
            approvedAt: now,
            approvedById: params.adminId,
            rejectionReason: null,
            rejectedAt: null,
            rejectedById: null,
          }
        : {}),
      ...(params.action === "reject"
        ? {
            rejectionReason: params.rejectionReason,
            rejectedAt: now,
            rejectedById: params.adminId,
            approvedAt: null,
            approvedById: null,
          }
        : {}),
      ...(params.action === "archive" || params.action === "mark_sold"
        ? { isFeatured: false }
        : {}),
    },
    select: {
      id: true,
      status: true,
      isFeatured: true,
      rejectionReason: true,
      rejectedAt: true,
    },
  });

  if (params.action === "approve") {
    await createNotification({
      userId: machine.sellerId,
      type: "MACHINE_APPROVED",
      title: "Machine listing approved",
      message: `Your listing "${machine.title}" has been approved and is now published.`,
      relatedEntityId: machine.id,
      relatedEntityType: "MACHINE",
    });

    try {
      await sendListingApprovedEmail({
        sellerId: machine.sellerId,
        machineName: machine.title,
        listingUrl: `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/machines/${machine.id}`,
      });
    } catch (error) {
      console.error("[listing-moderation] approval email failed", error);
    }
  }

  if (params.action === "reject") {
    await createNotification({
      userId: machine.sellerId,
      type: "MACHINE_REJECTED",
      title: "Listing requires updates",
      message:
        params.rejectionReason?.trim() ||
        `Your listing "${machine.title}" was rejected. Please review the admin feedback and resubmit.`,
      relatedEntityId: machine.id,
      relatedEntityType: "MACHINE",
    });

    try {
      await sendListingRejectedEmail({
        sellerId: machine.sellerId,
        machineName: machine.title,
        rejectionReason: params.rejectionReason?.trim() || "Please update your listing metadata and resubmit.",
        editUrl: `${process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000"}/seller/machines/${machine.id}`,
      });
    } catch (error) {
      console.error("[listing-moderation] rejection email failed", error);
    }
  }

  const activityActionByModerationAction = {
    approve: "LISTING_APPROVED",
    reject: "LISTING_REJECTED",
    archive: "LISTING_ARCHIVED",
    mark_sold: "LISTING_MARKED_SOLD",
  } as const;

  await logAdminActivity({
    userId: params.adminId,
    action: activityActionByModerationAction[params.action],
    description: `Changed listing "${machine.title}" from ${machine.status} to ${updated.status}.`,
    targetId: machine.id,
  });

  return { data: updated };
}
