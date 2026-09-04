import type { ListingStatus } from "@prisma/generated";

export type ListingStatusValue = ListingStatus;

export const LISTING_STATUS_LABELS: Record<ListingStatusValue, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

const sellerTransitions: Partial<Record<ListingStatusValue, ListingStatusValue[]>> = {
  DRAFT: ["PENDING_REVIEW"],
  REJECTED: ["PENDING_REVIEW", "DRAFT"],
  PUBLISHED: ["SOLD", "ARCHIVED"],
};

const adminTransitions: Partial<Record<ListingStatusValue, ListingStatusValue[]>> = {
  PENDING_REVIEW: ["PUBLISHED", "REJECTED", "ARCHIVED"],
  PUBLISHED: ["SOLD", "ARCHIVED", "DRAFT"],
  REJECTED: ["ARCHIVED"],
  DRAFT: ["ARCHIVED"],
  SOLD: ["ARCHIVED"],
};

export function canSellerTransition(
  from: ListingStatusValue,
  to: ListingStatusValue
) {
  return sellerTransitions[from]?.includes(to) ?? false;
}

export function canAdminTransition(
  from: ListingStatusValue,
  to: ListingStatusValue
) {
  return adminTransitions[from]?.includes(to) ?? false;
}

export function isPublicListingStatus(status: ListingStatusValue) {
  return status === "PUBLISHED";
}

export function isSellerEditableStatus(status: ListingStatusValue) {
  return status === "DRAFT" || status === "REJECTED";
}

export function assertSellerTransition(
  from: ListingStatusValue,
  to: ListingStatusValue
) {
  if (!canSellerTransition(from, to)) {
    throw new Error(`Invalid seller status transition: ${from} → ${to}`);
  }
}

export function assertAdminTransition(
  from: ListingStatusValue,
  to: ListingStatusValue
) {
  if (!canAdminTransition(from, to)) {
    throw new Error(`Invalid admin status transition: ${from} → ${to}`);
  }
}
