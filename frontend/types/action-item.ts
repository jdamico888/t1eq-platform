export type ActionItemType =
  | "Install"
  | "Inspection"
  | "Repair";

export type ActionItemStatus =
  | "Open"
  | "In Progress"
  | "Waiting Parts"
  | "Completed";

export type ActionItem = {

  id: string;

  repairOrderId: string;

  type: ActionItemType;

  status: ActionItemStatus;

  title: string;

  description?: string;

  findings?: string;

  recommendations?: string;

  laborTotal?: number;

  partsTotal?: number;

  subtotal?: number;

  tax?: number;

  total?: number;

  createdDate: string;

  updatedDate?: string;

  technician?: string;

  notes?: string[];

  photos?: string[];
};