export type LaborEntryStatus = "Active" | "Completed" | "Cancelled";

export type LaborEntry = {
  id: string;

  repairOrderId: string;
  repairOrderNumber?: string;

  actionItemId?: string;
  actionItemTitle?: string;

  technicianId: string;
  technicianName: string;

  status: LaborEntryStatus;

  clockInDateTime: string;
  clockOutDateTime?: string;

  totalHours?: number;

  laborRate?: number;
  laborAmount?: number;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};