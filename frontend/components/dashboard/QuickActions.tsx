import Link from "next/link";

type QuickAction = {
  label: string;
  href: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

export default function QuickActions({
  actions,
}: QuickActionsProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        Quick Actions
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-500/40 hover:bg-white/10"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}