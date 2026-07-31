"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { SellerHeader } from "@/components/seller/SellerHeader";

type SellerShellProps = {
  sellerName: string;
  sellerEmail: string;
  sellerImage?: string | null;
  children: React.ReactNode;
};

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/seller/machines/new")) return "Add Machine";
  if (pathname.includes("/edit")) return "Edit Machine";
  if (pathname.startsWith("/seller/machines")) return "My Machines";
  if (pathname.startsWith("/seller/inquiries")) return "Inquiries";
  if (pathname.startsWith("/seller/analytics")) return "Analytics";
  if (pathname.startsWith("/seller/profile")) return "Profile Settings";
  if (pathname.startsWith("/seller/settings")) return "Account Settings";
  if (pathname.startsWith("/seller/messages")) return "Messages";
  if (pathname.startsWith("/seller/reviews")) return "Reviews";
  if (pathname.startsWith("/seller/favorites")) return "Favorites";
  if (pathname.startsWith("/seller/leads")) return "Leads / CRM";
  if (pathname.startsWith("/seller/payments")) return "Payments";
  if (pathname.startsWith("/seller/subscription")) return "Subscription";
  if (pathname.startsWith("/seller/help")) return "Help & Support";
  return "Dashboard";
}

function breadcrumbsFromPath(pathname: string) {
  const title = titleFromPath(pathname);
  if (pathname === "/seller/dashboard") {
    return [
      { label: "Seller Dashboard", href: "/seller/dashboard" },
      { label: "Overview" },
    ];
  }
  return [
    { label: "Seller Dashboard", href: "/seller/dashboard" },
    { label: title },
  ];
}

export function SellerShell({
  sellerName,
  sellerEmail,
  sellerImage,
  children,
}: SellerShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const breadcrumbs = useMemo(() => breadcrumbsFromPath(pathname), [pathname]);

  return (
    <div className="rn-dashboard-bg">
      <SellerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sellerName={sellerName}
      />
      <div className="lg:pl-72">
        <SellerHeader
          title={title}
          breadcrumbs={breadcrumbs}
          sellerName={sellerName}
          sellerEmail={sellerEmail}
          sellerImage={sellerImage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
