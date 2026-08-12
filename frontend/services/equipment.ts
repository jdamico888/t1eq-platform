import { Equipment } from "@/types/equipment";
import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_equipment";

export type { Equipment } from "@/types/equipment";

export type EquipmentInput = Omit<
  Equipment,
  "id" | "createdDate" | "updatedDate"
>;

export function getEquipment(): Equipment[] {
  return readStorageArray<Equipment>(STORAGE_KEY);
}

export function saveEquipment(equipment: Equipment[]): void {
  writeStorageArray<Equipment>(STORAGE_KEY, equipment);
}

export function createEquipment(equipment: EquipmentInput): Equipment {
  const existingEquipment = getEquipment();
  const timestamp = createTimestamp();

  const newEquipment: Equipment = {
    id: createId(),
    ...equipment,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveEquipment([...existingEquipment, newEquipment]);

  return newEquipment;
}

export function updateEquipment(
  idOrEquipment: string | Equipment,
  updates?: Partial<EquipmentInput>
): Equipment | null {
  const equipment = getEquipment();

  const id =
    typeof idOrEquipment === "string" ? idOrEquipment : idOrEquipment.id;

  const existingItem = equipment.find((item) => item.id === id);

  if (!existingItem) return null;

  const updatePayload =
    typeof idOrEquipment === "string" ? updates || {} : idOrEquipment;

  const updatedItem: Equipment = {
    ...existingItem,
    ...updatePayload,
    updatedDate: createTimestamp(),
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

export function getEquipmentBySiteId(siteId: string): Equipment[] {
  return getEquipment().filter((item) => item.siteId === siteId);
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

export function searchEquipment(searchTerm: string): Equipment[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return getEquipment();

  return getEquipment().filter((item) => {
    return (
      item.customerName.toLowerCase().includes(normalizedSearch) ||
      Boolean(item.siteName?.toLowerCase().includes(normalizedSearch)) ||
      item.category.toLowerCase().includes(normalizedSearch) ||
      item.manufacturer.toLowerCase().includes(normalizedSearch) ||
      Boolean(item.model?.toLowerCase().includes(normalizedSearch)) ||
      Boolean(item.serialNumber?.toLowerCase().includes(normalizedSearch)) ||
      Boolean(item.location?.toLowerCase().includes(normalizedSearch)) ||
      item.status.toLowerCase().includes(normalizedSearch)
    );
  });
}