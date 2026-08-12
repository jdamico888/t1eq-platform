export type EmployeeScheduleDayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type EmployeeAvailabilityStatus =
  | "Available"
  | "Unavailable"
  | "On Call"
  | "Limited";

export type EmployeeHolidayType =
  | "Company Holiday"
  | "Employee Holiday"
  | "Floating Holiday";

export type EmployeeVacationAccrualMethod =
  | "None"
  | "Hours Per Pay Period"
  | "Hours Per Month"
  | "Hours Per Year"
  | "Percent Of Hours Worked"
  | "Manual";

export type EmployeeVacationLedgerType =
  | "Earned"
  | "Used"
  | "Adjustment"
  | "Carryover"
  | "Expired";

export type EmployeeAbsenceCallStatus =
  | "Called In"
  | "Did Not Call In"
  | "Preapproved"
  | "Manager Entered";

export type EmployeeAbsenceReason =
  | "Sick"
  | "Forgotten Appointment"
  | "Childcare"
  | "Family Emergency"
  | "Transportation Issue"
  | "Weather"
  | "Personal"
  | "No Call No Show"
  | "Other";

export type EmployeeVacationSettings = {
  vacationEligible: boolean;

  accrualMethod: EmployeeVacationAccrualMethod;
  accrualRateHours: number;

  hoursPerVacationDay: number;
  annualVacationCapHours: number;
  carryoverLimitHours: number;

  startingVacationBalanceHours: number;
  accrualStartDate: string;

  vacationNotes: string;
};

export type EmployeeAvailabilityRule = {
  id: string;

  employeeProfileId: string;
  employeeDisplayName: string;

  dayOfWeek: EmployeeScheduleDayOfWeek;

  startTime: string;
  endTime: string;

  status: EmployeeAvailabilityStatus;

  effectiveStartDate: string;
  effectiveEndDate: string;

  notes: string;

  createdDate: string;
  updatedDate: string;
};

export type EmployeeHolidayRecord = {
  id: string;

  employeeProfileId: string;
  employeeDisplayName: string;

  holidayName: string;
  holidayType: EmployeeHolidayType;

  date: string;

  paid: boolean;
  countsAgainstVacation: boolean;
  hours: number;

  notes: string;

  createdDate: string;
  updatedDate: string;
};

export type EmployeeVacationLedgerEntry = {
  id: string;

  employeeProfileId: string;
  employeeDisplayName: string;

  entryType: EmployeeVacationLedgerType;

  date: string;
  hours: number;

  source:
    | "Daily Accrual"
    | "Manual Entry"
    | "Vacation Request"
    | "Holiday"
    | "Absence"
    | "System Adjustment";

  relatedRecordId: string;

  notes: string;

  createdDate: string;
  updatedDate: string;
};

export type EmployeeAbsenceRecord = {
  id: string;

  employeeProfileId: string;
  employeeDisplayName: string;

  missedDate: string;

  wasNormallyScheduled: boolean;
  scheduledStartTime: string;
  scheduledEndTime: string;

  callStatus: EmployeeAbsenceCallStatus;
  reason: EmployeeAbsenceReason;
  customReason: string;

  paid: boolean;
  usesVacationHours: boolean;
  vacationHoursUsed: number;

  managerNotes: string;

  createdDate: string;
  updatedDate: string;
};

export type EmployeeDailyAvailabilitySnapshot = {
  employeeProfileId: string;
  employeeDisplayName: string;

  date: string;
  dayOfWeek: EmployeeScheduleDayOfWeek;

  available: boolean;
  status: EmployeeAvailabilityStatus | "Holiday" | "Vacation" | "Absent";

  startTime: string;
  endTime: string;

  source:
    | "Recurring Availability"
    | "Holiday"
    | "Vacation Ledger"
    | "Absence Record"
    | "No Schedule";

  notes: string;
};

export type EmployeeVacationBalance = {
  employeeProfileId: string;
  employeeDisplayName: string;

  asOfDate: string;

  startingBalanceHours: number;
  earnedHours: number;
  usedHours: number;
  adjustmentHours: number;
  carryoverHours: number;
  expiredHours: number;

  availableBalanceHours: number;
  availableBalanceDays: number;
};

export type EmployeeScheduleStore = {
  availabilityRules: EmployeeAvailabilityRule[];
  holidayRecords: EmployeeHolidayRecord[];
  vacationLedgerEntries: EmployeeVacationLedgerEntry[];
  absenceRecords: EmployeeAbsenceRecord[];
};

export const employeeScheduleDayOfWeekOptions: EmployeeScheduleDayOfWeek[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const employeeAvailabilityStatusOptions: EmployeeAvailabilityStatus[] = [
  "Available",
  "Unavailable",
  "On Call",
  "Limited",
];

export const employeeHolidayTypeOptions: EmployeeHolidayType[] = [
  "Company Holiday",
  "Employee Holiday",
  "Floating Holiday",
];

export const employeeVacationAccrualMethodOptions: EmployeeVacationAccrualMethod[] =
  [
    "None",
    "Hours Per Pay Period",
    "Hours Per Month",
    "Hours Per Year",
    "Percent Of Hours Worked",
    "Manual",
  ];

export const employeeVacationLedgerTypeOptions: EmployeeVacationLedgerType[] = [
  "Earned",
  "Used",
  "Adjustment",
  "Carryover",
  "Expired",
];

export const employeeAbsenceCallStatusOptions: EmployeeAbsenceCallStatus[] = [
  "Called In",
  "Did Not Call In",
  "Preapproved",
  "Manager Entered",
];

export const employeeAbsenceReasonOptions: EmployeeAbsenceReason[] = [
  "Sick",
  "Forgotten Appointment",
  "Childcare",
  "Family Emergency",
  "Transportation Issue",
  "Weather",
  "Personal",
  "No Call No Show",
  "Other",
];

export function createDefaultEmployeeVacationSettings(): EmployeeVacationSettings {
  return {
    vacationEligible: false,

    accrualMethod: "None",
    accrualRateHours: 0,

    hoursPerVacationDay: 8,
    annualVacationCapHours: 0,
    carryoverLimitHours: 0,

    startingVacationBalanceHours: 0,
    accrualStartDate: "",

    vacationNotes: "",
  };
}