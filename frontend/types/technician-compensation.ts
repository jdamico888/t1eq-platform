export type TechnicianCompensationType =
  | "Flat Rate"
  | "Hourly"
  | "Salary";

export type TechnicianCompensation = {
  id: string;

  type: TechnicianCompensationType;

  flatRateMultiplier?: number;

  hourlyRate?: number;

  annualSalary?: number;

  mileageRate?: number;

  driveTimeRate?: number;

  commissionRate?: number;

  bonusEligible: boolean;

  effectiveDate: string;
  expirationDate?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};