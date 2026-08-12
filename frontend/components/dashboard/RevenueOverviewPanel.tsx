type RevenueOverviewPanelProps = {
  monthlyRevenue: number;

  outstandingRevenue: number;

  paidRevenue: number;

  invoiceCount: number;
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

export default function RevenueOverviewPanel({
  monthlyRevenue,
  outstandingRevenue,
  paidRevenue,
  invoiceCount,
}: RevenueOverviewPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Revenue Overview
        </h2>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {invoiceCount} Invoices
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Monthly Revenue
          </div>

          <div className="mt-3 text-3xl font-bold text-emerald-300">
            {formatCurrency(
              monthlyRevenue
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Outstanding
          </div>

          <div className="mt-3 text-3xl font-bold text-amber-300">
            {formatCurrency(
              outstandingRevenue
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Paid Revenue
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {formatCurrency(
              paidRevenue
            )}
          </div>
        </div>
      </div>
    </div>
  );
}