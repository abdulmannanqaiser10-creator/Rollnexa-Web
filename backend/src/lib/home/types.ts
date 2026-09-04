/** Shared home/marketplace types — safe for Client Components. */

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  machineCount: number;
};

export type HomeMachine = {
  id: string;
  title: string;
  slug: string;
  price: number;
  year: number | null;
  hours: number | null;
  condition: string;
  location: string | null;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  isPremium: boolean;
};

export type HomeDealer = {
  id: string;
  name: string;
  image: string | null;
  companyName: string | null;
  city: string | null;
  country: string | null;
  listingCount: number;
  verified: boolean;
  rating: number;
};

export type HomeStats = {
  machines: number;
  dealers: number;
  buyers: number;
  cities: number;
  deals: number;
};

export const HERO_IMAGE = "/uploads/machines/image.png";
