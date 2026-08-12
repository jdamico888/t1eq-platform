export type TruckStockTransactionType =
  | "Load"
  | "Unload"
  | "Consumption"
  | "Restoration"
  | "Adjustment";

export type TruckStockTransaction = {
  id: string;

  truckId: string;
  truckName: string;

  inventoryItemId: string;

  partNumber: string;
  description: string;

  type: TruckStockTransactionType;

  quantity: number;

  previousQuantity: number;
  newQuantity: number;

  referenceId?: string;

  notes?: string;

  createdDate: string;
  createdBy?: string;
};

const STORAGE_KEY = "t1eq-truck-stock-transactions";

export const getTruckStockTransactions = (): TruckStockTransaction[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data) as TruckStockTransaction[];
  } catch (error) {
    console.error("Failed to parse truck stock transactions.", error);

    return [];
  }
};

export const saveTruckStockTransactions = (
  transactions: TruckStockTransaction[]
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

export const createTruckStockTransaction = (
  transaction: TruckStockTransaction
): TruckStockTransaction => {
  const transactions = getTruckStockTransactions();

  saveTruckStockTransactions([transaction, ...transactions]);

  return transaction;
};

export const getTruckTransactionsByTruck = (
  truckId: string
): TruckStockTransaction[] => {
  return getTruckStockTransactions().filter(
    (transaction) => transaction.truckId === truckId
  );
};

export const getTruckTransactionsByInventoryItem = (
  inventoryItemId: string
): TruckStockTransaction[] => {
  return getTruckStockTransactions().filter(
    (transaction) => transaction.inventoryItemId === inventoryItemId
  );
};

export const getTruckTransactionsByReference = (
  referenceId: string
): TruckStockTransaction[] => {
  return getTruckStockTransactions().filter(
    (transaction) => transaction.referenceId === referenceId
  );
};

export const deleteTruckStockTransaction = (
  transactionId: string
): void => {
  saveTruckStockTransactions(
    getTruckStockTransactions().filter(
      (transaction) => transaction.id !== transactionId
    )
  );
};