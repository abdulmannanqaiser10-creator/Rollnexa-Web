import type { HomeMachine } from "@/lib/home/types";

/** Serializable recently-viewed row — safe for Client Components. */
export type RecentlyViewedMachine = HomeMachine & {
  recordId: string;
  viewedAt: string;
  listingStatus: string;
  available: boolean;
};
