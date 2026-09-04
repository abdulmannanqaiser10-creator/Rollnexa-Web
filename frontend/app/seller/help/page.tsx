import { HelpCircle } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/SellerComingSoon";

export const metadata = { title: "Help — Rollnexa Seller" };

export default function SellerHelpPage() {
  return (
    <SellerComingSoon
      icon={HelpCircle}
      title="Help & Support"
      description="Need assistance with listings or inquiries? Contact support@rollnexa.com or continue managing your machines."
      primaryHref="/seller/machines"
      primaryLabel="Go to My Machines"
    />
  );
}
