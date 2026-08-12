import type {
  TechnicianCompensation,
  TechnicianCompensationType,
} from "@/types/technician-compensation";

export type EmployeePayType = "Flat Rate" | "Hourly" | "Salary";

export type EmployeeClockInRule =
  | "Flat Rate - Job Clock In on model/serial picture"
  | "Flat Rate - Job Clock In on click"
  | "Hourly - Daily Clock In"
  | "Salary - Clock In on click";

export type EmployeeClockOutRule =
  | "Flat Rate - Job Clock Out on customer signature"
  | "Flat Rate - Job Clock Out"
  | "Flat Rate - Job Clock Out on click"
  | "Hourly - Day Clock Out"
  | "Salary - Clock Out on click";

export type EmployeeClockingPurpose =
  | "Job Timing"
  | "Daily Attendance"
  | "Activity Tracking";

export type CustomerLaborBillingMode =
  | "Company Flat Rate"
  | "Company Hourly"
  | "Company Minimum Charge"
  | "Warranty"
  | "No Charge"
  | "Contract Included";

export type TechnicianStatus = "Active" | "Inactive" | "Suspended";

export type TechnicianRole =
  | "Technician"
  | "Lead Technician"
  | "Inspector"
  | "Service Manager"
  | "Owner"
  | "Admin";

export type TechnicianSkillLevel =
  | "Apprentice"
  | "Technician"
  | "Senior Technician"
  | "Master Technician"
  | "Specialist";

export type TechnicianProfileCompensation = TechnicianCompensation & {
  payType?: EmployeePayType | string;
  compensationType?: EmployeePayType | string;
  model?: EmployeePayType | string;
  payModel?: EmployeePayType | string;

  hourlyRate?: number;
  baseHourlyRate?: number;
  laborRate?: number;

  flatRatePayPercent?: number;
  flatRatePercentage?: number;
  flatRatePercent?: number;
  commissionRate?: number;

  salaryAnnualAmount?: number;
  annualSalary?: number;
  salaryAmount?: number;

  mileageRate?: number;
  perDiemRate?: number;

  payrollEligible?: boolean;
  active?: boolean;
};

export type TechnicianPayrollSettings = {
  payType: EmployeePayType;

  hourlyPayRate: number;
  flatRatePayPercent: number;
  salaryAnnualAmount: number;

  payrollEligible: boolean;
  payrollNotes: string;
};

export type TechnicianClockingSettings = {
  clockInRule: EmployeeClockInRule;
  clockOutRule: EmployeeClockOutRule;
  clockingPurpose: EmployeeClockingPurpose;

  requiresModelSerialPhotoForClockIn: boolean;
  requiresCustomerSignatureForClockOut: boolean;
  allowsManualClockIn: boolean;
  allowsManualClockOut: boolean;

  clockingNotes: string;
};

export type TechnicianBillingSettings = {
  canGenerateCustomerLaborCharges: boolean;
  defaultCustomerBillingMode: CustomerLaborBillingMode;

  defaultCustomerLaborRate: number;
  minimumLaborCharge: number;
  flatJobLaborAmount: number;

  billingNotes: string;
};

export type TechnicianMetricSettings = {
  includedInCompanyMetrics: boolean;
  countsTowardLaborRevenue: boolean;
  countsTowardLaborHours: boolean;
  countsTowardUtilization: boolean;
  countsTowardEfficiency: boolean;
  countsTowardComebacks: boolean;
  countsTowardFirstTimeFixRate: boolean;
  countsTowardCustomerSatisfaction: boolean;

  metricNotes: string;
};

export type TechnicianProfile = {
  id: string;

  /**
   * Legacy compatibility fields.
   * Existing payroll/profile services still read these while the platform
   * migrates to payrollSettings, clockingSettings, billingSettings, and
   * metricSettings.
   */
  userId: string;
  active: boolean;
  compensation: TechnicianProfileCompensation;

  technicianNumber: string;
  employeeNumber: string;

  firstName: string;
  lastName: string;
  displayName: string;

  email: string;
  phone: string;

  status: TechnicianStatus;
  role: TechnicianRole;
  skillLevel: TechnicianSkillLevel;

  territory: string;
  serviceVehicleId: string;
  serviceVehicleName: string;

  specialties: string[];
  certifications: string[];

  payrollSettings: TechnicianPayrollSettings;
  clockingSettings: TechnicianClockingSettings;
  billingSettings: TechnicianBillingSettings;
  metricSettings: TechnicianMetricSettings;

  notes: string;

  createdDate: string;
  updatedDate: string;
};

export type TechnicianProfileInput = Omit<
  TechnicianProfile,
  "id" | "createdDate" | "updatedDate"
>;

export const employeePayTypeOptions: EmployeePayType[] = [
  "Flat Rate",
  "Hourly",
  "Salary",
];

export const employeeClockInRuleOptions: EmployeeClockInRule[] = [
  "Flat Rate - Job Clock In on model/serial picture",
  "Flat Rate - Job Clock In on click",
  "Hourly - Daily Clock In",
  "Salary - Clock In on click",
];

export const employeeClockOutRuleOptions: EmployeeClockOutRule[] = [
  "Flat Rate - Job Clock Out on customer signature",
  "Flat Rate - Job Clock Out",
  "Flat Rate - Job Clock Out on click",
  "Hourly - Day Clock Out",
  "Salary - Clock Out on click",
];

export const employeeClockingPurposeOptions: EmployeeClockingPurpose[] = [
  "Job Timing",
  "Daily Attendance",
  "Activity Tracking",
];

export const customerLaborBillingModeOptions: CustomerLaborBillingMode[] = [
  "Company Flat Rate",
  "Company Hourly",
  "Company Minimum Charge",
  "Warranty",
  "No Charge",
  "Contract Included",
];

export const technicianStatusOptions: TechnicianStatus[] = [
  "Active",
  "Inactive",
  "Suspended",
];

export const technicianRoleOptions: TechnicianRole[] = [
  "Technician",
  "Lead Technician",
  "Inspector",
  "Service Manager",
  "Owner",
  "Admin",
];

export const technicianSkillLevelOptions: TechnicianSkillLevel[] = [
  "Apprentice",
  "Technician",
  "Senior Technician",
  "Master Technician",
  "Specialist",
];

export function getDefaultClockInRule(
  payType: EmployeePayType
): EmployeeClockInRule {
  if (payType === "Flat Rate") {
    return "Flat Rate - Job Clock In on model/serial picture";
  }

  if (payType === "Hourly") {
    return "Hourly - Daily Clock In";
  }

  return "Salary - Clock In on click";
}

export function getDefaultClockOutRule(
  payType: EmployeePayType
): EmployeeClockOutRule {
  if (payType === "Flat Rate") {
    return "Flat Rate - Job Clock Out on customer signature";
  }

  if (payType === "Hourly") {
    return "Hourly - Day Clock Out";
  }

  return "Salary - Clock Out on click";
}

export function getDefaultClockingPurpose(
  payType: EmployeePayType
): EmployeeClockingPurpose {
  if (payType === "Flat Rate") {
    return "Job Timing";
  }

  if (payType === "Hourly") {
    return "Daily Attendance";
  }

  return "Activity Tracking";
}

export function getDefaultPayrollSettings(
  payType: EmployeePayType = "Flat Rate"
): TechnicianPayrollSettings {
  return {
    payType,
    hourlyPayRate: 0,
    flatRatePayPercent: 0,
    salaryAnnualAmount: 0,
    payrollEligible: true,
    payrollNotes: "",
  };
}

export function getDefaultClockingSettings(
  payType: EmployeePayType = "Flat Rate"
): TechnicianClockingSettings {
  const clockInRule = getDefaultClockInRule(payType);
  const clockOutRule = getDefaultClockOutRule(payType);

  return {
    clockInRule,
    clockOutRule,
    clockingPurpose: getDefaultClockingPurpose(payType),

    requiresModelSerialPhotoForClockIn:
      clockInRule === "Flat Rate - Job Clock In on model/serial picture",

    requiresCustomerSignatureForClockOut:
      clockOutRule === "Flat Rate - Job Clock Out on customer signature",

    allowsManualClockIn:
      clockInRule === "Flat Rate - Job Clock In on click" ||
      clockInRule === "Hourly - Daily Clock In" ||
      clockInRule === "Salary - Clock In on click",

    allowsManualClockOut:
      clockOutRule === "Flat Rate - Job Clock Out" ||
      clockOutRule === "Flat Rate - Job Clock Out on click" ||
      clockOutRule === "Hourly - Day Clock Out" ||
      clockOutRule === "Salary - Clock Out on click",

    clockingNotes: "",
  };
}

export function getDefaultBillingSettings(): TechnicianBillingSettings {
  return {
    canGenerateCustomerLaborCharges: true,
    defaultCustomerBillingMode: "Company Hourly",

    defaultCustomerLaborRate: 145,
    minimumLaborCharge: 0,
    flatJobLaborAmount: 0,

    billingNotes: "",
  };
}

export function getDefaultMetricSettings(): TechnicianMetricSettings {
  return {
    includedInCompanyMetrics: true,
    countsTowardLaborRevenue: true,
    countsTowardLaborHours: true,
    countsTowardUtilization: true,
    countsTowardEfficiency: true,
    countsTowardComebacks: true,
    countsTowardFirstTimeFixRate: true,
    countsTowardCustomerSatisfaction: true,

    metricNotes: "",
  };
}

export function createDefaultCompensationSettings(
  payType: EmployeePayType = "Flat Rate"
): TechnicianProfileCompensation {
  const now = new Date().toISOString();
  const compensationType = payType as unknown as TechnicianCompensationType;

  return {
    id: "default-compensation",
    type: compensationType,

    bonusEligible: false,
    effectiveDate: now,
    createdDate: now,
    updatedDate: now,

    payType,
    compensationType: payType,
    model: payType,
    payModel: payType,

    hourlyRate: 0,
    baseHourlyRate: 0,
    laborRate: 0,

    flatRatePayPercent: 0,
    flatRatePercentage: 0,
    flatRatePercent: 0,
    commissionRate: 0,

    salaryAnnualAmount: 0,
    annualSalary: 0,
    salaryAmount: 0,

    mileageRate: 0,
    perDiemRate: 0,

    payrollEligible: true,
    active: true,
  } as TechnicianProfileCompensation;
}

export function createDefaultTechnicianProfileInput(
  displayName = ""
): TechnicianProfileInput {
  const payType: EmployeePayType = "Flat Rate";

  return {
    userId: "",
    active: true,
    compensation: createDefaultCompensationSettings(payType),

    technicianNumber: "",
    employeeNumber: "",

    firstName: "",
    lastName: "",
    displayName,

    email: "",
    phone: "",

    status: "Active",
    role: "Technician",
    skillLevel: "Technician",

    territory: "",
    serviceVehicleId: "",
    serviceVehicleName: "",

    specialties: [],
    certifications: [],

    payrollSettings: getDefaultPayrollSettings(payType),
    clockingSettings: getDefaultClockingSettings(payType),
    billingSettings: getDefaultBillingSettings(),
    metricSettings: getDefaultMetricSettings(),

    notes: "",
  };
}