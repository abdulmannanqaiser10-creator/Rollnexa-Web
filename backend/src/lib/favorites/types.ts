import type { HomeMachine } from "@/lib/home/types";

/** Serializable favorite row — safe for Client Components. */
export type FavoriteMachine = HomeMachine & {
  favoriteId: string;
  favoritedAt: string;
  listingStatus: string;
  available: boolean;
};
