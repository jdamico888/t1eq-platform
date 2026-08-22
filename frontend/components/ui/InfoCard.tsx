type InfoCardProps = {
  title: string;

  items: {
    label: string;
    value?: React.ReactNode;
  }[];
};

export default function InfoCard({
  title,
  items,
}: InfoCardProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        {title}
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </div>

            <div className="mt-1 text-sm text-slate-200">
              {item.value || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}