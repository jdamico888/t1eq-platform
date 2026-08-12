import {
  ActionItem,
} from "../types/action-item";

const STORAGE_KEY = "t1eq-action-items";

export function getActionItems(): ActionItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedActionItems =
    localStorage.getItem(STORAGE_KEY);

  if (!savedActionItems) {
    return [];
  }

  return JSON.parse(savedActionItems);
}

export function saveActionItems(
  actionItems: ActionItem[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(actionItems)
  );
}

export function createActionItem(
  actionItem: ActionItem
) {
  const actionItems =
    getActionItems();

  saveActionItems([
    actionItem,
    ...actionItems,
  ]);
}

export function updateActionItem(
  updatedActionItem: ActionItem
) {
  const actionItems =
    getActionItems();

  const updatedActionItems =
    actionItems.map((actionItem) =>
      actionItem.id === updatedActionItem.id
        ? updatedActionItem
        : actionItem
    );

  saveActionItems(
    updatedActionItems
  );
}

export function deleteActionItem(
  actionItemId: string
) {
  const actionItems =
    getActionItems();

  const updatedActionItems =
    actionItems.filter(
      (actionItem) =>
        actionItem.id !== actionItemId
    );

  saveActionItems(
    updatedActionItems
  );
}

export function getActionItemById(
  actionItemId: string
) {
  const actionItems =
    getActionItems();

  return actionItems.find(
    (actionItem) =>
      actionItem.id === actionItemId
  );
}

export function getActionItemsByRepairOrder(
  repairOrderId: string
) {
  const actionItems =
    getActionItems();

  return actionItems.filter(
    (actionItem) =>
      actionItem.repairOrderId === repairOrderId
  );
}

export function getOpenActionItemsByRepairOrder(
  repairOrderId: string
) {
  const actionItems =
    getActionItemsByRepairOrder(
      repairOrderId
    );

  return actionItems.filter(
    (actionItem) =>
      actionItem.status !== "Completed"
  );
}