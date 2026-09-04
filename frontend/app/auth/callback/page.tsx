import { Suspense } from "react";
import { AuthCallbackContent } from "./auth-callback-content";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-rn-surface">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
