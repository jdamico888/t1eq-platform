import type { RepairOrder } from "@/types/repair-orders";

import {
  calculateRepairOrderFinancialSummary,
  formatCurrency,
} from "@/services/repair-order-financials";

type RepairOrderBillingSummaryProps = {
  repairOrder: RepairOrder;
};

export default function RepairOrderBillingSummary({
  repairOrder,
}: RepairOrderBillingSummaryProps) {
  const financialSummary = calculateRepairOrderFinancialSummary(repairOrder);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Billing Summary</h2>

        <p className="mt-1 text-sm text-white/60">
          Financial totals grouped from repair order action items.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Inspection Charges
          </div>

          <div className="mt-1 text-xl font-bold text-white">
            {formatCurrency(financialSummary.inspectionCharges)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Repair Charges
          </div>

          <div className="mt-1 text-xl font-bold text-white">
            {formatCurrency(financialSummary.repairCharges)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Parts Charges
          </div>

          <div className="mt-1 text-xl font-bold text-white">
            {formatCurrency(financialSummary.partsCharges)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Other Charges
          </div>

          <div className="mt-1 text-xl font-bold text-white">
            {formatCurrency(financialSummary.otherCharges)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Labor Total
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {formatCurrency(financialSummary.laborTotal)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Parts Total
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {formatCurrency(financialSummary.partsTotal)}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
          <div className="text-xs uppercase tracking-wide text-blue-200/70">
            Subtotal
          </div>

          <div className="mt-1 text-2xl font-bold text-blue-100">
            {formatCurrency(financialSummary.subtotal)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Billable Items
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {financialSummary.billableActionItemCount} /{" "}
            {financialSummary.actionItemCount}
          </div>
        </div>
      </div>
    </section>
  );
}