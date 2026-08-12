import type {
  EmployeeAbsenceCallStatus,
  EmployeeAbsenceReason,
  EmployeeAbsenceRecord,
  EmployeeAvailabilityRule,
  EmployeeAvailabilityStatus,
  EmployeeDailyAvailabilitySnapshot,
  EmployeeHolidayRecord,
  EmployeeHolidayType,
  EmployeeScheduleDayOfWeek,
  EmployeeScheduleStore,
  EmployeeVacationBalance,
  EmployeeVacationLedgerEntry,
  EmployeeVacationLedgerType,
  EmployeeVacationSettings,
} from "@/types/employee-schedule";

const employeeScheduleStorageKey = "t1eq-employee-schedule";

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

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDayOfWeek(dateString: string): EmployeeScheduleDayOfWeek {
  const date = new Date(`${dateString}T00:00:00`);

  const days: EmployeeScheduleDayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days[date.getDay()] ?? "Monday";
}

function normalizeDayOfWeek(value: unknown): EmployeeScheduleDayOfWeek {
  if (
    value === "Sunday" ||
    value === "Monday" ||
    value === "Tuesday" ||
    value === "Wednesday" ||
    value === "Thursday" ||
    value === "Friday" ||
    value === "Saturday"
  ) {
    return value;
  }

  return "Monday";
}

function normalizeAvailabilityStatus(
  value: unknown
): EmployeeAvailabilityStatus {
  if (
    value === "Unavailable" ||
    value === "On Call" ||
    value === "Limited"
  ) {
    return value;
  }

  return "Available";
}

function normalizeHolidayType(value: unknown): EmployeeHolidayType {
  if (value === "Employee Holiday" || value === "Floating Holiday") {
    return value;
  }

  return "Company Holiday";
}

function normalizeVacationLedgerType(
  value: unknown
): EmployeeVacationLedgerType {
  if (
    value === "Used" ||
    value === "Adjustment" ||
    value === "Carryover" ||
    value === "Expired"
  ) {
    return value;
  }

  return "Earned";
}

function normalizeAbsenceCallStatus(
  value: unknown
): EmployeeAbsenceCallStatus {
  if (
    value === "Did Not Call In" ||
    value === "Preapproved" ||
    value === "Manager Entered"
  ) {
    return value;
  }

  return "Called In";
}

function normalizeAbsenceReason(value: unknown): EmployeeAbsenceReason {
  if (
    value === "Forgotten Appointment" ||
    value === "Childcare" ||
    value === "Family Emergency" ||
    value === "Transportation Issue" ||
    value === "Weather" ||
    value === "Personal" ||
    value === "No Call No Show" ||
    value === "Other"
  ) {
    return value;
  }

  return "Sick";
}

function normalizeAvailabilityRule(value: unknown): EmployeeAvailabilityRule {
  const source = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  return {
    id: safeString(source.id, createId("availability")),

    employeeProfileId: safeString(source.employeeProfileId),
    employeeDisplayName: safeString(source.employeeDisplayName),

    dayOfWeek: normalizeDayOfWeek(source.dayOfWeek),

    startTime: safeString(source.startTime, "08:00"),
    endTime: safeString(source.endTime, "17:00"),

    status: normalizeAvailabilityStatus(source.status),

    effectiveStartDate: safeString(source.effectiveStartDate),
    effectiveEndDate: safeString(source.effectiveEndDate),

    notes: safeString(source.notes),

    createdDate: safeString(source.createdDate, now),
    updatedDate: safeString(source.updatedDate, now),
  };
}

function normalizeHolidayRecord(value: unknown): EmployeeHolidayRecord {
  const source = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  return {
    id: safeString(source.id, createId("holiday")),

    employeeProfileId: safeString(source.employeeProfileId),
    employeeDisplayName: safeString(source.employeeDisplayName),

    holidayName: safeString(source.holidayName, "Holiday"),
    holidayType: normalizeHolidayType(source.holidayType),

    date: safeString(source.date, getTodayDateString()),

    paid: safeBoolean(source.paid, true),
    countsAgainstVacation: safeBoolean(source.countsAgainstVacation),
    hours: safeNumber(source.hours, 8),

    notes: safeString(source.notes),

    createdDate: safeString(source.createdDate, now),
    updatedDate: safeString(source.updatedDate, now),
  };
}

function normalizeVacationLedgerEntry(
  value: unknown
): EmployeeVacationLedgerEntry {
  const source = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  return {
    id: safeString(source.id, createId("vacation-ledger")),

    employeeProfileId: safeString(source.employeeProfileId),
    employeeDisplayName: safeString(source.employeeDisplayName),

    entryType: normalizeVacationLedgerType(source.entryType),

    date: safeString(source.date, getTodayDateString()),
    hours: safeNumber(source.hours),

    source:
      source.source === "Manual Entry" ||
      source.source === "Vacation Request" ||
      source.source === "Holiday" ||
      source.source === "Absence" ||
      source.source === "System Adjustment"
        ? source.source
        : "Daily Accrual",

    relatedRecordId: safeString(source.relatedRecordId),

    notes: safeString(source.notes),

    createdDate: safeString(source.createdDate, now),
    updatedDate: safeString(source.updatedDate, now),
  };
}

function normalizeAbsenceRecord(value: unknown): EmployeeAbsenceRecord {
  const source = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  return {
    id: safeString(source.id, createId("absence")),

    employeeProfileId: safeString(source.employeeProfileId),
    employeeDisplayName: safeString(source.employeeDisplayName),

    missedDate: safeString(source.missedDate, getTodayDateString()),

    wasNormallyScheduled: safeBoolean(source.wasNormallyScheduled, true),
    scheduledStartTime: safeString(source.scheduledStartTime, "08:00"),
    scheduledEndTime: safeString(source.scheduledEndTime, "17:00"),

    callStatus: normalizeAbsenceCallStatus(source.callStatus),
    reason: normalizeAbsenceReason(source.reason),
    customReason: safeString(source.customReason),

    paid: safeBoolean(source.paid),
    usesVacationHours: safeBoolean(source.usesVacationHours),
    vacationHoursUsed: safeNumber(source.vacationHoursUsed),

    managerNotes: safeString(source.managerNotes),

    createdDate: safeString(source.createdDate, now),
    updatedDate: safeString(source.updatedDate, now),
  };
}

function createEmptyScheduleStore(): EmployeeScheduleStore {
  return {
    availabilityRules: [],
    holidayRecords: [],
    vacationLedgerEntries: [],
    absenceRecords: [],
  };
}

function normalizeScheduleStore(value: unknown): EmployeeScheduleStore {
  const source = isRecord(value) ? value : {};

  return {
    availabilityRules: Array.isArray(source.availabilityRules)
      ? source.availabilityRules.map(normalizeAvailabilityRule)
      : [],

    holidayRecords: Array.isArray(source.holidayRecords)
      ? source.holidayRecords.map(normalizeHolidayRecord)
      : [],

    vacationLedgerEntries: Array.isArray(source.vacationLedgerEntries)
      ? source.vacationLedgerEntries.map(normalizeVacationLedgerEntry)
      : [],

    absenceRecords: Array.isArray(source.absenceRecords)
      ? source.absenceRecords.map(normalizeAbsenceRecord)
      : [],
  };
}

export function getEmployeeScheduleStore(): EmployeeScheduleStore {
  if (typeof window === "undefined") {
    return createEmptyScheduleStore();
  }

  const storedValue = localStorage.getItem(employeeScheduleStorageKey);

  if (!storedValue) {
    return createEmptyScheduleStore();
  }

  try {
    return normalizeScheduleStore(JSON.parse(storedValue));
  } catch {
    return createEmptyScheduleStore();
  }
}

export function saveEmployeeScheduleStore(
  store: EmployeeScheduleStore
): EmployeeScheduleStore {
  const normalizedStore = normalizeScheduleStore(store);

  if (typeof window === "undefined") {
    return normalizedStore;
  }

  localStorage.setItem(
    employeeScheduleStorageKey,
    JSON.stringify(normalizedStore)
  );

  window.dispatchEvent(new Event("t1eq-employee-schedule-changed"));

  return normalizedStore;
}

export function getEmployeeAvailabilityRules(): EmployeeAvailabilityRule[] {
  return getEmployeeScheduleStore().availabilityRules;
}

export function saveEmployeeAvailabilityRule(
  input: Omit<EmployeeAvailabilityRule, "id" | "createdDate" | "updatedDate"> &
    Partial<Pick<EmployeeAvailabilityRule, "id" | "createdDate" | "updatedDate">>
): EmployeeAvailabilityRule {
  const store = getEmployeeScheduleStore();
  const now = new Date().toISOString();

  const rule = normalizeAvailabilityRule({
    ...input,
    id: input.id || createId("availability"),
    createdDate: input.createdDate || now,
    updatedDate: now,
  });

  const nextRules = store.availabilityRules.some((item) => item.id === rule.id)
    ? store.availabilityRules.map((item) => (item.id === rule.id ? rule : item))
    : [...store.availabilityRules, rule];

  saveEmployeeScheduleStore({
    ...store,
    availabilityRules: nextRules,
  });

  return rule;
}

export function deleteEmployeeAvailabilityRule(ruleId: string): void {
  const store = getEmployeeScheduleStore();

  saveEmployeeScheduleStore({
    ...store,
    availabilityRules: store.availabilityRules.filter(
      (rule) => rule.id !== ruleId
    ),
  });
}

export function getEmployeeHolidayRecords(): EmployeeHolidayRecord[] {
  return getEmployeeScheduleStore().holidayRecords;
}

export function saveEmployeeHolidayRecord(
  input: Omit<EmployeeHolidayRecord, "id" | "createdDate" | "updatedDate"> &
    Partial<Pick<EmployeeHolidayRecord, "id" | "createdDate" | "updatedDate">>
): EmployeeHolidayRecord {
  const store = getEmployeeScheduleStore();
  const now = new Date().toISOString();

  const holiday = normalizeHolidayRecord({
    ...input,
    id: input.id || createId("holiday"),
    createdDate: input.createdDate || now,
    updatedDate: now,
  });

  const nextHolidays = store.holidayRecords.some(
    (item) => item.id === holiday.id
  )
    ? store.holidayRecords.map((item) =>
        item.id === holiday.id ? holiday : item
      )
    : [...store.holidayRecords, holiday];

  saveEmployeeScheduleStore({
    ...store,
    holidayRecords: nextHolidays,
  });

  return holiday;
}

export function deleteEmployeeHolidayRecord(holidayId: string): void {
  const store = getEmployeeScheduleStore();

  saveEmployeeScheduleStore({
    ...store,
    holidayRecords: store.holidayRecords.filter(
      (holiday) => holiday.id !== holidayId
    ),
  });
}

export function getEmployeeVacationLedgerEntries(): EmployeeVacationLedgerEntry[] {
  return getEmployeeScheduleStore().vacationLedgerEntries;
}

export function saveEmployeeVacationLedgerEntry(
  input: Omit<
    EmployeeVacationLedgerEntry,
    "id" | "createdDate" | "updatedDate"
  > &
    Partial<
      Pick<EmployeeVacationLedgerEntry, "id" | "createdDate" | "updatedDate">
    >
): EmployeeVacationLedgerEntry {
  const store = getEmployeeScheduleStore();
  const now = new Date().toISOString();

  const entry = normalizeVacationLedgerEntry({
    ...input,
    id: input.id || createId("vacation-ledger"),
    createdDate: input.createdDate || now,
    updatedDate: now,
  });

  const nextEntries = store.vacationLedgerEntries.some(
    (item) => item.id === entry.id
  )
    ? store.vacationLedgerEntries.map((item) =>
        item.id === entry.id ? entry : item
      )
    : [...store.vacationLedgerEntries, entry];

  saveEmployeeScheduleStore({
    ...store,
    vacationLedgerEntries: nextEntries,
  });

  return entry;
}

export function deleteEmployeeVacationLedgerEntry(entryId: string): void {
  const store = getEmployeeScheduleStore();

  saveEmployeeScheduleStore({
    ...store,
    vacationLedgerEntries: store.vacationLedgerEntries.filter(
      (entry) => entry.id !== entryId
    ),
  });
}

export function getEmployeeAbsenceRecords(): EmployeeAbsenceRecord[] {
  return getEmployeeScheduleStore().absenceRecords;
}

export function saveEmployeeAbsenceRecord(
  input: Omit<EmployeeAbsenceRecord, "id" | "createdDate" | "updatedDate"> &
    Partial<Pick<EmployeeAbsenceRecord, "id" | "createdDate" | "updatedDate">>
): EmployeeAbsenceRecord {
  const store = getEmployeeScheduleStore();
  const now = new Date().toISOString();

  const absence = normalizeAbsenceRecord({
    ...input,
    id: input.id || createId("absence"),
    createdDate: input.createdDate || now,
    updatedDate: now,
  });

  const nextAbsences = store.absenceRecords.some(
    (item) => item.id === absence.id
  )
    ? store.absenceRecords.map((item) =>
        item.id === absence.id ? absence : item
      )
    : [...store.absenceRecords, absence];

  const nextVacationEntries =
    absence.usesVacationHours && absence.vacationHoursUsed > 0
      ? upsertAbsenceVacationLedgerEntry(
          store.vacationLedgerEntries,
          absence
        )
      : store.vacationLedgerEntries;

  saveEmployeeScheduleStore({
    ...store,
    absenceRecords: nextAbsences,
    vacationLedgerEntries: nextVacationEntries,
  });

  return absence;
}

function upsertAbsenceVacationLedgerEntry(
  entries: EmployeeVacationLedgerEntry[],
  absence: EmployeeAbsenceRecord
): EmployeeVacationLedgerEntry[] {
  const now = new Date().toISOString();

  const existingEntry = entries.find(
    (entry) =>
      entry.source === "Absence" && entry.relatedRecordId === absence.id
  );

  const ledgerEntry = normalizeVacationLedgerEntry({
    id: existingEntry?.id || createId("vacation-ledger"),
    employeeProfileId: absence.employeeProfileId,
    employeeDisplayName: absence.employeeDisplayName,
    entryType: "Used",
    date: absence.missedDate,
    hours: absence.vacationHoursUsed,
    source: "Absence",
    relatedRecordId: absence.id,
    notes: `Vacation used for missed scheduled day: ${
      absence.reason === "Other" ? absence.customReason : absence.reason
    }`,
    createdDate: existingEntry?.createdDate || now,
    updatedDate: now,
  });

  return existingEntry
    ? entries.map((entry) => (entry.id === existingEntry.id ? ledgerEntry : entry))
    : [...entries, ledgerEntry];
}

export function deleteEmployeeAbsenceRecord(absenceId: string): void {
  const store = getEmployeeScheduleStore();

  saveEmployeeScheduleStore({
    ...store,
    absenceRecords: store.absenceRecords.filter(
      (absence) => absence.id !== absenceId
    ),
    vacationLedgerEntries: store.vacationLedgerEntries.filter(
      (entry) =>
        !(entry.source === "Absence" && entry.relatedRecordId === absenceId)
    ),
  });
}

export function calculateEmployeeVacationBalance(
  employeeProfileId: string,
  employeeDisplayName: string,
  vacationSettings: EmployeeVacationSettings,
  asOfDate = getTodayDateString()
): EmployeeVacationBalance {
  const store = getEmployeeScheduleStore();

  const entries = store.vacationLedgerEntries.filter(
    (entry) =>
      entry.employeeProfileId === employeeProfileId && entry.date <= asOfDate
  );

  const earnedHours = entries
    .filter((entry) => entry.entryType === "Earned")
    .reduce((total, entry) => total + entry.hours, 0);

  const usedHours = entries
    .filter((entry) => entry.entryType === "Used")
    .reduce((total, entry) => total + entry.hours, 0);

  const adjustmentHours = entries
    .filter((entry) => entry.entryType === "Adjustment")
    .reduce((total, entry) => total + entry.hours, 0);

  const carryoverHours = entries
    .filter((entry) => entry.entryType === "Carryover")
    .reduce((total, entry) => total + entry.hours, 0);

  const expiredHours = entries
    .filter((entry) => entry.entryType === "Expired")
    .reduce((total, entry) => total + entry.hours, 0);

  const availableBalanceHours = Math.max(
    0,
    vacationSettings.startingVacationBalanceHours +
      earnedHours +
      adjustmentHours +
      carryoverHours -
      usedHours -
      expiredHours
  );

  const availableBalanceDays =
    vacationSettings.hoursPerVacationDay > 0
      ? Number(
          (availableBalanceHours / vacationSettings.hoursPerVacationDay).toFixed(
            2
          )
        )
      : 0;

  return {
    employeeProfileId,
    employeeDisplayName,

    asOfDate,

    startingBalanceHours: vacationSettings.startingVacationBalanceHours,
    earnedHours,
    usedHours,
    adjustmentHours,
    carryoverHours,
    expiredHours,

    availableBalanceHours,
    availableBalanceDays,
  };
}

export function getEmployeeDailyAvailabilitySnapshot(
  employeeProfileId: string,
  employeeDisplayName: string,
  date = getTodayDateString()
): EmployeeDailyAvailabilitySnapshot {
  const store = getEmployeeScheduleStore();
  const dayOfWeek = getDayOfWeek(date);

  const absence = store.absenceRecords.find(
    (record) =>
      record.employeeProfileId === employeeProfileId &&
      record.missedDate === date
  );

  if (absence) {
    return {
      employeeProfileId,
      employeeDisplayName,
      date,
      dayOfWeek,
      available: false,
      status: "Absent",
      startTime: absence.scheduledStartTime,
      endTime: absence.scheduledEndTime,
      source: "Absence Record",
      notes:
        absence.reason === "Other" ? absence.customReason : absence.reason,
    };
  }

  const holiday = store.holidayRecords.find(
    (record) =>
      record.date === date &&
      (!record.employeeProfileId ||
        record.employeeProfileId === employeeProfileId)
  );

  if (holiday) {
    return {
      employeeProfileId,
      employeeDisplayName,
      date,
      dayOfWeek,
      available: false,
      status: "Holiday",
      startTime: "",
      endTime: "",
      source: "Holiday",
      notes: holiday.holidayName,
    };
  }

  const matchingRule = store.availabilityRules.find((rule) => {
    if (rule.employeeProfileId !== employeeProfileId) {
      return false;
    }

    if (rule.dayOfWeek !== dayOfWeek) {
      return false;
    }

    if (rule.effectiveStartDate && rule.effectiveStartDate > date) {
      return false;
    }

    if (rule.effectiveEndDate && rule.effectiveEndDate < date) {
      return false;
    }

    return true;
  });

  if (!matchingRule) {
    return {
      employeeProfileId,
      employeeDisplayName,
      date,
      dayOfWeek,
      available: false,
      status: "Unavailable",
      startTime: "",
      endTime: "",
      source: "No Schedule",
      notes: "No availability rule found.",
    };
  }

  return {
    employeeProfileId,
    employeeDisplayName,
    date,
    dayOfWeek,
    available:
      matchingRule.status === "Available" || matchingRule.status === "On Call",
    status: matchingRule.status,
    startTime: matchingRule.startTime,
    endTime: matchingRule.endTime,
    source: "Recurring Availability",
    notes: matchingRule.notes,
  };
}

export function getAvailableEmployeeProfileIdsForWindow(
  date: string,
  startTime: string,
  endTime: string
): string[] {
  const store = getEmployeeScheduleStore();

  return store.availabilityRules
    .filter((rule) => {
      if (rule.dayOfWeek !== getDayOfWeek(date)) {
        return false;
      }

      if (rule.status !== "Available" && rule.status !== "On Call") {
        return false;
      }

      if (rule.effectiveStartDate && rule.effectiveStartDate > date) {
        return false;
      }

      if (rule.effectiveEndDate && rule.effectiveEndDate < date) {
        return false;
      }

      const holiday = store.holidayRecords.some(
        (record) =>
          record.date === date &&
          (!record.employeeProfileId ||
            record.employeeProfileId === rule.employeeProfileId)
      );

      if (holiday) {
        return false;
      }

      const absence = store.absenceRecords.some(
        (record) =>
          record.employeeProfileId === rule.employeeProfileId &&
          record.missedDate === date
      );

      if (absence) {
        return false;
      }

      return rule.startTime <= startTime && rule.endTime >= endTime;
    })
    .map((rule) => rule.employeeProfileId);
}