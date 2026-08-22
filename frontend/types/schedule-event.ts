export type ScheduleEventStatus =
  | "Draft"
  | "Scheduled"
  | "Dispatched"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type ScheduleEventType =
  | "Appointment"
  | "Repair Order"
  | "Inspection"
  | "Installation"
  | "Service Call"
  | "Calibration"
  | "Administrative"
  | "Other";

export type ScheduleEvent = {
  id: string;

  type: ScheduleEventType;
  status: ScheduleEventStatus;

  title: string;
  description?: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  customerId?: string;
  customerName?: string;

  siteId?: string;
  siteName?: string;

  equipmentId?: string;
  equipmentName?: string;

  technicianId?: string;
  technicianName?: string;

  startDateTime: string;
  endDateTime: string;

  location?: string;
  notes?: string;

  createdDate: string;
  updatedDate?: string;
};