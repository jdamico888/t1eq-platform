import type { RepairOrder } from "@/types/repair-orders";

type RepairOrderSummaryProps = {
  repairOrder: RepairOrder;
};

export default function RepairOrderSummary({
  repairOrder,
}: RepairOrderSummaryProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Customer Concern</h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {repairOrder.customerConcern || repairOrder.complaint || "No concern recorded."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Equipment Summary</h2>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">
              Equipment
            </div>

            <div className="mt-1 text-sm font-semibold text-white">
              {repairOrder.equipmentName}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">
              Description
            </div>

            <div className="mt-1 text-sm text-white/70">
              {repairOrder.equipmentDescription || "No description recorded."}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">
              Site
            </div>

            <div className="mt-1 text-sm text-white/70">
              {repairOrder.siteName || "Primary customer location"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Initial Findings</h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {repairOrder.initialFindings ||
            repairOrder.diagnosis ||
            "No findings recorded."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Work Performed</h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {repairOrder.workPerformed ||
            repairOrder.resolution ||
            "No work performed recorded."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Recommendations</h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {repairOrder.recommendations || "No recommendations recorded."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Internal Notes</h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {repairOrder.notes || "No internal notes recorded."}
        </p>
      </div>
    </div>
  );
}