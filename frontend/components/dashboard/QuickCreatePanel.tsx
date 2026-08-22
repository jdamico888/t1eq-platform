import Link from "next/link";

type QuickCreateItem = {
  label: string;

  href: string;

  description?: string;
};

type QuickCreatePanelProps = {
  items: QuickCreateItem[];
};

export default function QuickCreatePanel({
  items,
}: QuickCreatePanelProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          Quick Create
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Rapid access to operational workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan-500/40 hover:bg-white/10"
          >
            <div className="font-medium text-cyan-300">
              {item.label}
            </div>

            {item.description && (
              <div className="mt-2 text-sm text-slate-400">
                {item.description}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}