type OperationsHeroProps = {
  companyName: string;

  activeRepairOrders: number;

  activeDispatchJobs: number;

  techniciansOnline: number;

  monthlyRevenue: number;
};

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

export default function OperationsHero({
  companyName,
  activeRepairOrders,
  activeDispatchJobs,
  techniciansOnline,
  monthlyRevenue,
}: OperationsHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 via-slate-950 to-black p-8 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%)]" />

      <div className="relative z-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-300">
              Operational Command Center
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight xl:text-6xl">
              {companyName}
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Enterprise equipment service management platform
              integrating repair operations, inspections,
              dispatch scheduling, technician workflow,
              inventory management, and revenue oversight.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="text-xs uppercase tracking-wide text-emerald-300">
                Monthly Revenue
              </div>

              <div className="mt-2 text-4xl font-bold text-emerald-300">
                {formatCurrency(
                  monthlyRevenue
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Active Repair Orders
            </div>

            <div className="mt-3 text-4xl font-bold text-cyan-300">
              {activeRepairOrders}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Dispatch Activity
            </div>

            <div className="mt-3 text-4xl font-bold text-cyan-300">
              {activeDispatchJobs}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Technicians Online
            </div>

            <div className="mt-3 text-4xl font-bold text-emerald-300">
              {techniciansOnline}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}