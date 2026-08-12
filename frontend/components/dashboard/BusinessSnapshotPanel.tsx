type BusinessSnapshotPanelProps = {
  totalCustomers: number;

  totalEquipment: number;

  totalRepairOrders: number;

  totalInvoices: number;

  totalTechnicians: number;

  totalInspections: number;
};

export default function BusinessSnapshotPanel({
  totalCustomers,
  totalEquipment,
  totalRepairOrders,
  totalInvoices,
  totalTechnicians,
  totalInspections,
}: BusinessSnapshotPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-cyan-500/5 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          Business Snapshot
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          High-level operational overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Customers
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalCustomers}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Equipment
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalEquipment}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Repair Orders
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalRepairOrders}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Invoices
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalInvoices}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Technicians
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalTechnicians}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Inspections
          </div>

          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {totalInspections}
          </div>
        </div>
      </div>
    </div>
  );
}