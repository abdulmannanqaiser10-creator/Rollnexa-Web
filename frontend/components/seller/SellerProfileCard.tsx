import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { SellerDashboardProfile } from "@/lib/seller/dashboard-data";

type SellerProfileCardProps = {
  profile: SellerDashboardProfile;
};

export function SellerProfileCard({ profile }: SellerProfileCardProps) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const displayName = profile.companyName || profile.name;

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#080D12] text-lg font-bold text-[#F5B800]">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.image} alt="" className="size-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-[#111827]">
              {displayName}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5B800]/15 px-2 py-0.5 text-[11px] font-semibold text-[#B8860B]">
              <BadgeCheck className="size-3.5" />
              Verified Seller
            </span>
          </div>
          {profile.companyName && profile.name !== profile.companyName ? (
            <p className="mt-0.5 text-sm text-[#6B7280]">{profile.name}</p>
          ) : null}
          {location ? (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#6B7280]">
              <MapPin className="size-3.5 text-[#F5B800]" />
              {location}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#6B7280]">Location not set</p>
          )}
          <p className="mt-1 text-sm text-[#6B7280]">
            {profile.listingCount} listing
            {profile.listingCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#111827]">Profile Completion</span>
          <span className="font-semibold text-[#6B7280]">
            {profile.profileCompletion}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#F6F7F9]">
          <div
            className="h-full rounded-full bg-[#F5B800] transition-all"
            style={{ width: `${profile.profileCompletion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">
          Complete your profile to build buyer trust.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/dealers/${profile.id}`}
          className="inline-flex h-10 items-center rounded-xl bg-[#080D12] px-4 text-sm font-semibold text-white"
        >
          View Public Profile
        </Link>
        <Link
          href="/seller/profile"
          className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827]"
        >
          Edit Profile
        </Link>
      </div>
    </section>
  );
}
