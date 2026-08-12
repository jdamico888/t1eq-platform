export type MileageEntryStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Paid";

export type MileageEntry = {
  id: string;

  technicianId: string;
  technicianName: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  scheduleEventId?: string;

  startLocation?: string;
  endLocation?: string;

  startOdometer: number;
  endOdometer: number;

  totalMiles: number;

  reimbursementRate: number;
  reimbursementAmount: number;

  status: MileageEntryStatus;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};