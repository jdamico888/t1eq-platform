import {
  PartEntry,
} from "../types/part-entry";

import {
  ActionItem,
} from "../types/action-item";

import {
  getActionItems,
} from "./action-items";

const STORAGE_KEY = "t1eq-part-entries";

export function getPartEntries(): PartEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedPartEntries =
    localStorage.getItem(STORAGE_KEY);

  if (!savedPartEntries) {
    return [];
  }

  return JSON.parse(savedPartEntries);
}

export function savePartEntries(
  partEntries: PartEntry[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(partEntries)
  );
}

export function createPartEntry(
  partEntry: PartEntry
) {
  const partEntries =
    getPartEntries();

  savePartEntries([
    partEntry,
    ...partEntries,
  ]);
}

export function updatePartEntry(
  updatedPartEntry: PartEntry
) {
  const partEntries =
    getPartEntries();

  const updatedPartEntries =
    partEntries.map((partEntry) =>
      partEntry.id === updatedPartEntry.id
        ? updatedPartEntry
        : partEntry
    );

  savePartEntries(
    updatedPartEntries
  );
}

export function deletePartEntry(
  partEntryId: string
) {
  const partEntries =
    getPartEntries();

  const updatedPartEntries =
    partEntries.filter(
      (partEntry) =>
        partEntry.id !== partEntryId
    );

  savePartEntries(
    updatedPartEntries
  );
}

export function getPartEntryById(
  partEntryId: string
) {
  const partEntries =
    getPartEntries();

  return partEntries.find(
    (partEntry) =>
      partEntry.id === partEntryId
  );
}

export function getPartEntriesByActionItem(
  actionItemId: string
) {
  const partEntries =
    getPartEntries();

  return partEntries.filter(
    (partEntry) =>
      partEntry.actionItemId === actionItemId
  );
}

export function getPartEntriesByRepairOrder(
  repairOrderId: string
) {
  const partEntries =
    getPartEntries();

  const actionItems =
    getActionItems();

  const repairOrderActionItems =
    actionItems.filter(
      (actionItem: ActionItem) =>
        actionItem.repairOrderId === repairOrderId
    );

  const actionItemIds =
    repairOrderActionItems.map(
      (actionItem) => actionItem.id
    );

  return partEntries.filter(
    (partEntry) =>
      actionItemIds.includes(
        partEntry.actionItemId
      )
  );
}

export function getTotalPartsRevenue() {
  const partEntries =
    getPartEntries();

  return partEntries.reduce(
    (total, partEntry) =>
      total + partEntry.total,
    0
  );
}

export function getTotalPartsCost() {
  const partEntries =
    getPartEntries();

  return partEntries.reduce(
    (total, partEntry) =>
      total +
      partEntry.quantity *
        partEntry.cost,
    0
  );
}