import {
  CalendarDays,
  Clock3,
  MapPin,
  Tag,
} from "lucide-react";
import type { MachineDetail } from "@/lib/machines/detail";
import { MachineActions } from "@/components/machines/machine-actions";

type MachineSummaryProps = {
  machine: MachineDetail;
  isAuthenticated: boolean;
};

export function MachineSummary({ machine, isAuthenticated }: MachineSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
          {machine.category.name}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink sm:text-4xl">
          {machine.title}
        </h1>
        <p className="mt-2 text-sm text-rn-muted">
          {[machine.brand.name, machine.model].filter(Boolean).join(" · ")}
        </p>
      </div>

      <p className="font-display text-3xl font-bold text-rn-ink sm:text-4xl">
        {machine.priceLabel}
      </p>

      <div className="flex flex-wrap gap-3 text-sm text-rn-muted">
        {machine.year ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2">
            <CalendarDays className="size-4 text-rn-gold" />
            {machine.year}
          </span>
        ) : null}
        {machine.hours != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2">
            <Clock3 className="size-4 text-rn-gold" />
            {machine.hours.toLocaleString()} hrs
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 capitalize">
          <Tag className="size-4 text-rn-gold" />
          {machine.conditionLabel}
        </span>
        {machine.location ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2">
            <MapPin className="size-4 text-rn-gold" />
            {machine.location}
          </span>
        ) : null}
      </div>

      <MachineActions machine={machine} isAuthenticated={isAuthenticated} />
    </div>
  );
}
