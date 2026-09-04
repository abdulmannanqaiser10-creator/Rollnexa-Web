/** Serializable compare row — safe for Client Components. */

export type CompareMachineDetail = {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceLabel: string;
  year: number | null;
  hours: number | null;
  condition: string;
  conditionLabel: string;
  location: string | null;
  model: string | null;
  imageUrl: string | null;
  brandName: string;
  categoryName: string;
  sellerName: string;
};
