import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";

type AdminActivityInput = {
  userId: string;
  action:
    | "USER_ROLE_UPDATED"
    | "USER_STATUS_UPDATED"
    | "LISTING_APPROVED"
    | "LISTING_REJECTED"
    | "LISTING_ARCHIVED"
    | "LISTING_MARKED_SOLD"
    | "LISTING_FEATURED"
    | "LISTING_UNFEATURED"
    | "CATEGORY_CREATED"
    | "CATEGORY_UPDATED"
    | "CATEGORY_DELETED"
    | "BRAND_CREATED"
    | "BRAND_UPDATED"
    | "BRAND_DELETED"
    | "REPORT_UPDATED"
    | "SUBSCRIPTION_PLAN_CREATED"
    | "SUBSCRIPTION_PLAN_UPDATED"
    | "SUBSCRIPTION_PLAN_ARCHIVED";
  description: string;
  targetId?: string | null;
};

export async function getRequestIpAddress() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  return (
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    null
  );
}

export async function logAdminActivity(input: AdminActivityInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        description: input.description,
        targetId: input.targetId || null,
        ipAddress: await getRequestIpAddress(),
      },
    });
  } catch (error) {
    console.error("[admin/activity-log] Failed to persist activity", error);
  }
}
