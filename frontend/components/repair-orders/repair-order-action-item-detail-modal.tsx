"use client";

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

type RepairOrderActionItemDetailModalProps = {
  isOpen: boolean;
  actionItem: RepairOrderActionItem | null;
  assignedTruckId?: string;
  onClose: () => void;
  onEditDetails?: (actionItem: RepairOrderActionItem) => void;
  onDelete?: (actionItem: RepairOrderActionItem) => void;
  onUpdate: (actionItem: RepairOrderActionItem) => void;
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
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
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

const calculateLaborTotal = (laborEntries: RepairOrderLaborEntry[]): number => {
  return laborEntries.reduce((total, laborEntry) => total + laborEntry.total, 0);
};

const calculatePartsTotal = (partEntries: RepairOrderPartEntry[]): number => {
  return partEntries.reduce((total, partEntry) => total + partEntry.total, 0);
};

const calculateLaborHours = (laborEntries: RepairOrderLaborEntry[]): number => {
  return laborEntries.reduce((total, laborEntry) => total + laborEntry.hours, 0);
};

function getGeneratedTravelTotal(actionItem: RepairOrderActionItem): number {
  if (actionItem.generatedTravelTotal !== undefined) {
    return actionItem.generatedTravelTotal;
  }

  return (
    (actionItem.generatedTravelMiles ?? 0) *
    (actionItem.generatedTravelRate ?? 0)
  );
}

export default function RepairOrderActionItemDetailModal({
  isOpen,
  actionItem,
  assignedTruckId,
  onClose,
  onEditDetails,
  onDelete,
  onUpdate,
}: RepairOrderActionItemDetailModalProps) {
  if (!isOpen || !actionItem) return null;

  function handleEditDetails(item: RepairOrderActionItem) {
    onEditDetails?.(item);
    onClose();
  }

  function recalculateActionItem(
    current: RepairOrderActionItem,
    laborEntries: RepairOrderLaborEntry[] = current.laborEntries ?? [],
    partEntries: RepairOrderPartEntry[] = current.partEntries ?? []
  ): RepairOrderActionItem {
    const generatedTravelTotal = getGeneratedTravelTotal(current);
    const generatedMiscTotal = current.generatedMiscTotal ?? 0;

    const laborTotal =
      laborEntries.length > 0
        ? calculateLaborTotal(laborEntries)
        : current.generatedLaborTotal ?? current.laborTotal ?? 0;

    const partsTotal =
      partEntries.length > 0
        ? calculatePartsTotal(partEntries)
        : current.generatedPartsTotal ?? current.partsTotal ?? 0;

    const laborHours =
      laborEntries.length > 0
        ? calculateLaborHours(laborEntries)
        : current.generatedLaborHours ?? current.laborHours ?? 0;

    return {
      ...current,
      laborEntries,
      partEntries,
      laborHours,
      laborTotal,
      partsTotal,
      total: laborTotal + partsTotal + generatedTravelTotal + generatedMiscTotal,
      updatedDate: new Date().toISOString(),
    };
  }

  function handleAddLaborEntry(laborEntry: RepairOrderLaborEntry) {
    if (!actionItem) return;

    const laborEntries = [...(actionItem.laborEntries ?? []), laborEntry];

    onUpdate(
      recalculateActionItem(actionItem, laborEntries, actionItem.partEntries ?? [])
    );
  }

  function handleDeleteLaborEntry(laborEntry: RepairOrderLaborEntry) {
    if (!actionItem) return;

    const laborEntries = (actionItem.laborEntries ?? []).filter(
      (item) => item.id !== laborEntry.id
    );

    onUpdate(
      recalculateActionItem(actionItem, laborEntries, actionItem.partEntries ?? [])
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
          sourceTruckName: assignedTruck?.name ?? truckStockItem.truckName,
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

    if (partEntry.sourceStockLocation === "Truck" && partEntry.sourceTruckId) {
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

  function handleAddPartEntry(partEntry: RepairOrderPartEntry) {
    if (!actionItem) return;

    const consumedPartEntry = applyInventoryConsumption(partEntry);

    const partEntries = [...(actionItem.partEntries ?? []), consumedPartEntry];

    onUpdate(
      recalculateActionItem(actionItem, actionItem.laborEntries ?? [], partEntries)
    );
  }

  function handleDeletePartEntry(partEntry: RepairOrderPartEntry) {
    if (!actionItem) return;

    restoreInventorySource(partEntry);

    const partEntries = (actionItem.partEntries ?? []).filter(
      (item) => item.id !== partEntry.id
    );

    onUpdate(
      recalculateActionItem(actionItem, actionItem.laborEntries ?? [], partEntries)
    );
  }

  return (
    <div
      data-t1eq-fixed-contrast="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div data-t1eq-tile="true" data-t1eq-page-card="true" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Action Item
            </div>

            <h2 className="mt-2 text-3xl font-bold text-white">
              {actionItem.title}
            </h2>
          </div>

          <button data-t1eq-action-button="true"
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="space-y-6">
          <RepairOrderActionItemCard
            actionItem={actionItem}
            onEdit={onEditDetails ? handleEditDetails : undefined}
            onDelete={
              onDelete
                ? (item) => {
                    onDelete(item);
                    onClose();
                  }
                : undefined
            }
          />

          <RepairOrderActionItemAssignmentSummary actionItem={actionItem} />

          <RepairOrderActionItemExecution
            actionItem={actionItem}
            onUpdate={onUpdate}
          />

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xl font-bold text-white">Labor Entries</h3>

            <div className="mt-4">
              <RepairOrderLaborEntries
                laborEntries={actionItem.laborEntries ?? []}
                onDelete={handleDeleteLaborEntry}
              />
            </div>

            <div className="mt-5">
              <RepairOrderLaborEntryForm onSubmit={handleAddLaborEntry} />
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xl font-bold text-white">Parts Entries</h3>

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
                onDelete={handleDeletePartEntry}
              />
            </div>

            <div className="mt-5">
              <RepairOrderPartEntryForm onSubmit={handleAddPartEntry} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
