type ExecutiveSummaryPanelProps = {
  monthlyRevenue: number;

  openRepairOrders: number;

  activeDispatchJobs: number;

  pendingInspections: number;

  overdueInvoices: number;

  lowInventoryItems: number;
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

export default function ExecutiveSummaryPanel({
  monthlyRevenue,
  openRepairOrders,
  activeDispatchJobs,
  pendingInspections,
  overdueInvoices,
  lowInventoryItems,
}: ExecutiveSummaryPanelProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Executive Summary
          </div>

          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            Operational Performance
          </h2>

          <p className="mt-3 max-w-3xl text-slate-400">
            Enterprise overview of service operations,
            inspections, dispatch workload, inventory,
            and revenue performance.
          </p>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-5">
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Open RO
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {openRepairOrders}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Dispatch
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {activeDispatchJobs}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Inspections
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {pendingInspections}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Overdue
          </div>

          <div className="mt-3 text-3xl font-bold text-amber-300">
            {overdueInvoices}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Low Stock
          </div>

          <div className="mt-3 text-3xl font-bold text-red-300">
            {lowInventoryItems}
          </div>
        </div>
      </div>
    </div>
  );
}