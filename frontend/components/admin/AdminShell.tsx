"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

type AdminShellProps = {
  adminName: string;
  adminEmail: string;
  adminImage?: string | null;
  children: React.ReactNode;
};

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/sellers")) return "Sellers";
  if (pathname.startsWith("/admin/machines")) return "Machines";
  if (pathname.startsWith("/admin/categories")) return "Categories";
  if (pathname.startsWith("/admin/brands")) return "Brands";
  if (pathname.startsWith("/admin/reports")) return "Reports";
  if (pathname.startsWith("/admin/reviews")) return "Reviews";
  if (pathname.startsWith("/admin/analytics")) return "Analytics";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Overview";
}

function breadcrumbsFromPath(pathname: string) {
  const title = titleFromPath(pathname);
  if (pathname === "/admin/dashboard") {
    return [
      { label: "Admin", href: "/admin/dashboard" },
      { label: "Overview" },
    ];
  }
  return [{ label: "Admin", href: "/admin/dashboard" }, { label: title }];
}

export function AdminShell({
  adminName,
  adminEmail,
  adminImage,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const breadcrumbs = useMemo(() => breadcrumbsFromPath(pathname), [pathname]);

  return (
    <div className="rn-dashboard-bg min-h-screen">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminName={adminName}
      />
      <div className="lg:pl-72">
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          adminName={adminName}
          adminEmail={adminEmail}
          adminImage={adminImage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
