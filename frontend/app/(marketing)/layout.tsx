import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CompareShell } from "@/components/compare/compare-shell";
import { getSession } from "@/lib/session";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-rn-surface">
      <SiteHeader
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
              }
            : null
        }
      />
      <CompareShell>{children}</CompareShell>
      <SiteFooter />
    </div>
  );
}
