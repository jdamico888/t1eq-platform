import type {
  RepairOrderActionItem,
  RepairOrderLaborEntry,
  RepairOrderPartEntry,
} from "@/types/repair-orders";

import { consumeInventory, restoreInventory } from "@/services/inventory";

import {
  consumeTruckStock,
  getTruckStockItem,
  getTruckById,
  restoreTruckStock,
} from "@/services/truck-stock";

import RepairOrderActionItemCard from "./repair-order-action-item-card";
import RepairOrderActionItemExecution from "./repair-order-action-item-execution";
import RepairOrderLaborEntries from "./repair-order-labor-entries";
import RepairOrderLaborEntryForm from "./repair-order-labor-entry-form";
import RepairOrderPartEntries from "./repair-order-part-entries";
import RepairOrderPartEntryForm from "./repair-order-part-entry-form";

type RepairOrderActionItemsProps = {
  actionItems: RepairOrderActionItem[];
  assignedTruckId?: string;
  onEdit?: (actionItem: RepairOrderActionItem) => void;
  onDelete?: (actionItem: RepairOrderActionItem) => void;
  onUpdate?: (actionItem: RepairOrderActionItem) => void;
};

const calculateLaborTotal = (
  laborEntries: RepairOrderLaborEntry[]
): number => {
  return laborEntries.reduce(
    (total, laborEntry) => total + laborEntry.total,
    0
  );
};

const calculatePartsTotal = (
  partEntries: RepairOrderPartEntry[]
): number => {
  return partEntries.reduce(
    (total, partEntry) => total + partEntry.total,
    0
  );
};

const calculateLaborHours = (
  laborEntries: RepairOrderLaborEntry[]
): number => {
  return laborEntries.reduce(
    (total, laborEntry) => total + laborEntry.hours,
    0
  );
};

function formatActionItemSchedule(actionItem: RepairOrderActionItem): string {
  if (
    !actionItem.scheduledDate &&
    !actionItem.scheduledStartTime &&
    !actionItem.scheduledEndTime
  ) {
    return "No schedule window set";
  }

  const date = actionItem.scheduledDate || "No date";

  if (actionItem.scheduledStartTime && actionItem.scheduledEndTime) {
    return `${date} · ${actionItem.scheduledStartTime} - ${actionItem.scheduledEndTime}`;
  }

  return date;
}

function RepairOrderActionItemAssignmentSummary({
  actionItem,
}: {
  actionItem: RepairOrderActionItem;
}) {
  const hasAssignedEmployee = Boolean(actionItem.assignedEmployeeDisplayName);
  const hasScheduleWindow = Boolean(
    actionItem.scheduledDate ||
      actionItem.scheduledStartTime ||
      actionItem.scheduledEndTime
  );

  if (!hasAssignedEmployee && !hasScheduleWindow) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-200">
        Schedule / Assignment
      </div>

      <div className="mt-3 grid gap-3 text-sm font-semibold text-orange-50 md:grid-cols-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-orange-100/60">
            Assigned Employee
          </div>
          <div className="mt-1">
            {actionItem.assignedEmployeeDisplayName ?? "Unassigned"}
          </div>
          {actionItem.assignedEmployeeRole && (
            <div className="mt-1 text-xs text-orange-100/60">
              {actionItem.assignedEmployeeRole}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide text-orange-100/60">
            Scheduled Window
          </div>
          <div className="mt-1">{formatActionItemSchedule(actionItem)}</div>
        </div>
      </div>
    </div>
  );
}

export default function RepairOrderActionItems({
  actionItems,
  assignedTruckId,
  onEdit,
  onDelete,
  onUpdate,
}: RepairOrderActionItemsProps) {
  if (actionItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <div className="text-lg font-semibold text-white">
          No Action Items
        </div>

        <div className="mt-2 text-sm text-white/60">
          Repair order action items will appear here.
        </div>
      </div>
    );
  }

  function recalculateActionItem(
    actionItem: RepairOrderActionItem,
    laborEntries: RepairOrderLaborEntry[] = actionItem.laborEntries ?? [],
    partEntries: RepairOrderPartEntry[] = actionItem.partEntries ?? []
  ): RepairOrderActionItem {
    const laborTotal = calculateLaborTotal(laborEntries);
    const partsTotal = calculatePartsTotal(partEntries);
    const laborHours = calculateLaborHours(laborEntries);

    return {
      ...actionItem,
      laborEntries,
      partEntries,
      laborHours,
      laborTotal,
      partsTotal,
      total: laborTotal + partsTotal,
      updatedDate: new Date().toISOString(),
    };
  }

  function handleAddLaborEntry(
    actionItem: RepairOrderActionItem,
    laborEntry: RepairOrderLaborEntry
  ) {
    const laborEntries = [
      ...(actionItem.laborEntries ?? []),
      laborEntry,
    ];

    onUpdate?.(
      recalculateActionItem(
        actionItem,
        laborEntries,
        actionItem.partEntries ?? []
      )
    );
  }

  function handleDeleteLaborEntry(
    actionItem: RepairOrderActionItem,
    laborEntry: RepairOrderLaborEntry
  ) {
    const laborEntries = (actionItem.laborEntries ?? []).filter(
      (item) => item.id !== laborEntry.id
    );

    onUpdate?.(
      recalculateActionItem(
        actionItem,
        laborEntries,
        actionItem.partEntries ?? []
      )
    );
  }

  function applyInventoryConsumption(
    partEntry: RepairOrderPartEntry
  ): RepairOrderPartEntry {
    if (!partEntry.inventoryItemId) {
      return {
        ...partEntry,
        sourceStockLocation: "Manual",
      };
    }

    if (assignedTruckId) {
      const truckStockItem = getTruckStockItem(
        assignedTruckId,
        partEntry.inventoryItemId
      );

      const assignedTruck = getTruckById(assignedTruckId);

      if (
        truckStockItem &&
        truckStockItem.quantityOnTruck >= partEntry.quantity
      ) {
        consumeTruckStock(
          assignedTruckId,
          partEntry.inventoryItemId,
          partEntry.quantity
        );

        return {
          ...partEntry,
          sourceStockLocation: "Truck",
          sourceTruckId: assignedTruckId,
          sourceTruckName:
            assignedTruck?.name ?? truckStockItem.truckName,
        };
      }
    }

    consumeInventory(partEntry.inventoryItemId, partEntry.quantity);

    return {
      ...partEntry,
      sourceStockLocation: "Warehouse",
    };
  }

  function restoreInventorySource(partEntry: RepairOrderPartEntry) {
    if (!partEntry.inventoryItemId) {
      return;
    }

    if (
      partEntry.sourceStockLocation === "Truck" &&
      partEntry.sourceTruckId
    ) {
      restoreTruckStock(
        partEntry.sourceTruckId,
        partEntry.inventoryItemId,
        partEntry.quantity
      );

      return;
    }

    if (partEntry.sourceStockLocation === "Warehouse") {
      restoreInventory(partEntry.inventoryItemId, partEntry.quantity);
    }
  }

  function handleAddPartEntry(
    actionItem: RepairOrderActionItem,
    partEntry: RepairOrderPartEntry
  ) {
    const consumedPartEntry = applyInventoryConsumption(partEntry);

    const partEntries = [
      ...(actionItem.partEntries ?? []),
      consumedPartEntry,
    ];

    onUpdate?.(
      recalculateActionItem(
        actionItem,
        actionItem.laborEntries ?? [],
        partEntries
      )
    );
  }

  function handleDeletePartEntry(
    actionItem: RepairOrderActionItem,
    partEntry: RepairOrderPartEntry
  ) {
    restoreInventorySource(partEntry);

    const partEntries = (actionItem.partEntries ?? []).filter(
      (item) => item.id !== partEntry.id
    );

    onUpdate?.(
      recalculateActionItem(
        actionItem,
        actionItem.laborEntries ?? [],
        partEntries
      )
    );
  }

  return (
    <div className="space-y-8">
      {actionItems.map((actionItem) => (
        <div
          key={actionItem.id}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4"
        >
          <RepairOrderActionItemCard
            actionItem={actionItem}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          <RepairOrderActionItemAssignmentSummary actionItem={actionItem} />

          <RepairOrderActionItemExecution
            actionItem={actionItem}
            onUpdate={(updatedActionItem) => {
              onUpdate?.(updatedActionItem);
            }}
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xl font-bold text-white">
              Labor Entries
            </h3>

            <div className="mt-4">
              <RepairOrderLaborEntries
                laborEntries={actionItem.laborEntries ?? []}
                onDelete={(laborEntry) =>
                  handleDeleteLaborEntry(actionItem, laborEntry)
                }
              />
            </div>

            <div className="mt-5">
              <RepairOrderLaborEntryForm
                onSubmit={(laborEntry) =>
                  handleAddLaborEntry(actionItem, laborEntry)
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xl font-bold text-white">
              Parts Entries
            </h3>

            {assignedTruckId && (
              <p className="mt-1 text-sm text-white/60">
                This repair order has an assigned truck. Linked inventory parts
                will consume truck stock first when available, then fall back to
                warehouse inventory.
              </p>
            )}

            <div className="mt-4">
              <RepairOrderPartEntries
                partEntries={actionItem.partEntries ?? []}
                onDelete={(partEntry) =>
                  handleDeletePartEntry(actionItem, partEntry)
                }
              />
            </div>

            <div className="mt-5">
              <RepairOrderPartEntryForm
                onSubmit={(partEntry) =>
                  handleAddPartEntry(actionItem, partEntry)
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}