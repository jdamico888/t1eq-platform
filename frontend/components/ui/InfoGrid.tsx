type InfoGridItem = {
  label: string;

  value?: React.ReactNode;
};

type InfoGridProps = {
  items: InfoGridItem[];
};

export default function InfoGrid({
  items,
}: InfoGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          key={item.label}
          className="rounded-2xl border border-white/5 bg-black/20 p-4"
        >
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {item.label}
          </div>

          <div className="mt-2 text-sm text-slate-200">
            {item.value || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}