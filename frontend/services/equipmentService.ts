import { Equipment } from "@/types/equipment";

const STORAGE_KEY = "tier1_equipment";

export function getEquipment(): Equipment[] {
  if (typeof window === "undefined") return [];

  const storedEquipment = localStorage.getItem(STORAGE_KEY);

  if (!storedEquipment) return [];

  try {
    return JSON.parse(storedEquipment) as Equipment[];
  } catch {
    return [];
  }
}

export function saveEquipment(equipment: Equipment[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
}

export function createEquipment(
  equipment: Omit<Equipment, "id" | "createdDate" | "updatedDate">
): Equipment {
  const existingEquipment = getEquipment();

  const newEquipment: Equipment = {
    id: crypto.randomUUID(),
    ...equipment,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };

  saveEquipment([...existingEquipment, newEquipment]);

  return newEquipment;
}

export function updateEquipment(
  id: string,
  updates: Partial<Omit<Equipment, "id" | "createdDate">>
): Equipment | null {
  const equipment = getEquipment();

  const existingItem = equipment.find((item) => item.id === id);

  if (!existingItem) return null;

  const updatedItem: Equipment = {
    ...existingItem,
    ...updates,
    updatedDate: new Date().toISOString(),
  };

  saveEquipment(
    equipment.map((item) => (item.id === id ? updatedItem : item))
  );

  return updatedItem;
}

export function deleteEquipment(id: string): void {
  const equipment = getEquipment();

  saveEquipment(equipment.filter((item) => item.id !== id));
}

export function getEquipmentById(id: string): Equipment | undefined {
  return getEquipment().find((item) => item.id === id);
}

export function getEquipmentByCustomerId(customerId: string): Equipment[] {
  return getEquipment().filter((item) => item.customerId === customerId);
}

export function findEquipmentBySerialNumber(
  serialNumber: string
): Equipment | undefined {
  const normalizedSerialNumber = serialNumber.trim().toLowerCase();

  if (!normalizedSerialNumber) return undefined;

  return getEquipment().find(
    (item) =>
      item.serialNumber?.trim().toLowerCase() === normalizedSerialNumber
  );
}