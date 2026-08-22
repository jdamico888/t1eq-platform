import type { RepairOrder } from "@/types/repair-orders";

import { calculateRepairOrderDispatchReadiness } from "@/services/repair-order-dispatch-readiness";

type RepairOrderDispatchReadinessPanelProps = {
  repairOrder: RepairOrder;
};

const severityStyles = {
  Info: "border-blue-400/30 bg-blue-500/10 text-blue-100",
  Warning: "border-yellow-400/30 bg-yellow-500/10 text-yellow-100",
  Blocking: "border-red-400/30 bg-red-500/10 text-red-100",
};

export default function RepairOrderDispatchReadinessPanel({
  repairOrder,
}: RepairOrderDispatchReadinessPanelProps) {
  const readiness = calculateRepairOrderDispatchReadiness(repairOrder);

  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Dispatch Readiness</h2>

          <p className="mt-1 text-sm text-white/60">
            Operational readiness checks before sending this repair order to the
            field.
          </p>
        </div>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            readiness.isReadyForDispatch
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          }`}
        >
          {readiness.isReadyForDispatch
            ? "Ready for Dispatch"
            : "Not Ready"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Blocking Issues
          </div>

          <div className="mt-1 text-2xl font-bold text-white">
            {readiness.blockingIssueCount}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Warnings
          </div>

          <div className="mt-1 text-2xl font-bold text-white">
            {readiness.warningIssueCount}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Dispatch Status
          </div>

          <div className="mt-1 text-2xl font-bold text-white">
            {readiness.isReadyForDispatch ? "Ready" : "Hold"}
          </div>
        </div>
      </div>

      {readiness.issues.length > 0 && (
        <div className="mt-5 space-y-3">
          {readiness.issues.map((issue) => (
            <div
              key={issue.id}
              className={`rounded-2xl border p-4 text-sm font-medium ${
                severityStyles[issue.severity]
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {issue.severity}
              </div>

              <div className="mt-1">{issue.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}