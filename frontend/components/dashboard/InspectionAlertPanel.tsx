import StatusBadge from "@/components/ui/StatusBadge";

type InspectionAlert = {
  id: string;
  inspectionNumber: string;
  customerName: string;
  equipmentName: string;
  status: string;
  nextInspectionDate?: string;
};

type InspectionAlertPanelProps = {
  inspections: InspectionAlert[];
};

export default function InspectionAlertPanel({
  inspections,
}: InspectionAlertPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Inspection Alerts</h2>

        <div className="text-sm text-slate-400">
          {inspections.length} Items
        </div>
      </div>

      <div className="space-y-4">
        {inspections.length === 0 && (
          <div className="text-sm text-slate-400">
            No inspection alerts.
          </div>
        )}

        {inspections.map((inspection) => (
          <div
            key={inspection.id}
            className="rounded-2xl border border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {inspection.inspectionNumber}
                </div>

                <div className="mt-1 text-sm">
                  {inspection.customerName}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {inspection.equipmentName}
                </div>

                {inspection.nextInspectionDate && (
                  <div className="mt-1 text-xs text-slate-500">
                    Next Due: {inspection.nextInspectionDate}
                  </div>
                )}
              </div>

              <StatusBadge status={inspection.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}