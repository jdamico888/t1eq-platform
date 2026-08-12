import type { LaborEntry } from "@/types/labor-entry";

const STORAGE_KEY = "t1eq-labor-entries";

export type LaborEntryInput = {
  repairOrderId: string;
  repairOrderNumber?: string;

  actionItemId?: string;
  actionItemTitle?: string;

  technicianId: string;
  technicianName: string;

  status?: LaborEntry["status"];

  clockInDateTime: string;
  clockOutDateTime?: string;

  laborRate?: number;

  notes?: string;
};

const calculateHours = (
  clockInDateTime: string,
  clockOutDateTime?: string
) => {
  if (!clockOutDateTime) {
    return 0;
  }

  const start = new Date(clockInDateTime).getTime();
  const end = new Date(clockOutDateTime).getTime();

  return Number(
    ((end - start) / (1000 * 60 * 60)).toFixed(2)
  );
};

export const getLaborEntries = (): LaborEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as LaborEntry[];
  } catch (error) {
    console.error("Failed to parse labor entries.", error);

    return [];
  }
};

export const saveLaborEntries = (
  laborEntries: LaborEntry[]
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(laborEntries)
  );
};

export const createLaborEntry = (
  laborEntryInput: LaborEntryInput
): LaborEntry => {
  const now = new Date().toISOString();

  const totalHours = calculateHours(
    laborEntryInput.clockInDateTime,
    laborEntryInput.clockOutDateTime
  );

  const laborAmount =
    totalHours * (laborEntryInput.laborRate ?? 0);

  const laborEntry: LaborEntry = {
    id: crypto.randomUUID(),

    repairOrderId: laborEntryInput.repairOrderId,
    repairOrderNumber: laborEntryInput.repairOrderNumber,

    actionItemId: laborEntryInput.actionItemId,
    actionItemTitle: laborEntryInput.actionItemTitle,

    technicianId: laborEntryInput.technicianId,
    technicianName: laborEntryInput.technicianName,

    status: laborEntryInput.status ?? "Active",

    clockInDateTime:
      laborEntryInput.clockInDateTime,

    clockOutDateTime:
      laborEntryInput.clockOutDateTime,

    totalHours,

    laborRate: laborEntryInput.laborRate,

    laborAmount,

    notes: laborEntryInput.notes,

    createdDate: now,
    updatedDate: now,
  };

  saveLaborEntries([
    ...getLaborEntries(),
    laborEntry,
  ]);

  return laborEntry;
};

export const updateLaborEntry = (
  laborEntryId: string,
  laborEntryInput: LaborEntryInput
): LaborEntry | null => {
  const laborEntries = getLaborEntries();

  const existingLaborEntry = laborEntries.find(
    (laborEntry) => laborEntry.id === laborEntryId
  );

  if (!existingLaborEntry) {
    return null;
  }

  const totalHours = calculateHours(
    laborEntryInput.clockInDateTime,
    laborEntryInput.clockOutDateTime
  );

  const laborAmount =
    totalHours * (laborEntryInput.laborRate ?? 0);

  const updatedLaborEntry: LaborEntry = {
    ...existingLaborEntry,

    repairOrderId: laborEntryInput.repairOrderId,
    repairOrderNumber: laborEntryInput.repairOrderNumber,

    actionItemId: laborEntryInput.actionItemId,
    actionItemTitle: laborEntryInput.actionItemTitle,

    technicianId: laborEntryInput.technicianId,
    technicianName: laborEntryInput.technicianName,

    status:
      laborEntryInput.status ??
      existingLaborEntry.status,

    clockInDateTime:
      laborEntryInput.clockInDateTime,

    clockOutDateTime:
      laborEntryInput.clockOutDateTime,

    totalHours,

    laborRate: laborEntryInput.laborRate,

    laborAmount,

    notes: laborEntryInput.notes,

    updatedDate: new Date().toISOString(),
  };

  saveLaborEntries(
    laborEntries.map((laborEntry) =>
      laborEntry.id === laborEntryId
        ? updatedLaborEntry
        : laborEntry
    )
  );

  return updatedLaborEntry;
};

export const deleteLaborEntry = (
  laborEntryId: string
) => {
  saveLaborEntries(
    getLaborEntries().filter(
      (laborEntry) =>
        laborEntry.id !== laborEntryId
    )
  );
};

export const getLaborEntryById = (
  laborEntryId: string
) => {
  return getLaborEntries().find(
    (laborEntry) =>
      laborEntry.id === laborEntryId
  );
};

export const getLaborEntriesByRepairOrder = (
  repairOrderId: string
) => {
  return getLaborEntries().filter(
    (laborEntry) =>
      laborEntry.repairOrderId === repairOrderId
  );
};

export const getLaborEntriesByTechnician = (
  technicianId: string
) => {
  return getLaborEntries().filter(
    (laborEntry) =>
      laborEntry.technicianId === technicianId
  );
};

export const getActiveLaborEntries = () => {
  return getLaborEntries().filter(
    (laborEntry) =>
      laborEntry.status === "Active"
  );
};

export const calculateLaborEntryTotalHours = (
  laborEntries: LaborEntry[]
) => {
  return laborEntries.reduce(
    (total, laborEntry) =>
      total + (laborEntry.totalHours ?? 0),
    0
  );
};

export const calculateLaborEntryTotalAmount = (
  laborEntries: LaborEntry[]
) => {
  return laborEntries.reduce(
    (total, laborEntry) =>
      total + (laborEntry.laborAmount ?? 0),
    0
  );
};