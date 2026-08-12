export type FieldWorkSessionStatus =
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type FieldWorkSessionStartMethod =
  | "Equipment Photo"
  | "Manual Override"
  | "Dispatch Arrival";

export type FieldWorkSessionEndMethod =
  | "Action Item Status Change"
  | "Customer Signature"
  | "Manual Override"
  | "Repair Order Closed";

export type FieldWorkEvidenceType =
  | "Equipment Model Serial Photo"
  | "Action Item Photo"
  | "Customer Signature"
  | "Technician Note"
  | "Other";

export type FieldWorkEvidence = {
  id: string;

  type: FieldWorkEvidenceType;

  label: string;
  description?: string;

  fileName?: string;
  fileUrl?: string;

  capturedDateTime: string;
};

export type FieldWorkSession = {
  id: string;

  repairOrderId: string;
  repairOrderNumber?: string;

  actionItemId?: string;
  actionItemTitle?: string;

  technicianId: string;
  technicianName: string;

  status: FieldWorkSessionStatus;

  startMethod: FieldWorkSessionStartMethod;
  endMethod?: FieldWorkSessionEndMethod;

  startedDateTime: string;
  endedDateTime?: string;

  totalHours?: number;

  evidence: FieldWorkEvidence[];

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};