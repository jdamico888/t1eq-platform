import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";

type ActiveInspection = {
  id: string;

  inspectionNumber: string;

  customerName: string;

  equipmentName: string;

  inspectorName?: string;

  status: string;

  inspectionDate?: string;
};

type ActiveInspectionsPanelProps = {
  inspections: ActiveInspection[];
};

export default function ActiveInspectionsPanel({
  inspections,
}: ActiveInspectionsPanelProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Active Inspections
        </h2>

        <div className="text-sm text-slate-400">
          {inspections.length} Active
        </div>
      </div>

      <div className="space-y-4">
        {inspections.length === 0 && (
          <div className="text-sm text-slate-400">
            No active inspections.
          </div>
        )}

        {inspections.map((inspection) => (
          <Link
            key={inspection.id}
            href={`/inspections/${inspection.id}`}
            className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-cyan-300">
                  {inspection.inspectionNumber}
                </div>

                <div className="mt-1 text-sm">
                  {inspection.customerName}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {inspection.equipmentName}
                </div>

                {inspection.inspectorName && (
                  <div className="mt-2 text-xs text-slate-500">
                    Inspector: {inspection.inspectorName}
                  </div>
                )}

                {inspection.inspectionDate && (
                  <div className="mt-1 text-xs text-slate-500">
                    {inspection.inspectionDate}
                  </div>
                )}
              </div>

              <StatusBadge status={inspection.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}