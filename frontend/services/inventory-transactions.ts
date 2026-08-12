import {
  InventoryTransaction,
} from "../types/inventory-transaction";

const STORAGE_KEY =
  "t1eq-inventory-transactions";

export function getInventoryTransactions():
InventoryTransaction[] {

  if (
    typeof window ===
    "undefined"
  ) {

    return [];
  }

  const data =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!data) {

    return [];
  }

  return JSON.parse(data);
}

export function saveInventoryTransactions(
  transactions:
  InventoryTransaction[]
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      transactions
    )
  );
}

export function createInventoryTransaction(
  transaction:
  InventoryTransaction
) {

  const transactions =
    getInventoryTransactions();

  transactions.unshift(
    transaction
  );

  saveInventoryTransactions(
    transactions
  );
}

export function getTransactionsByInventoryItem(
  inventoryItemId: string
) {

  const transactions =
    getInventoryTransactions();

  return transactions.filter(
    (
      transaction
    ) =>

      transaction.inventoryItemId ===
      inventoryItemId
  );
}

export function getTransactionsByReference(
  referenceId: string
) {

  const transactions =
    getInventoryTransactions();

  return transactions.filter(
    (
      transaction
    ) =>

      transaction.referenceId ===
      referenceId
  );
}

export function deleteInventoryTransaction(
  id: string
) {

  const transactions =
    getInventoryTransactions();

  const filteredTransactions =
    transactions.filter(
      (
        transaction
      ) =>

        transaction.id !== id
    );

  saveInventoryTransactions(
    filteredTransactions
  );
}