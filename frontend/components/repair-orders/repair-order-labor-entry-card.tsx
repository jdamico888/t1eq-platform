import type { RepairOrderLaborEntry } from "@/types/repair-orders";

type RepairOrderLaborEntryCardProps = {
  laborEntry: RepairOrderLaborEntry;
  onDelete?: (laborEntry: RepairOrderLaborEntry) => void;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function RepairOrderLaborEntryCard({
  laborEntry,
  onDelete,
}: RepairOrderLaborEntryCardProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">
            {laborEntry.technicianName || "Unassigned Technician"}
          </div>

          <div className="mt-1 text-xs uppercase tracking-wide text-white/50">
            {laborEntry.laborType} • {laborEntry.rateSource}
          </div>

          {laborEntry.rateProfileName && (
            <div className="mt-1 text-xs text-white/50">
              Rate Profile: {laborEntry.rateProfileName}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-white">
            {formatCurrency(laborEntry.total)}
          </div>

          <div className="text-xs text-white/50">
            {laborEntry.hours} hrs @ {formatCurrency(laborEntry.laborRate)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Manufacturer
          </div>

          <div className="mt-1 text-sm text-white">
            {laborEntry.manufacturer || "Not set"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Billable
          </div>

          <div className="mt-1 text-sm text-white">
            {laborEntry.billable ? "Yes" : "No"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Mileage Rate
          </div>

          <div className="mt-1 text-sm text-white">
            {laborEntry.mileageRate !== undefined
              ? formatCurrency(laborEntry.mileageRate)
              : "Not set"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Created
          </div>

          <div className="mt-1 text-sm text-white">
            {new Date(laborEntry.createdDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {laborEntry.notes && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Notes
          </div>

          <div className="mt-1 text-sm leading-6 text-white/80">
            {laborEntry.notes}
          </div>
        </div>
      )}

      {onDelete && (
        <div className="mt-4 flex justify-end">
          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => onDelete(laborEntry)}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
          >
            Delete Labor
          </button>
        </div>
      )}
    </div>
  );
}