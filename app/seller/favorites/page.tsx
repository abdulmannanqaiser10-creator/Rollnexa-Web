import { Heart } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/SellerComingSoon";

export const metadata = { title: "Favorites — Rollnexa Seller" };

export default function SellerFavoritesPage() {
  return (
    <SellerComingSoon
      icon={Heart}
      title="Listing favorites coming soon"
      description="See which buyers saved your machines once favorites analytics are expanded."
    />
  );
}
