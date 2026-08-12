import type { RepairOrderActionItem } from "@/types/repair-orders";

type RepairOrderActionItemCardProps = {
  actionItem: RepairOrderActionItem;
  onEdit?: (actionItem: RepairOrderActionItem) => void;
  onDelete?: (actionItem: RepairOrderActionItem) => void;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getWorkflowStatus = (actionItem: RepairOrderActionItem) => {
  if (actionItem.clockInDateTime && actionItem.clockOutDateTime) {
    return "Clocked Out";
  }

  if (actionItem.clockInDateTime) {
    return "Clocked In";
  }

  return "Not Started";
};

export default function RepairOrderActionItemCard({
  actionItem,
  onEdit,
  onDelete,
}: RepairOrderActionItemCardProps) {
  const beforePhotoCount = actionItem.beforePhotoUrls?.length ?? 0;
  const afterPhotoCount = actionItem.afterPhotoUrls?.length ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {actionItem.type}
            </div>

            <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              {actionItem.status}
            </div>

            <div className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {getWorkflowStatus(actionItem)}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white">
            {actionItem.title}
          </h3>

          {actionItem.description && (
            <p className="text-sm leading-6 text-white/70">
              {actionItem.description}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Total
          </div>

          <div className="text-xl font-bold text-white">
            {formatCurrency(actionItem.total ?? 0)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Assigned Tech
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.assignedTechnicianName ?? "Unassigned"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Clock In
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {formatDateTime(actionItem.clockInDateTime)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Clock Out
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {formatDateTime(actionItem.clockOutDateTime)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Method
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.timeClockMethod ?? "Not set"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Serial Plate
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.serialPlatePhotoUrl ? "Captured" : "Missing"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Before Photos
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {beforePhotoCount}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            After Photos
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {afterPhotoCount}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Signature
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.customerSignatureUrl ? "Captured" : "Missing"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Labor Hours
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.laborHours ?? 0}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Labor Total
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {formatCurrency(actionItem.laborTotal ?? 0)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Parts Total
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {formatCurrency(actionItem.partsTotal ?? 0)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">
            Billing Group
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {actionItem.billingGroup}
          </div>
        </div>
      </div>

      {actionItem.completionNotes && (
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="mb-1 text-xs uppercase tracking-wide text-emerald-200/70">
            Completion Notes
          </div>

          <div className="text-sm leading-6 text-emerald-50">
            {actionItem.completionNotes}
          </div>
        </div>
      )}

      {actionItem.notes && (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-1 text-xs uppercase tracking-wide text-white/50">
            Notes
          </div>

          <div className="text-sm leading-6 text-white/80">
            {actionItem.notes}
          </div>
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-5 flex justify-end gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(actionItem)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(actionItem)}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}