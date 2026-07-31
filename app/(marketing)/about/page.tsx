export const metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <div className="bg-rn-surface py-14">
      <div className="rn-container max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
          About Rollnexa
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-rn-ink">
          The trusted marketplace for heavy construction equipment
        </h1>
        <p className="mt-5 text-base leading-relaxed text-rn-muted">
          Rollnexa connects buyers and sellers of road rollers, excavators, cranes,
          bulldozers, loaders, and more. Our platform focuses on verified dealers,
          clear machine data, and a premium buying experience built for the
          construction industry.
        </p>
      </div>
    </div>
  );
}
