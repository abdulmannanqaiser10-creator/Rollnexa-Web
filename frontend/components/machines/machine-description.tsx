import type { MachineDetail } from "@/lib/machines/detail";

type MachineDescriptionProps = {
  description: string | null;
};

export function MachineDescription({ description }: MachineDescriptionProps) {
  return (
    <section className="rn-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-rn-ink">Description</h2>
      {description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-rn-charcoal">
          {description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-rn-muted">No description provided.</p>
      )}
    </section>
  );
}

type MachineSpecificationsProps = {
  machine: MachineDetail;
};

export function MachineSpecifications({ machine }: MachineSpecificationsProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Category", value: machine.category.name },
    { label: "Brand", value: machine.brand.name },
    ...(machine.model ? [{ label: "Model", value: machine.model }] : []),
    ...(machine.year
      ? [{ label: "Manufacturing Year", value: String(machine.year) }]
      : []),
    { label: "Condition", value: machine.conditionLabel },
    ...(machine.hours != null
      ? [{ label: "Engine Hours", value: `${machine.hours.toLocaleString()} hrs` }]
      : []),
    { label: "Price", value: machine.priceLabel },
    ...(machine.location
      ? [{ label: "Location", value: machine.location }]
      : []),
  ];

  return (
    <section className="rn-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-rn-ink">Specifications</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-black/5 bg-rn-surface px-4 py-3"
          >
            <dt className="text-xs font-semibold tracking-wide text-rn-muted uppercase">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-rn-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
