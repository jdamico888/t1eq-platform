import type { MileageEntry } from "@/types/mileage-entry";

const STORAGE_KEY = "t1eq-mileage-entries";

export type MileageEntryInput = {
  technicianId: string;
  technicianName: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  scheduleEventId?: string;

  startLocation?: string;
  endLocation?: string;

  startOdometer: number;
  endOdometer: number;

  reimbursementRate: number;

  status?: MileageEntry["status"];

  notes?: string;
};

const calculateTotalMiles = (
  startOdometer: number,
  endOdometer: number
) => {
  return Math.max(endOdometer - startOdometer, 0);
};

const calculateReimbursementAmount = (
  totalMiles: number,
  reimbursementRate: number
) => {
  return totalMiles * reimbursementRate;
};

export const getMileageEntries = (): MileageEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as MileageEntry[];
  } catch (error) {
    console.error("Failed to parse mileage entries.", error);

    return [];
  }
};

export const saveMileageEntries = (mileageEntries: MileageEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mileageEntries));
};

export const createMileageEntry = (
  mileageEntryInput: MileageEntryInput
): MileageEntry => {
  const now = new Date().toISOString();

  const totalMiles = calculateTotalMiles(
    mileageEntryInput.startOdometer,
    mileageEntryInput.endOdometer
  );

  const reimbursementAmount = calculateReimbursementAmount(
    totalMiles,
    mileageEntryInput.reimbursementRate
  );

  const mileageEntry: MileageEntry = {
    id: crypto.randomUUID(),

    technicianId: mileageEntryInput.technicianId,
    technicianName: mileageEntryInput.technicianName,

    repairOrderId: mileageEntryInput.repairOrderId,
    repairOrderNumber: mileageEntryInput.repairOrderNumber,

    scheduleEventId: mileageEntryInput.scheduleEventId,

    startLocation: mileageEntryInput.startLocation,
    endLocation: mileageEntryInput.endLocation,

    startOdometer: mileageEntryInput.startOdometer,
    endOdometer: mileageEntryInput.endOdometer,

    totalMiles,

    reimbursementRate: mileageEntryInput.reimbursementRate,
    reimbursementAmount,

    status: mileageEntryInput.status ?? "Pending",

    notes: mileageEntryInput.notes,

    createdDate: now,
    updatedDate: now,
  };

  saveMileageEntries([...getMileageEntries(), mileageEntry]);

  return mileageEntry;
};

export const updateMileageEntry = (
  mileageEntryId: string,
  mileageEntryInput: MileageEntryInput
): MileageEntry | null => {
  const mileageEntries = getMileageEntries();

  const existingMileageEntry = mileageEntries.find(
    (mileageEntry) => mileageEntry.id === mileageEntryId
  );

  if (!existingMileageEntry) {
    return null;
  }

  const totalMiles = calculateTotalMiles(
    mileageEntryInput.startOdometer,
    mileageEntryInput.endOdometer
  );

  const reimbursementAmount = calculateReimbursementAmount(
    totalMiles,
    mileageEntryInput.reimbursementRate
  );

  const updatedMileageEntry: MileageEntry = {
    ...existingMileageEntry,

    technicianId: mileageEntryInput.technicianId,
    technicianName: mileageEntryInput.technicianName,

    repairOrderId: mileageEntryInput.repairOrderId,
    repairOrderNumber: mileageEntryInput.repairOrderNumber,

    scheduleEventId: mileageEntryInput.scheduleEventId,

    startLocation: mileageEntryInput.startLocation,
    endLocation: mileageEntryInput.endLocation,

    startOdometer: mileageEntryInput.startOdometer,
    endOdometer: mileageEntryInput.endOdometer,

    totalMiles,

    reimbursementRate: mileageEntryInput.reimbursementRate,
    reimbursementAmount,

    status: mileageEntryInput.status ?? existingMileageEntry.status,

    notes: mileageEntryInput.notes,

    updatedDate: new Date().toISOString(),
  };

  saveMileageEntries(
    mileageEntries.map((mileageEntry) =>
      mileageEntry.id === mileageEntryId ? updatedMileageEntry : mileageEntry
    )
  );

  return updatedMileageEntry;
};

export const deleteMileageEntry = (mileageEntryId: string) => {
  saveMileageEntries(
    getMileageEntries().filter(
      (mileageEntry) => mileageEntry.id !== mileageEntryId
    )
  );
};

export const getMileageEntriesByTechnician = (
  technicianId: string
): MileageEntry[] => {
  return getMileageEntries().filter(
    (mileageEntry) => mileageEntry.technicianId === technicianId
  );
};

export const getMileageEntriesByRepairOrder = (
  repairOrderId: string
): MileageEntry[] => {
  return getMileageEntries().filter(
    (mileageEntry) => mileageEntry.repairOrderId === repairOrderId
  );
};

export const getPendingMileageEntries = (): MileageEntry[] => {
  return getMileageEntries().filter(
    (mileageEntry) => mileageEntry.status === "Pending"
  );
};

export const calculateMileageTotalMiles = (
  mileageEntries: MileageEntry[]
) => {
  return mileageEntries.reduce(
    (total, mileageEntry) => total + mileageEntry.totalMiles,
    0
  );
};

export const calculateMileageReimbursementTotal = (
  mileageEntries: MileageEntry[]
) => {
  return mileageEntries.reduce(
    (total, mileageEntry) => total + mileageEntry.reimbursementAmount,
    0
  );
};