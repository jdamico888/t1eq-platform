export type EquipmentStatus =
  | "Active"
  | "Inactive"
  | "Needs Service"
  | "Out of Service"
  | "Pending Inspection"
  | "Under Repair"
  | "Retired";

export type Equipment = {
  id: string;

  customerId: string;
  customerName: string;

  siteId?: string;
  siteName?: string;

  category: string;
  manufacturer: string;
  model?: string;
  serialNumber?: string;

  equipmentModelId?: string;

  location?: string;
  status: EquipmentStatus;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};