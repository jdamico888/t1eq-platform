import type { RepairOrderPartEntry } from "@/types/repair-orders";

type RepairOrderPartEntryCardProps = {
  partEntry: RepairOrderPartEntry;
  onDelete?: (partEntry: RepairOrderPartEntry) => void;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getSourceLabel = (partEntry: RepairOrderPartEntry) => {
  if (partEntry.sourceStockLocation === "Truck") {
    return partEntry.sourceTruckName
      ? `Truck Stock — ${partEntry.sourceTruckName}`
      : "Truck Stock";
  }

  if (partEntry.sourceStockLocation === "Warehouse") {
    return "Warehouse Stock";
  }

  if (partEntry.sourceStockLocation === "Manual") {
    return "Manual / Non-Inventory";
  }

  return partEntry.inventoryItemId ? "Inventory Linked" : "Manual / Non-Inventory";
};

export default function RepairOrderPartEntryCard({
  partEntry,
  onDelete,
}: RepairOrderPartEntryCardProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          {partEntry.partImageUrl && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <img
                src={partEntry.partImageUrl}
                alt={partEntry.description || partEntry.partNumber}
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-white">
              {partEntry.partNumber}
            </div>

            <div className="mt-1 text-sm text-white/70">
              {partEntry.description}
            </div>

            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-2 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
              {getSourceLabel(partEntry)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-white">
            {formatCurrency(partEntry.total)}
          </div>

          <div className="text-xs text-white/50">
            Qty {partEntry.quantity} @ {formatCurrency(partEntry.sellPrice)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Cost
          </div>

          <div className="mt-1 text-sm text-white">
            {formatCurrency(partEntry.cost)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Sell Price
          </div>

          <div className="mt-1 text-sm text-white">
            {formatCurrency(partEntry.sellPrice)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Inventory Item
          </div>

          <div className="mt-1 text-sm text-white">
            {partEntry.inventoryItemId ?? "Not linked"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Source
          </div>

          <div className="mt-1 text-sm text-white">
            {getSourceLabel(partEntry)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Created
          </div>

          <div className="mt-1 text-sm text-white">
            {new Date(partEntry.createdDate).toLocaleDateString()}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Source Location
          </div>

          <div className="mt-1 text-sm text-white">
            {partEntry.sourceStockLocation ?? "Not recorded"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Source Truck
          </div>

          <div className="mt-1 text-sm text-white">
            {partEntry.sourceTruckName ?? "N/A"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Source Truck ID
          </div>

          <div className="mt-1 text-sm text-white">
            {partEntry.sourceTruckId ?? "N/A"}
          </div>
        </div>
      </div>

      {partEntry.notes && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Notes
          </div>

          <div className="mt-1 text-sm leading-6 text-white/80">
            {partEntry.notes}
          </div>
        </div>
      )}

      {onDelete && (
        <div className="mt-4 flex justify-end">
          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => onDelete(partEntry)}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
          >
            Delete Part
          </button>
        </div>
      )}
    </div>
  );
}