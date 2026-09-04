import Link from "next/link";

type UpgradeDialogProps = {
  title?: string;
  message?: string;
};

export function UpgradeDialog({
  title = "Listing limit reached",
  message = "Upgrade your subscription to add more machine listings.",
}: UpgradeDialogProps) {
  return (
    <div className="rounded-2xl border border-[#F5B800]/30 bg-[#FFF9E8] p-6">
      <h3 className="font-display text-lg font-bold text-[#111827]">{title}</h3>
      <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      <Link
        href="/seller/subscription"
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#F5B800] px-4 text-sm font-bold text-[#080D12]"
      >
        Upgrade Plan
      </Link>
    </div>
  );
}
