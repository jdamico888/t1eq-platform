type RepairOrderStatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  Draft:
    "bg-slate-500/20 text-slate-300 border border-slate-400/30",

  Open:
    "bg-blue-500/20 text-blue-300 border border-blue-400/30",

  Scheduled:
    "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30",

  Dispatched:
    "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30",

  "In Progress":
    "bg-amber-500/20 text-amber-300 border border-amber-400/30",

  "Waiting on Parts":
    "bg-orange-500/20 text-orange-300 border border-orange-400/30",

  "Waiting Approval":
    "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30",

  Completed:
    "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",

  Invoiced:
    "bg-green-500/20 text-green-300 border border-green-400/30",

  Closed:
    "bg-zinc-500/20 text-zinc-300 border border-zinc-400/30",

  Cancelled:
    "bg-red-500/20 text-red-300 border border-red-400/30",
};

export default function RepairOrderStatusBadge({
  status,
}: RepairOrderStatusBadgeProps) {
  const badgeStyle =
    statusStyles[status] ??
    "bg-slate-500/20 text-slate-300 border border-slate-400/30";

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyle}`}
    >
      {status}
    </div>
  );
}