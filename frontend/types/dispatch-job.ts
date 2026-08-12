export type DispatchJobStatus =
  | "Scheduled"
  | "Dispatched"
  | "On Site"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type DispatchJob = {
  id: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  customerId: string;
  customerName: string;

  siteId?: string;
  siteName?: string;

  technicianId?: string;
  technicianName?: string;

  scheduledStart?: string;
  scheduledEnd?: string;

  arrivalTime?: string;
  completionTime?: string;

  status: DispatchJobStatus;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};