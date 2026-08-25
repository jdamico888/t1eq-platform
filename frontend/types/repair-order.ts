import type { SpecialOrderStatus } from "./special-order";

import type {
  CustomerLaborBillingMode,
  EmployeeClockInRule,
  EmployeeClockOutRule,
  EmployeeClockingPurpose,
  EmployeePayType,
} from "@/types/technician-profile";

export type RepairOrderStatus =
  | "Draft"
  | "Open"
  | "Scheduled"
  | "Dispatched"
  | "In Progress"
  | "Waiting Parts"
  | "Waiting on Parts"
  | "Waiting Approval"
  | "Completed"
  | "Closed"
  | "Invoiced"
  | "Cancelled";

export type RepairOrderStatusDateField =
  | "draftDate"
  | "openedDate"
  | "scheduledDate"
  | "dispatchedDate"
  | "inProgressDate"
  | "waitingPartsDate"
  | "waitingApprovalDate"
  | "completedDate"
  | "closedDate"
  | "invoicedDate"
  | "cancelledDate";

export type RepairOrderPriority = "Low" | "Normal" | "High" | "Urgent";

export type RepairOrderBillingGroup =
  | "Inspection"
  | "Repair"
  | "Parts"
  | "Other"
  | "Labor"
  | "Travel"
  | "Mileage"
  | "Inspection Charges"
  | "Repair Charges"
  | "Parts Charges"
  | "Other Charges";

export type RepairOrderActionBillingGroup = RepairOrderBillingGroup;

export type RepairOrderActionItemType =
  | "Installation"
  | "Inspection"
  | "Repair"
  | "Removal"
  | "Diagnosis"
  | "Calibration"
  | "Parts"
  | "Recommendation"
  | "Follow-Up"
  | "Follow Up"
  | "Other";

export type RepairOrderActionType = RepairOrderActionItemType;

export type RepairOrderActionItemStatus =
  | "Open"
  | "In Progress"
  | "Waiting Parts"
  | "Waiting on Parts"
  | "Waiting Approval"
  | "Completed"
  | "Deferred"
  | "Declined"
  | "Cancelled";

export type RepairOrderActionStatus = RepairOrderActionItemStatus;

export type RepairOrderPhotoSource =
  | "Camera"
  | "Desktop Upload"
  | "Imported"
  | "Unknown";

export type RepairOrderTimeClockMethod =
  | "Manual"
  | "Photo"
  | "Status Change"
  | "Customer Signature"
  | "Employee Setup Rule"
  | "Unknown";

export type RepairOrderLaborType =
  | "Inspection"
  | "Diagnosis"
  | "Repair"
  | "Calibration"
  | "Travel"
  | "Mileage"
  | "Warranty"
  | "Administrative"
  | "Other";

export type RepairOrderLaborRateSource =
  | "Flat Rate"
  | "Hourly"
  | "Manual"
  | "Manual Override"
  | "Rate Profile"
  | "Employee Setup"
  | "Company Billing Settings"
  | "Warranty"
  | "Manufacturer Contract"
  | "Customer Contract"
  | "Default"
  | "Unknown";

export type RepairOrderPhoto = {
  id: string;
  imageUrl: string;
  source: RepairOrderPhotoSource;
  label?: string;
  capturedDate: string;
};

export type RepairOrderPartEntry = {
  id: string;

  partNumber: string;
  description: string;

  quantity: number;

  unitCost: number;
  unitPrice: number;

  cost: number;
  price: number;
  sellPrice: number;

  total: number;

  supplierName?: string;
  inventoryItemId?: string;

  sourceStockLocation?: string;
  sourceTruckId?: string;
  sourceTruckName?: string;

  partImageUrl?: string;

  /**
   * Special-order handling for this line. Defaults from the inventory
   * item's flag, and can be set per line for a one-off order of a part
   * that is normally stocked.
   */
  isSpecialOrder?: boolean;
  specialOrderStatus?: SpecialOrderStatus;

  /** The prepayment invoice this part was billed on, once one exists. */
  prepaymentInvoiceId?: string;
  prepaymentInvoiceNumber?: string;

  /** What the customer actually prepaid, kept so the final invoice can
   * credit it back rather than billing the part twice. */
  prepaidAmount?: number;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};

export type RepairOrderLaborEntry = {
  id: string;

  technicianId?: string;
  technicianName?: string;

  employeeProfileId?: string;
  employeeUserId?: string;
  employeeDisplayName?: string;
  employeeRole?: string;
  employeePayType?: EmployeePayType;

  actionItemId?: string;
  actionItemTitle?: string;

  clockInDate?: string;
  clockOutDate?: string;

  clockInRule?: EmployeeClockInRule;
  clockOutRule?: EmployeeClockOutRule;
  clockingPurpose?: EmployeeClockingPurpose;

  clockInMethod?: RepairOrderTimeClockMethod;
  clockOutMethod?: RepairOrderTimeClockMethod;

  modelSerialPhotoRequiredForClockIn?: boolean;
  modelSerialPhotoCapturedForClockIn?: boolean;
  modelSerialPhotoUrlForClockIn?: string;

  customerSignatureRequiredForClockOut?: boolean;
  customerSignatureCapturedForClockOut?: boolean;
  customerSignatureUrlForClockOut?: string;

  hours: number;
  totalMinutes: number;

  laborType?: RepairOrderLaborType;
  billingGroup?: RepairOrderBillingGroup;

  laborRate: number;
  rateSource?: RepairOrderLaborRateSource;
  rateProfileName?: string;

  manufacturer?: string;
  billable?: boolean;

  customerBillingMode?: CustomerLaborBillingMode;
  billableToCustomer?: boolean;
  customerLaborRate?: number;
  customerLaborHours?: number;
  customerLaborTotal?: number;
  customerMinimumLaborCharge?: number;
  customerFlatJobLaborAmount?: number;

  payrollEligible?: boolean;
  payrollRate?: number;
  payrollHours?: number;
  payrollAmount?: number;
  salaryAttendanceOnly?: boolean;

  metricEligible?: boolean;
  metricLaborHours?: number;
  metricLaborRevenue?: number;
  metricUtilizationHours?: number;
  metricEfficiencyHours?: number;
  metricComebackEligible?: boolean;
  metricFirstTimeFixEligible?: boolean;
  metricCustomerSatisfactionEligible?: boolean;

  mileage?: number;
  mileageRate?: number;

  total: number;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};

export type RepairOrderActionItem = {
  id: string;

  type: RepairOrderActionItemType;
  status: RepairOrderActionItemStatus;

  title: string;
  description?: string;

  billingGroup: RepairOrderBillingGroup;

  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;

  estimatedLaborHours?: number;
  flatRateHours?: number;

  generatedLaborDescription?: string;
  generatedLaborHours?: number;
  generatedLaborRate?: number;
  generatedLaborTotal?: number;

  generatedPartsDescription?: string;
  generatedPartsTotal?: number;

  generatedTravelDescription?: string;
  generatedTravelMiles?: number;
  generatedTravelRate?: number;
  generatedTravelHours?: number;
  generatedTravelTotal?: number;

  generatedMiscDescription?: string;
  generatedMiscTotal?: number;

  generationNotes?: string;

  laborHours?: number;
  laborRate?: number;
  laborTotal?: number;
  partsTotal?: number;
  total?: number;

  laborEntries?: RepairOrderLaborEntry[];
  partEntries?: RepairOrderPartEntry[];

  assignedTechnicianId?: string;
  assignedTechnicianName?: string;

  assignedEmployeeProfileId?: string;
  assignedEmployeeDisplayName?: string;
  assignedEmployeeRole?: string;

  equipmentId?: string;
  equipmentSnapshot?: RepairOrderEquipmentSnapshot;

  partsRequired?: string;
  recommendationNotes?: string;

  customerApproved?: boolean;
  customerDeclined?: boolean;

  startedDate?: string;
  completedDate?: string;

  clockInDateTime?: string;
  clockOutDateTime?: string;
  timeClockMethod?: RepairOrderTimeClockMethod;

  serialPlatePhotoUrl?: string;
  beforePhotoUrls?: string[];
  afterPhotoUrls?: string[];
  customerSignatureUrl?: string;

  completionNotes?: string;
  notes?: string;

  photos?: RepairOrderPhoto[];

  createdDate: string;
  updatedDate?: string;
};

export type RepairOrderEquipmentSnapshot = {
  equipmentId?: string;
  equipmentModelId?: string;
  equipmentName?: string;
  equipmentDescription?: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetNumber?: string;
  locationName?: string;
};

export type RepairOrderCustomerSnapshot = {
  customerId?: string;
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  serviceAddress?: string;
};

export type RepairOrderSignature = {
  signerName: string;
  signatureDataUrl?: string;
  signedDate: string;
};

export type RepairOrderInput = Partial<RepairOrder> & {
  customerName?: string;
  complaint?: string;
};

export type RepairOrder = {
  id: string;

  repairOrderNumber: string;
  ro?: string;

  status: RepairOrderStatus;
  priority: RepairOrderPriority;

  customerId?: string;
  customerName: string;
  customerSnapshot: RepairOrderCustomerSnapshot;

  siteId?: string;
  siteName?: string;

  equipmentId?: string;
  equipmentName?: string;
  equipmentDescription?: string;
  equipmentSnapshot?: RepairOrderEquipmentSnapshot;

  complaint: string;
  concern?: string;
  customerConcern?: string;

  cause?: string;
  correction?: string;

  diagnosis?: string;
  initialFindings?: string;

  workPerformed?: string;
  resolution?: string;
  recommendations?: string;

  internalNotes?: string;
  customerNotes?: string;
  notes?: string;

  draftDate?: string;
  openedDate: string;
  scheduledDate?: string;
  dispatchedDate?: string;
  inProgressDate?: string;
  waitingPartsDate?: string;
  waitingApprovalDate?: string;
  completedDate?: string;
  closedDate?: string;
  invoicedDate?: string;
  cancelledDate?: string;

  assignedTechnicianId?: string;
  assignedTechnicianName?: string;

  assignedEmployeeProfileId?: string;
  assignedEmployeeDisplayName?: string;
  assignedEmployeeRole?: string;

  assignedUserId?: string;
  assignedUserName?: string;

  assignedTruckId?: string;
  assignedTruckName?: string;

  assignedRouteId?: string;
  assignedRouteName?: string;

  modelSerialPhotoRequired: boolean;
  modelSerialPhotoCaptured: boolean;
  modelSerialPhotoUrl?: string;
  modelSerialPhotoSource?: RepairOrderPhotoSource;
  modelSerialPhotoCapturedDate?: string;

  photos: RepairOrderPhoto[];
  actionItems: RepairOrderActionItem[];
  laborEntries: RepairOrderLaborEntry[];
  partEntries?: RepairOrderPartEntry[];

  customerSignature?: RepairOrderSignature;

  subtotalLabor: number;
  subtotalParts: number;
  subtotalOther: number;
  totalAmount: number;

  createdDate: string;
  updatedDate?: string;
};

export const repairOrderStatusDateFieldByStatus: Record<
  RepairOrderStatus,
  RepairOrderStatusDateField
> = {
  Draft: "draftDate",
  Open: "openedDate",
  Scheduled: "scheduledDate",
  Dispatched: "dispatchedDate",
  "In Progress": "inProgressDate",
  "Waiting Parts": "waitingPartsDate",
  "Waiting on Parts": "waitingPartsDate",
  "Waiting Approval": "waitingApprovalDate",
  Completed: "completedDate",
  Closed: "closedDate",
  Invoiced: "invoicedDate",
  Cancelled: "cancelledDate",
};