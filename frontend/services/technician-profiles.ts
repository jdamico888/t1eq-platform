import type {
  EmployeePayType,
  TechnicianProfile,
  TechnicianProfileCompensation,
  TechnicianProfileInput,
} from "@/types/technician-profile";

import {
  createDefaultCompensationSettings,
  createDefaultTechnicianProfileInput,
  getDefaultBillingSettings,
  getDefaultClockingSettings,
  getDefaultMetricSettings,
  getDefaultPayrollSettings,
} from "@/types/technician-profile";

const technicianProfilesStorageKey = "t1eq-technician-profiles";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePayType(value: unknown): EmployeePayType {
  if (value === "Hourly") {
    return "Hourly";
  }

  if (value === "Salary") {
    return "Salary";
  }

  return "Flat Rate";
}

function getProfileDisplayName(profile: UnknownRecord): string {
  const displayName = safeString(profile.displayName).trim();

  if (displayName) {
    return displayName;
  }

  const firstName = safeString(profile.firstName).trim();
  const lastName = safeString(profile.lastName).trim();
  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) {
    return combinedName;
  }

  const name = safeString(profile.name).trim();

  if (name) {
    return name;
  }

  return "Unnamed Technician";
}

function getCompensationPayType(
  compensation: UnknownRecord | undefined
): EmployeePayType {
  if (!compensation) {
    return "Flat Rate";
  }

  return normalizePayType(
    compensation.payType ??
      compensation.compensationType ??
      compensation.type ??
      compensation.model ??
      compensation.payModel
  );
}

function normalizeCompensation(
  value: unknown,
  payType: EmployeePayType
): TechnicianProfileCompensation {
  const source = isRecord(value) ? value : {};
  const fallback = createDefaultCompensationSettings(payType);

  return {
    ...fallback,
    ...source,

    id: safeString(source.id, fallback.id),
    type: source.type ?? fallback.type,

    bonusEligible: safeBoolean(source.bonusEligible, fallback.bonusEligible),
    effectiveDate: safeString(source.effectiveDate, fallback.effectiveDate),
    createdDate: safeString(source.createdDate, fallback.createdDate),
    updatedDate: safeString(source.updatedDate, fallback.updatedDate),

    payType,
    compensationType: safeString(source.compensationType, payType),
    model: safeString(source.model, payType),
    payModel: safeString(source.payModel, payType),

    hourlyRate: safeNumber(source.hourlyRate, fallback.hourlyRate),
    baseHourlyRate: safeNumber(
      source.baseHourlyRate,
      fallback.baseHourlyRate
    ),
    laborRate: safeNumber(source.laborRate, fallback.laborRate),

    flatRatePayPercent: safeNumber(
      source.flatRatePayPercent,
      fallback.flatRatePayPercent
    ),
    flatRatePercentage: safeNumber(
      source.flatRatePercentage,
      fallback.flatRatePercentage
    ),
    flatRatePercent: safeNumber(
      source.flatRatePercent,
      fallback.flatRatePercent
    ),
    commissionRate: safeNumber(source.commissionRate, fallback.commissionRate),

    salaryAnnualAmount: safeNumber(
      source.salaryAnnualAmount,
      fallback.salaryAnnualAmount
    ),
    annualSalary: safeNumber(source.annualSalary, fallback.annualSalary),
    salaryAmount: safeNumber(source.salaryAmount, fallback.salaryAmount),

    mileageRate: safeNumber(source.mileageRate, fallback.mileageRate),
    perDiemRate: safeNumber(source.perDiemRate, fallback.perDiemRate),

    payrollEligible: safeBoolean(
      source.payrollEligible,
      fallback.payrollEligible
    ),
    active: safeBoolean(source.active, fallback.active),
  } as TechnicianProfileCompensation;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => safeString(entry).trim())
    .filter((entry) => entry.length > 0);
}

export function normalizeTechnicianProfile(value: unknown): TechnicianProfile {
  const source = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  const displayName = getProfileDisplayName(source);
  const compensationSource = isRecord(source.compensation)
    ? source.compensation
    : undefined;
  const payType = getCompensationPayType(compensationSource);

  const defaultProfile = createDefaultTechnicianProfileInput(displayName);
  const payrollSettingsSource = isRecord(source.payrollSettings)
    ? source.payrollSettings
    : {};
  const clockingSettingsSource = isRecord(source.clockingSettings)
    ? source.clockingSettings
    : {};
  const billingSettingsSource = isRecord(source.billingSettings)
    ? source.billingSettings
    : {};
  const metricSettingsSource = isRecord(source.metricSettings)
    ? source.metricSettings
    : {};

  const payrollSettings = {
    ...getDefaultPayrollSettings(payType),
    ...payrollSettingsSource,
    payType,
    hourlyPayRate: safeNumber(
      payrollSettingsSource.hourlyPayRate,
      safeNumber(compensationSource?.hourlyRate)
    ),
    flatRatePayPercent: safeNumber(
      payrollSettingsSource.flatRatePayPercent,
      safeNumber(compensationSource?.flatRatePayPercent)
    ),
    salaryAnnualAmount: safeNumber(
      payrollSettingsSource.salaryAnnualAmount,
      safeNumber(compensationSource?.salaryAnnualAmount)
    ),
    payrollEligible: safeBoolean(
      payrollSettingsSource.payrollEligible,
      safeBoolean(compensationSource?.payrollEligible, true)
    ),
    payrollNotes: safeString(payrollSettingsSource.payrollNotes),
  };

  const clockingSettings = {
    ...getDefaultClockingSettings(payType),
    ...clockingSettingsSource,
  };

  const billingSettings = {
    ...getDefaultBillingSettings(),
    ...billingSettingsSource,
    defaultCustomerLaborRate: safeNumber(
      billingSettingsSource.defaultCustomerLaborRate,
      safeNumber(compensationSource?.laborRate, 145)
    ),
    minimumLaborCharge: safeNumber(billingSettingsSource.minimumLaborCharge),
    flatJobLaborAmount: safeNumber(billingSettingsSource.flatJobLaborAmount),
    canGenerateCustomerLaborCharges: safeBoolean(
      billingSettingsSource.canGenerateCustomerLaborCharges,
      true
    ),
    billingNotes: safeString(billingSettingsSource.billingNotes),
  };

  const metricSettings = {
    ...getDefaultMetricSettings(),
    ...metricSettingsSource,
  };

  return {
    id: safeString(source.id, createId("technician")),

    userId: safeString(source.userId, safeString(source.id)),
    active: safeBoolean(source.active, true),
    compensation: normalizeCompensation(source.compensation, payType),

    technicianNumber: safeString(
      source.technicianNumber,
      defaultProfile.technicianNumber
    ),
    employeeNumber: safeString(
      source.employeeNumber,
      defaultProfile.employeeNumber
    ),

    firstName: safeString(source.firstName, defaultProfile.firstName),
    lastName: safeString(source.lastName, defaultProfile.lastName),
    displayName,

    email: safeString(source.email, defaultProfile.email),
    phone: safeString(source.phone, defaultProfile.phone),

    status:
      source.status === "Inactive" || source.status === "Suspended"
        ? source.status
        : "Active",

    role:
      source.role === "Lead Technician" ||
      source.role === "Inspector" ||
      source.role === "Service Manager" ||
      source.role === "Owner" ||
      source.role === "Admin"
        ? source.role
        : "Technician",

    skillLevel:
      source.skillLevel === "Apprentice" ||
      source.skillLevel === "Senior Technician" ||
      source.skillLevel === "Master Technician" ||
      source.skillLevel === "Specialist"
        ? source.skillLevel
        : "Technician",

    territory: safeString(source.territory, defaultProfile.territory),
    serviceVehicleId: safeString(
      source.serviceVehicleId,
      defaultProfile.serviceVehicleId
    ),
    serviceVehicleName: safeString(
      source.serviceVehicleName,
      defaultProfile.serviceVehicleName
    ),

    specialties: normalizeStringArray(source.specialties),
    certifications: normalizeStringArray(source.certifications),

    payrollSettings,
    clockingSettings,
    billingSettings,
    metricSettings,

    notes: safeString(source.notes, defaultProfile.notes),

    createdDate: safeString(source.createdDate, now),
    updatedDate: safeString(source.updatedDate, now),
  };
}

export function getTechnicianProfiles(): TechnicianProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(technicianProfilesStorageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const normalizedProfiles = parsedValue.map(normalizeTechnicianProfile);
    saveTechnicianProfiles(normalizedProfiles);

    return normalizedProfiles;
  } catch {
    return [];
  }
}

export function saveTechnicianProfiles(
  technicianProfiles: TechnicianProfile[]
): TechnicianProfile[] {
  if (typeof window === "undefined") {
    return technicianProfiles;
  }

  const normalizedProfiles = technicianProfiles.map(normalizeTechnicianProfile);

  localStorage.setItem(
    technicianProfilesStorageKey,
    JSON.stringify(normalizedProfiles)
  );

  window.dispatchEvent(new Event("t1eq-technician-profiles-changed"));

  return normalizedProfiles;
}

export function createTechnicianProfile(
  input: TechnicianProfileInput
): TechnicianProfile {
  const now = new Date().toISOString();

  const technicianProfile = normalizeTechnicianProfile({
    ...input,
    id: createId("technician"),
    createdDate: now,
    updatedDate: now,
  });

  const technicianProfiles = getTechnicianProfiles();

  saveTechnicianProfiles([...technicianProfiles, technicianProfile]);

  return technicianProfile;
}

export function updateTechnicianProfile(
  technicianProfileId: string,
  updates: Partial<TechnicianProfileInput>
): TechnicianProfile | null {
  const technicianProfiles = getTechnicianProfiles();
  const existingProfile = technicianProfiles.find(
    (technicianProfile) => technicianProfile.id === technicianProfileId
  );

  if (!existingProfile) {
    return null;
  }

  const updatedProfile = normalizeTechnicianProfile({
    ...existingProfile,
    ...updates,
    updatedDate: new Date().toISOString(),
  });

  const nextTechnicianProfiles = technicianProfiles.map((technicianProfile) =>
    technicianProfile.id === technicianProfileId
      ? updatedProfile
      : technicianProfile
  );

  saveTechnicianProfiles(nextTechnicianProfiles);

  return updatedProfile;
}

export function deleteTechnicianProfile(technicianProfileId: string): void {
  const nextTechnicianProfiles = getTechnicianProfiles().filter(
    (technicianProfile) => technicianProfile.id !== technicianProfileId
  );

  saveTechnicianProfiles(nextTechnicianProfiles);
}

export function getTechnicianProfileById(
  technicianProfileId: string
): TechnicianProfile | undefined {
  return getTechnicianProfiles().find(
    (technicianProfile) => technicianProfile.id === technicianProfileId
  );
}

export function getTechnicianProfileByUserId(
  userId: string
): TechnicianProfile | undefined {
  return getTechnicianProfiles().find(
    (technicianProfile) => technicianProfile.userId === userId
  );
}

export function getTechnicianProfileByDisplayName(
  displayName: string
): TechnicianProfile | undefined {
  const normalizedDisplayName = displayName.trim().toLowerCase();

  return getTechnicianProfiles().find(
    (technicianProfile) =>
      technicianProfile.displayName.trim().toLowerCase() ===
      normalizedDisplayName
  );
}

export function getActiveTechnicianProfiles(): TechnicianProfile[] {
  return getTechnicianProfiles().filter(
    (technicianProfile) =>
      technicianProfile.active && technicianProfile.status === "Active"
  );
}

export function searchTechnicianProfiles(search: string): TechnicianProfile[] {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return getTechnicianProfiles();
  }

  return getTechnicianProfiles().filter((technicianProfile) => {
    const searchableFields = [
      technicianProfile.technicianNumber,
      technicianProfile.employeeNumber,
      technicianProfile.firstName,
      technicianProfile.lastName,
      technicianProfile.displayName,
      technicianProfile.email,
      technicianProfile.phone,
      technicianProfile.status,
      technicianProfile.role,
      technicianProfile.skillLevel,
      technicianProfile.territory,
      technicianProfile.serviceVehicleName,
      technicianProfile.notes,
      ...technicianProfile.specialties,
      ...technicianProfile.certifications,
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(normalizedSearch)
    );
  });
}

export function seedTechnicianProfile(
  displayName: string
): TechnicianProfile {
  const input = createDefaultTechnicianProfileInput(displayName);

  return createTechnicianProfile(input);
}