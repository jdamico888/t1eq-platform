export type InspectionStatus =
  | "Draft"
  | "Pass"
  | "Passed"
  | "Fail"
  | "Failed"
  | "Conditional"
  | "Needs Repair"
  | "Out of Service"
  | "Cancelled";

export type Inspection = {
  id: string;

  inspectionNumber: string;

  customerId: string;
  customerName: string;

  siteId?: string;
  siteName?: string;

  equipmentId: string;
  equipmentName: string;

  inspectorId?: string;
  inspectorName?: string;
  inspector?: string;

  inspectionDate: string;
  inspectionType?: string;
  inspectionDue?: string;
  nextInspectionDate?: string;

  status: InspectionStatus;

  findings?: string;
  recommendations?: string;
  correctiveActions?: string;

  qrCodeUrl?: string;
  reportUrl?: string;
  labelUrl?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};