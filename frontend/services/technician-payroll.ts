import {
  calculateLaborEntryTotalAmount,
  calculateLaborEntryTotalHours,
  getLaborEntriesByTechnician,
} from "@/services/labor-entries";

import {
  calculateMileageReimbursementTotal,
  calculateMileageTotalMiles,
  getMileageEntriesByTechnician,
} from "@/services/mileage-entries";

import { getTechnicianProfileByUserId } from "@/services/technician-profiles";

import type { LaborEntry } from "@/types/labor-entry";
import type { MileageEntry } from "@/types/mileage-entry";
import type { TechnicianCompensation } from "@/types/technician-compensation";
import type { TechnicianProfile } from "@/types/technician-profile";

export type TechnicianPayrollSummary = {
  technicianId: string;
  technicianName?: string;

  compensationType?: TechnicianCompensation["type"];

  laborEntryCount: number;
  laborHours: number;
  laborAmount: number;

  mileageEntryCount: number;
  totalMiles: number;
  mileageReimbursement: number;

  flatRatePay: number;
  hourlyPay: number;
  salaryPay: number;

  grossPay: number;
};

const filterLaborEntriesByDateRange = (
  laborEntries: LaborEntry[],
  startDate?: string,
  endDate?: string
) => {
  if (!startDate && !endDate) return laborEntries;

  const startTime = startDate ? new Date(startDate).getTime() : 0;

  const endTime = endDate
    ? new Date(endDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  return laborEntries.filter((laborEntry) => {
    const entryTime = new Date(laborEntry.clockInDateTime).getTime();

    return entryTime >= startTime && entryTime <= endTime;
  });
};

const filterMileageEntriesByDateRange = (
  mileageEntries: MileageEntry[],
  startDate?: string,
  endDate?: string
) => {
  if (!startDate && !endDate) return mileageEntries;

  const startTime = startDate ? new Date(startDate).getTime() : 0;

  const endTime = endDate
    ? new Date(endDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  return mileageEntries.filter((mileageEntry) => {
    const entryTime = new Date(mileageEntry.createdDate).getTime();

    return entryTime >= startTime && entryTime <= endTime;
  });
};

const calculateFlatRatePay = (
  laborAmount: number,
  compensation?: TechnicianCompensation
) => {
  if (!compensation || compensation.type !== "Flat Rate") {
    return 0;
  }

  return laborAmount * (compensation.flatRateMultiplier ?? 1);
};

const calculateHourlyPay = (
  laborHours: number,
  compensation?: TechnicianCompensation
) => {
  if (!compensation || compensation.type !== "Hourly") {
    return 0;
  }

  return laborHours * (compensation.hourlyRate ?? 0);
};

const calculateSalaryPay = (
  compensation?: TechnicianCompensation
) => {
  if (!compensation || compensation.type !== "Salary") {
    return 0;
  }

  return 0;
};

export const calculateTechnicianPayrollSummary = (
  technicianProfile: TechnicianProfile,
  startDate?: string,
  endDate?: string
): TechnicianPayrollSummary => {
  const compensation = technicianProfile.compensation;

  const laborEntries = filterLaborEntriesByDateRange(
    getLaborEntriesByTechnician(technicianProfile.userId),
    startDate,
    endDate
  );

  const mileageEntries = filterMileageEntriesByDateRange(
    getMileageEntriesByTechnician(technicianProfile.userId),
    startDate,
    endDate
  );

  const technicianName =
    laborEntries[0]?.technicianName || mileageEntries[0]?.technicianName;

  const laborHours = calculateLaborEntryTotalHours(laborEntries);
  const laborAmount = calculateLaborEntryTotalAmount(laborEntries);

  const totalMiles = calculateMileageTotalMiles(mileageEntries);
  const mileageReimbursement = calculateMileageReimbursementTotal(mileageEntries);

  const flatRatePay = calculateFlatRatePay(laborAmount, compensation);
  const hourlyPay = calculateHourlyPay(laborHours, compensation);
  const salaryPay = calculateSalaryPay(compensation);

  const grossPay =
    flatRatePay + hourlyPay + salaryPay + mileageReimbursement;

  return {
    technicianId: technicianProfile.userId,
    technicianName,

    compensationType: compensation.type,

    laborEntryCount: laborEntries.length,
    laborHours,
    laborAmount,

    mileageEntryCount: mileageEntries.length,
    totalMiles,
    mileageReimbursement,

    flatRatePay,
    hourlyPay,
    salaryPay,

    grossPay,
  };
};

export const calculateTechnicianPayrollSummaryByUserId = (
  userId: string,
  startDate?: string,
  endDate?: string
): TechnicianPayrollSummary | null => {
  const technicianProfile = getTechnicianProfileByUserId(userId);

  if (!technicianProfile) {
    return null;
  }

  return calculateTechnicianPayrollSummary(
    technicianProfile,
    startDate,
    endDate
  );
};