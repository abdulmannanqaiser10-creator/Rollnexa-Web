"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient, dashboardPathForRole } from "@/lib/auth-client";

export function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    const next = searchParams.get("next");
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null;

    if (session?.user) {
      router.replace(safeNext || dashboardPathForRole(session.user.role));
      router.refresh();
      return;
    }

    const error = searchParams.get("error");
    const loginUrl = error
      ? `/login?error=${encodeURIComponent(error)}`
      : "/login";
    router.replace(loginUrl);
  }, [isPending, router, searchParams, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-rn-surface">
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <Loader2 size={28} className="animate-spin text-amber-500" />
        <p className="text-sm font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
