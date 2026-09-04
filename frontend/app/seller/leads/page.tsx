import { Users } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/SellerComingSoon";

export const metadata = { title: "Leads — Rollnexa Seller" };

export default function SellerLeadsPage() {
  return (
    <SellerComingSoon
      icon={Users}
      title="Leads / CRM coming soon"
      description="Track serious buyer leads and follow-ups from one place."
    />
  );
}
