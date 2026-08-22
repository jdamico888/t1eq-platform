"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTechnicianProfiles } from "@/services/technician-profiles";

import {
  deleteEmployeeAbsenceRecord,
  deleteEmployeeAvailabilityRule,
  deleteEmployeeHolidayRecord,
  deleteEmployeeVacationLedgerEntry,
  getEmployeeAbsenceRecords,
  getEmployeeAvailabilityRules,
  getEmployeeHolidayRecords,
  getEmployeeVacationLedgerEntries,
  saveEmployeeAbsenceRecord,
  saveEmployeeAvailabilityRule,
  saveEmployeeHolidayRecord,
  saveEmployeeVacationLedgerEntry,
} from "@/services/employee-schedule";

import type { TechnicianProfile } from "@/types/technician-profile";

import {
  employeeAbsenceCallStatusOptions,
  employeeAbsenceReasonOptions,
  employeeAvailabilityStatusOptions,
  employeeHolidayTypeOptions,
  employeeScheduleDayOfWeekOptions,
  employeeVacationLedgerTypeOptions,
  type EmployeeAbsenceCallStatus,
  type EmployeeAbsenceReason,
  type EmployeeAbsenceRecord,
  type EmployeeAvailabilityRule,
  type EmployeeAvailabilityStatus,
  type EmployeeHolidayRecord,
  type EmployeeHolidayType,
  type EmployeeScheduleDayOfWeek,
  type EmployeeVacationLedgerEntry,
  type EmployeeVacationLedgerType,
} from "@/types/employee-schedule";

type VacationLedgerSource = EmployeeVacationLedgerEntry["source"];

type AvailabilityFormState = {
  dayOfWeek: EmployeeScheduleDayOfWeek;
  startTime: string;
  endTime: string;
  status: EmployeeAvailabilityStatus;
  effectiveStartDate: string;
  effectiveEndDate: string;
  notes: string;
};

type HolidayFormState = {
  holidayName: string;
  holidayType: EmployeeHolidayType;
  date: string;
  paid: boolean;
  countsAgainstVacation: boolean;
  hours: number;
  notes: string;
};

type VacationLedgerFormState = {
  entryType: EmployeeVacationLedgerType;
  date: string;
  hours: number;
  source: VacationLedgerSource;
  relatedRecordId: string;
  notes: string;
};

type AbsenceFormState = {
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
};

type DailySnapshotView = {
  available: boolean;
  status: string;
  startTime: string;
  endTime: string;
  source: string;
  notes: string;
};

type VacationBalanceView = {
  startingBalanceHours: number;
  projectedEarnedHours: number;
  ledgerEarnedHours: number;
  usedHours: number;
  adjustmentHours: number;
  carryoverHours: number;
  expiredHours: number;
  availableBalanceHours: number;
  availableBalanceDays: number;
};

const vacationLedgerSourceOptions: VacationLedgerSource[] = [
  "Daily Accrual",
  "Manual Entry",
  "Vacation Request",
  "Holiday",
  "Absence",
  "System Adjustment",
];

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatHours(value: number): string {
  return `${value.toFixed(2)} hrs`;
}

function getDayOfWeekFromDate(date: string): EmployeeScheduleDayOfWeek {
  const parsedDate = new Date(`${date}T00:00:00`);
  const dayIndex = parsedDate.getDay();

  return employeeScheduleDayOfWeekOptions[dayIndex] ?? "Monday";
}

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }

  return Math.floor((end - start) / 86_400_000) + 1;
}

function createDefaultAvailabilityForm(): AvailabilityFormState {
  return {
    dayOfWeek: "Monday",
    startTime: "08:00",
    endTime: "17:00",
    status: "Available",
    effectiveStartDate: todayInputValue(),
    effectiveEndDate: "",
    notes: "",
  };
}

function createDefaultHolidayForm(): HolidayFormState {
  return {
    holidayName: "",
    holidayType: "Company Holiday",
    date: todayInputValue(),
    paid: true,
    countsAgainstVacation: false,
    hours: 8,
    notes: "",
  };
}

function createDefaultVacationLedgerForm(): VacationLedgerFormState {
  return {
    entryType: "Used",
    date: todayInputValue(),
    hours: 8,
    source: "Vacation Request",
    relatedRecordId: "",
    notes: "",
  };
}

function createDefaultAbsenceForm(): AbsenceFormState {
  return {
    missedDate: todayInputValue(),
    wasNormallyScheduled: true,
    scheduledStartTime: "08:00",
    scheduledEndTime: "17:00",
    callStatus: "Called In",
    reason: "Sick",
    customReason: "",
    paid: false,
    usesVacationHours: false,
    vacationHoursUsed: 0,
    managerNotes: "",
  };
}

function isRecordEffectiveOnDate(
  startDate: string,
  endDate: string,
  targetDate: string
): boolean {
  if (startDate && startDate > targetDate) {
    return false;
  }

  if (endDate && endDate < targetDate) {
    return false;
  }

  return true;
}

function calculateProjectedVacationEarnedHours(
  employee: TechnicianProfile,
  asOfDate: string
): number {
  const settings = employee.vacationSettings;

  if (!settings.vacationEligible || settings.accrualMethod === "None") {
    return 0;
  }

  if (
    settings.accrualMethod === "Manual" ||
    settings.accrualMethod === "Percent Of Hours Worked"
  ) {
    return 0;
  }

  const accrualStartDate = settings.accrualStartDate || asOfDate;
  const daysElapsed = getDaysBetween(accrualStartDate, asOfDate);
  const rate = settings.accrualRateHours;

  if (daysElapsed <= 0 || rate <= 0) {
    return 0;
  }

  if (settings.accrualMethod === "Hours Per Year") {
    return (rate / 365) * daysElapsed;
  }

  if (settings.accrualMethod === "Hours Per Month") {
    return (rate / 30.4375) * daysElapsed;
  }

  if (settings.accrualMethod === "Hours Per Pay Period") {
    return (rate / (365 / 26)) * daysElapsed;
  }

  return 0;
}

function calculateVacationBalance(
  employee: TechnicianProfile,
  entries: EmployeeVacationLedgerEntry[],
  asOfDate: string
): VacationBalanceView {
  const settings = employee.vacationSettings;

  const projectedEarnedHours = calculateProjectedVacationEarnedHours(
    employee,
    asOfDate
  );

  const scopedEntries = entries.filter((entry) => entry.date <= asOfDate);

  const ledgerEarnedHours = scopedEntries
    .filter((entry) => entry.entryType === "Earned")
    .reduce((total, entry) => total + entry.hours, 0);

  const usedHours = scopedEntries
    .filter((entry) => entry.entryType === "Used")
    .reduce((total, entry) => total + entry.hours, 0);

  const adjustmentHours = scopedEntries
    .filter((entry) => entry.entryType === "Adjustment")
    .reduce((total, entry) => total + entry.hours, 0);

  const carryoverHours = scopedEntries
    .filter((entry) => entry.entryType === "Carryover")
    .reduce((total, entry) => total + entry.hours, 0);

  const expiredHours = scopedEntries
    .filter((entry) => entry.entryType === "Expired")
    .reduce((total, entry) => total + entry.hours, 0);

  const uncappedBalance =
    settings.startingVacationBalanceHours +
    projectedEarnedHours +
    ledgerEarnedHours +
    adjustmentHours +
    carryoverHours -
    usedHours -
    expiredHours;

  const availableBalanceHours =
    settings.annualVacationCapHours > 0
      ? Math.min(uncappedBalance, settings.annualVacationCapHours)
      : uncappedBalance;

  const hoursPerVacationDay =
    settings.hoursPerVacationDay > 0 ? settings.hoursPerVacationDay : 8;

  return {
    startingBalanceHours: settings.startingVacationBalanceHours,
    projectedEarnedHours,
    ledgerEarnedHours,
    usedHours,
    adjustmentHours,
    carryoverHours,
    expiredHours,
    availableBalanceHours,
    availableBalanceDays: availableBalanceHours / hoursPerVacationDay,
  };
}

function buildDailySnapshot(
  employee: TechnicianProfile,
  date: string,
  availabilityRules: EmployeeAvailabilityRule[],
  holidayRecords: EmployeeHolidayRecord[],
  vacationLedgerEntries: EmployeeVacationLedgerEntry[],
  absenceRecords: EmployeeAbsenceRecord[]
): DailySnapshotView {
  const absence = absenceRecords.find((record) => record.missedDate === date);

  if (absence) {
    return {
      available: false,
      status: "Absent",
      startTime: absence.scheduledStartTime,
      endTime: absence.scheduledEndTime,
      source: "Absence Record",
      notes:
        absence.reason === "Other"
          ? absence.customReason || absence.managerNotes
          : `${absence.reason} · ${absence.callStatus}`,
    };
  }

  const holiday = holidayRecords.find((record) => record.date === date);

  if (holiday) {
    return {
      available: false,
      status: "Holiday",
      startTime: "",
      endTime: "",
      source: holiday.holidayType,
      notes: holiday.holidayName,
    };
  }

  const vacationEntry = vacationLedgerEntries.find(
    (entry) => entry.date === date && entry.entryType === "Used"
  );

  if (vacationEntry) {
    return {
      available: false,
      status: "Vacation",
      startTime: "",
      endTime: "",
      source: vacationEntry.source,
      notes: vacationEntry.notes,
    };
  }

  const dayOfWeek = getDayOfWeekFromDate(date);

  const matchingRule = availabilityRules.find(
    (rule) =>
      rule.employeeProfileId === employee.id &&
      rule.dayOfWeek === dayOfWeek &&
      isRecordEffectiveOnDate(
        rule.effectiveStartDate,
        rule.effectiveEndDate,
        date
      )
  );

  if (!matchingRule) {
    return {
      available: false,
      status: "No Schedule",
      startTime: "",
      endTime: "",
      source: "No Schedule",
      notes: "No recurring availability rule is active for this date.",
    };
  }

  return {
    available:
      matchingRule.status === "Available" || matchingRule.status === "On Call",
    status: matchingRule.status,
    startTime: matchingRule.startTime,
    endTime: matchingRule.endTime,
    source: "Recurring Availability",
    notes: matchingRule.notes,
  };
}

export default function EmployeeSchedulePage() {
  const [employees, setEmployees] = useState<TechnicianProfile[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(todayInputValue());

  const [availabilityRules, setAvailabilityRules] = useState<
    EmployeeAvailabilityRule[]
  >([]);
  const [holidayRecords, setHolidayRecords] = useState<EmployeeHolidayRecord[]>(
    []
  );
  const [vacationLedgerEntries, setVacationLedgerEntries] = useState<
    EmployeeVacationLedgerEntry[]
  >([]);
  const [absenceRecords, setAbsenceRecords] = useState<EmployeeAbsenceRecord[]>(
    []
  );

  const [availabilityForm, setAvailabilityForm] =
    useState<AvailabilityFormState>(() => createDefaultAvailabilityForm());
  const [holidayForm, setHolidayForm] = useState<HolidayFormState>(() =>
    createDefaultHolidayForm()
  );
  const [vacationLedgerForm, setVacationLedgerForm] =
    useState<VacationLedgerFormState>(() => createDefaultVacationLedgerForm());
  const [absenceForm, setAbsenceForm] = useState<AbsenceFormState>(() =>
    createDefaultAbsenceForm()
  );

  function loadEmployees() {
    const loadedEmployees = getTechnicianProfiles();
    setEmployees(loadedEmployees);

    const queryEmployeeId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("employeeProfileId")
        : "";

    const matchingQueryEmployee = loadedEmployees.find(
      (employee) => employee.id === queryEmployeeId
    );

    if (matchingQueryEmployee) {
      setSelectedEmployeeId(matchingQueryEmployee.id);
      return;
    }

    if (!selectedEmployeeId && loadedEmployees.length > 0) {
      setSelectedEmployeeId(loadedEmployees[0].id);
    }
  }

  function loadScheduleRecords() {
    setAvailabilityRules(getEmployeeAvailabilityRules());
    setHolidayRecords(getEmployeeHolidayRecords());
    setVacationLedgerEntries(getEmployeeVacationLedgerEntries());
    setAbsenceRecords(getEmployeeAbsenceRecords());
  }

  useEffect(() => {
    loadEmployees();
    loadScheduleRecords();
  }, []);

  const selectedEmployee = useMemo(() => {
    return (
      employees.find((employee) => employee.id === selectedEmployeeId) ?? null
    );
  }, [employees, selectedEmployeeId]);

  const selectedAvailabilityRules = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return availabilityRules.filter(
      (rule) => rule.employeeProfileId === selectedEmployee.id
    );
  }, [availabilityRules, selectedEmployee]);

  const selectedHolidayRecords = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return holidayRecords.filter(
      (record) => record.employeeProfileId === selectedEmployee.id
    );
  }, [holidayRecords, selectedEmployee]);

  const selectedVacationLedgerEntries = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return vacationLedgerEntries.filter(
      (entry) => entry.employeeProfileId === selectedEmployee.id
    );
  }, [vacationLedgerEntries, selectedEmployee]);

  const selectedAbsenceRecords = useMemo(() => {
    if (!selectedEmployee) {
      return [];
    }

    return absenceRecords.filter(
      (record) => record.employeeProfileId === selectedEmployee.id
    );
  }, [absenceRecords, selectedEmployee]);

  const vacationBalance = useMemo(() => {
    if (!selectedEmployee) {
      return null;
    }

    return calculateVacationBalance(
      selectedEmployee,
      selectedVacationLedgerEntries,
      snapshotDate
    );
  }, [selectedEmployee, selectedVacationLedgerEntries, snapshotDate]);

  const dailySnapshot = useMemo(() => {
    if (!selectedEmployee) {
      return null;
    }

    return buildDailySnapshot(
      selectedEmployee,
      snapshotDate,
      selectedAvailabilityRules,
      selectedHolidayRecords,
      selectedVacationLedgerEntries,
      selectedAbsenceRecords
    );
  }, [
    selectedEmployee,
    snapshotDate,
    selectedAvailabilityRules,
    selectedHolidayRecords,
    selectedVacationLedgerEntries,
    selectedAbsenceRecords,
  ]);

  function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployee) {
      return;
    }

    const now = new Date().toISOString();

    saveEmployeeAvailabilityRule({
      id: createId("availability"),
      employeeProfileId: selectedEmployee.id,
      employeeDisplayName: selectedEmployee.displayName,
      ...availabilityForm,
      createdDate: now,
      updatedDate: now,
    });

    setAvailabilityForm(createDefaultAvailabilityForm());
    loadScheduleRecords();
  }

  function handleHolidaySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployee || !holidayForm.holidayName.trim()) {
      return;
    }

    const now = new Date().toISOString();

    saveEmployeeHolidayRecord({
      id: createId("holiday"),
      employeeProfileId: selectedEmployee.id,
      employeeDisplayName: selectedEmployee.displayName,
      ...holidayForm,
      holidayName: holidayForm.holidayName.trim(),
      createdDate: now,
      updatedDate: now,
    });

    setHolidayForm(createDefaultHolidayForm());
    loadScheduleRecords();
  }

  function handleVacationLedgerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployee || vacationLedgerForm.hours <= 0) {
      return;
    }

    const now = new Date().toISOString();

    saveEmployeeVacationLedgerEntry({
      id: createId("vacation-ledger"),
      employeeProfileId: selectedEmployee.id,
      employeeDisplayName: selectedEmployee.displayName,
      ...vacationLedgerForm,
      createdDate: now,
      updatedDate: now,
    });

    setVacationLedgerForm(createDefaultVacationLedgerForm());
    loadScheduleRecords();
  }

  function handleAbsenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployee) {
      return;
    }

    const now = new Date().toISOString();

    saveEmployeeAbsenceRecord({
      id: createId("absence"),
      employeeProfileId: selectedEmployee.id,
      employeeDisplayName: selectedEmployee.displayName,
      ...absenceForm,
      createdDate: now,
      updatedDate: now,
    });

    if (absenceForm.usesVacationHours && absenceForm.vacationHoursUsed > 0) {
      saveEmployeeVacationLedgerEntry({
        id: createId("vacation-ledger"),
        employeeProfileId: selectedEmployee.id,
        employeeDisplayName: selectedEmployee.displayName,
        entryType: "Used",
        date: absenceForm.missedDate,
        hours: absenceForm.vacationHoursUsed,
        source: "Absence",
        relatedRecordId: "",
        notes: `Absence vacation usage: ${absenceForm.reason}`,
        createdDate: now,
        updatedDate: now,
      });
    }

    setAbsenceForm(createDefaultAbsenceForm());
    loadScheduleRecords();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-300">
            Employee Schedule
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Availability, Holidays, Vacation, Absence
          </h1>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-300">
            This module starts after the employee record exists. It manages
            recurring availability, holiday records, vacation ledger entries,
            absence records, and daily availability snapshots.
          </p>
        </header>

        {employees.length === 0 ? (
          <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8">
            <h2 className="text-2xl font-black">No employees found.</h2>
            <p className="mt-2 text-sm font-bold text-slate-400">
              Create an employee record first, then return to Employee Schedule.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
              <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-lg font-black">Schedule Control</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Employee"
                    value={selectedEmployeeId}
                    options={employees.map((employee) => ({
                      label: employee.displayName,
                      value: employee.id,
                    }))}
                    onChange={setSelectedEmployeeId}
                  />

                  <InputField
                    label="Snapshot Date"
                    type="date"
                    value={snapshotDate}
                    onChange={(event) => setSnapshotDate(event.target.value)}
                  />
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-lg font-black">Daily Snapshot</h2>

                {dailySnapshot ? (
                  <div className="mt-4 space-y-2 text-sm font-bold text-slate-300">
                    <p>
                      Status:{" "}
                      <span
                        className={
                          dailySnapshot.available
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {dailySnapshot.status}
                      </span>
                    </p>
                    <p>Source: {dailySnapshot.source}</p>
                    <p>
                      Window:{" "}
                      {dailySnapshot.startTime && dailySnapshot.endTime
                        ? `${dailySnapshot.startTime} - ${dailySnapshot.endTime}`
                        : "No work window"}
                    </p>
                    <p>Notes: {dailySnapshot.notes || "None"}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-bold text-slate-400">
                    Select an employee to view a snapshot.
                  </p>
                )}
              </div>
            </section>

            {selectedEmployee && vacationBalance && (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Available Vacation"
                  value={formatHours(vacationBalance.availableBalanceHours)}
                  subValue={`${vacationBalance.availableBalanceDays.toFixed(
                    2
                  )} days`}
                />

                <MetricCard
                  label="Projected Earned"
                  value={formatHours(vacationBalance.projectedEarnedHours)}
                  subValue={selectedEmployee.vacationSettings.accrualMethod}
                />

                <MetricCard
                  label="Used"
                  value={formatHours(vacationBalance.usedHours)}
                  subValue="Vacation ledger usage"
                />

                <MetricCard
                  label="Starting Balance"
                  value={formatHours(vacationBalance.startingBalanceHours)}
                  subValue="Employee setup value"
                />
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-2">
              <form data-t1eq-tile="true" data-t1eq-page-card="true"
                onSubmit={handleAvailabilitySubmit}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-black">Recurring Availability</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Day Of Week"
                    value={availabilityForm.dayOfWeek}
                    options={employeeScheduleDayOfWeekOptions}
                    onChange={(value) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        dayOfWeek: value as EmployeeScheduleDayOfWeek,
                      }))
                    }
                  />

                  <SelectField
                    label="Status"
                    value={availabilityForm.status}
                    options={employeeAvailabilityStatusOptions}
                    onChange={(value) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        status: value as EmployeeAvailabilityStatus,
                      }))
                    }
                  />

                  <InputField
                    label="Start Time"
                    type="time"
                    value={availabilityForm.startTime}
                    onChange={(event) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                  />

                  <InputField
                    label="End Time"
                    type="time"
                    value={availabilityForm.endTime}
                    onChange={(event) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                  />

                  <InputField
                    label="Effective Start Date"
                    type="date"
                    value={availabilityForm.effectiveStartDate}
                    onChange={(event) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        effectiveStartDate: event.target.value,
                      }))
                    }
                  />

                  <InputField
                    label="Effective End Date"
                    type="date"
                    value={availabilityForm.effectiveEndDate}
                    onChange={(event) =>
                      setAvailabilityForm((current) => ({
                        ...current,
                        effectiveEndDate: event.target.value,
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      label="Availability Notes"
                      value={availabilityForm.notes}
                      onChange={(event) =>
                        setAvailabilityForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <SubmitButton label="Save Availability Rule" />
              </form>

              <form data-t1eq-tile="true" data-t1eq-page-card="true"
                onSubmit={handleHolidaySubmit}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-black">Holiday Record</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Holiday Name"
                    value={holidayForm.holidayName}
                    onChange={(event) =>
                      setHolidayForm((current) => ({
                        ...current,
                        holidayName: event.target.value,
                      }))
                    }
                  />

                  <SelectField
                    label="Holiday Type"
                    value={holidayForm.holidayType}
                    options={employeeHolidayTypeOptions}
                    onChange={(value) =>
                      setHolidayForm((current) => ({
                        ...current,
                        holidayType: value as EmployeeHolidayType,
                      }))
                    }
                  />

                  <InputField
                    label="Date"
                    type="date"
                    value={holidayForm.date}
                    onChange={(event) =>
                      setHolidayForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />

                  <NumberField
                    label="Hours"
                    value={holidayForm.hours}
                    onChange={(value) =>
                      setHolidayForm((current) => ({
                        ...current,
                        hours: safeNumber(value),
                      }))
                    }
                  />

                  <CheckboxField
                    label="Paid Holiday"
                    checked={holidayForm.paid}
                    onChange={(checked) =>
                      setHolidayForm((current) => ({
                        ...current,
                        paid: checked,
                      }))
                    }
                  />

                  <CheckboxField
                    label="Counts Against Vacation"
                    checked={holidayForm.countsAgainstVacation}
                    onChange={(checked) =>
                      setHolidayForm((current) => ({
                        ...current,
                        countsAgainstVacation: checked,
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      label="Holiday Notes"
                      value={holidayForm.notes}
                      onChange={(event) =>
                        setHolidayForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <SubmitButton label="Save Holiday" />
              </form>

              <form data-t1eq-tile="true" data-t1eq-page-card="true"
                onSubmit={handleVacationLedgerSubmit}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-black">Vacation Ledger</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Entry Type"
                    value={vacationLedgerForm.entryType}
                    options={employeeVacationLedgerTypeOptions}
                    onChange={(value) =>
                      setVacationLedgerForm((current) => ({
                        ...current,
                        entryType: value as EmployeeVacationLedgerType,
                      }))
                    }
                  />

                  <SelectField
                    label="Source"
                    value={vacationLedgerForm.source}
                    options={vacationLedgerSourceOptions}
                    onChange={(value) =>
                      setVacationLedgerForm((current) => ({
                        ...current,
                        source: value as VacationLedgerSource,
                      }))
                    }
                  />

                  <InputField
                    label="Date"
                    type="date"
                    value={vacationLedgerForm.date}
                    onChange={(event) =>
                      setVacationLedgerForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />

                  <NumberField
                    label="Hours"
                    value={vacationLedgerForm.hours}
                    onChange={(value) =>
                      setVacationLedgerForm((current) => ({
                        ...current,
                        hours: safeNumber(value),
                      }))
                    }
                  />

                  <InputField
                    label="Related Record ID"
                    value={vacationLedgerForm.relatedRecordId}
                    onChange={(event) =>
                      setVacationLedgerForm((current) => ({
                        ...current,
                        relatedRecordId: event.target.value,
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      label="Ledger Notes"
                      value={vacationLedgerForm.notes}
                      onChange={(event) =>
                        setVacationLedgerForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <SubmitButton label="Save Vacation Ledger Entry" />
              </form>

              <form data-t1eq-tile="true" data-t1eq-page-card="true"
                onSubmit={handleAbsenceSubmit}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-black">Absence Record</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Missed Date"
                    type="date"
                    value={absenceForm.missedDate}
                    onChange={(event) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        missedDate: event.target.value,
                      }))
                    }
                  />

                  <SelectField
                    label="Call Status"
                    value={absenceForm.callStatus}
                    options={employeeAbsenceCallStatusOptions}
                    onChange={(value) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        callStatus: value as EmployeeAbsenceCallStatus,
                      }))
                    }
                  />

                  <SelectField
                    label="Reason"
                    value={absenceForm.reason}
                    options={employeeAbsenceReasonOptions}
                    onChange={(value) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        reason: value as EmployeeAbsenceReason,
                      }))
                    }
                  />

                  <InputField
                    label="Custom Reason"
                    value={absenceForm.customReason}
                    onChange={(event) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        customReason: event.target.value,
                      }))
                    }
                  />

                  <InputField
                    label="Scheduled Start"
                    type="time"
                    value={absenceForm.scheduledStartTime}
                    onChange={(event) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        scheduledStartTime: event.target.value,
                      }))
                    }
                  />

                  <InputField
                    label="Scheduled End"
                    type="time"
                    value={absenceForm.scheduledEndTime}
                    onChange={(event) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        scheduledEndTime: event.target.value,
                      }))
                    }
                  />

                  <CheckboxField
                    label="Was Normally Scheduled"
                    checked={absenceForm.wasNormallyScheduled}
                    onChange={(checked) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        wasNormallyScheduled: checked,
                      }))
                    }
                  />

                  <CheckboxField
                    label="Paid Absence"
                    checked={absenceForm.paid}
                    onChange={(checked) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        paid: checked,
                      }))
                    }
                  />

                  <CheckboxField
                    label="Uses Vacation Hours"
                    checked={absenceForm.usesVacationHours}
                    onChange={(checked) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        usesVacationHours: checked,
                      }))
                    }
                  />

                  <NumberField
                    label="Vacation Hours Used"
                    value={absenceForm.vacationHoursUsed}
                    onChange={(value) =>
                      setAbsenceForm((current) => ({
                        ...current,
                        vacationHoursUsed: safeNumber(value),
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      label="Manager Notes"
                      value={absenceForm.managerNotes}
                      onChange={(event) =>
                        setAbsenceForm((current) => ({
                          ...current,
                          managerNotes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <SubmitButton label="Save Absence" />
              </form>
            </section>

            {selectedEmployee && (
              <section className="grid gap-6 xl:grid-cols-2">
                <RecordList
                  title="Availability Rules"
                  emptyText="No availability rules saved."
                  records={selectedAvailabilityRules.map((rule) => ({
                    id: rule.id,
                    title: `${rule.dayOfWeek} · ${rule.status}`,
                    detail: `${rule.startTime} - ${rule.endTime} · ${rule.effectiveStartDate}${
                      rule.effectiveEndDate ? ` to ${rule.effectiveEndDate}` : ""
                    }`,
                    notes: rule.notes,
                    onDelete: () => {
                      deleteEmployeeAvailabilityRule(rule.id);
                      loadScheduleRecords();
                    },
                  }))}
                />

                <RecordList
                  title="Holiday Records"
                  emptyText="No holiday records saved."
                  records={selectedHolidayRecords.map((record) => ({
                    id: record.id,
                    title: `${record.holidayName} · ${record.holidayType}`,
                    detail: `${record.date} · ${formatHours(record.hours)} · ${
                      record.paid ? "Paid" : "Unpaid"
                    }`,
                    notes: record.notes,
                    onDelete: () => {
                      deleteEmployeeHolidayRecord(record.id);
                      loadScheduleRecords();
                    },
                  }))}
                />

                <RecordList
                  title="Vacation Ledger"
                  emptyText="No vacation ledger entries saved."
                  records={selectedVacationLedgerEntries.map((entry) => ({
                    id: entry.id,
                    title: `${entry.entryType} · ${formatHours(entry.hours)}`,
                    detail: `${entry.date} · ${entry.source}`,
                    notes: entry.notes,
                    onDelete: () => {
                      deleteEmployeeVacationLedgerEntry(entry.id);
                      loadScheduleRecords();
                    },
                  }))}
                />

                <RecordList
                  title="Absence Records"
                  emptyText="No absence records saved."
                  records={selectedAbsenceRecords.map((record) => ({
                    id: record.id,
                    title: `${record.missedDate} · ${record.reason}`,
                    detail: `${record.callStatus} · ${
                      record.wasNormallyScheduled
                        ? "Normally Scheduled"
                        : "Not Normally Scheduled"
                    }`,
                    notes: record.managerNotes,
                    onDelete: () => {
                      deleteEmployeeAbsenceRecord(record.id);
                      loadScheduleRecords();
                    },
                  }))}
                />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{subValue}</p>
    </div>
  );
}

function RecordList({
  title,
  emptyText,
  records,
}: {
  title: string;
  emptyText: string;
  records: {
    id: string;
    title: string;
    detail: string;
    notes: string;
    onDelete: () => void;
  }[];
}) {
  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-lg font-black">{title}</h2>

      <div className="mt-4 space-y-3">
        {records.length === 0 && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm font-bold text-slate-400">
            {emptyText}
          </div>
        )}

        {records.map((record) => (
          <article data-t1eq-tile="true" data-t1eq-page-card="true"
            key={record.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  {record.title}
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {record.detail}
                </p>
                {record.notes && (
                  <p className="mt-2 text-xs font-semibold text-slate-300">
                    {record.notes}
                  </p>
                )}
              </div>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={record.onDelete}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 transition hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button data-t1eq-action-button="true"
      type="submit"
      className="mt-4 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-orange-400"
    >
      {label}
    </button>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input data-t1eq-field="true"
        type={type}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input data-t1eq-field="true"
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea data-t1eq-field="true"
        value={value}
        onChange={onChange}
        rows={3}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (string | { label: string; value: string })[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select data-t1eq-field="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
      >
        {options.map((option) => {
          const normalizedOption =
            typeof option === "string"
              ? { label: option, value: option }
              : option;

          return (
            <option
              key={normalizedOption.value}
              value={normalizedOption.value}
              className="bg-slate-950"
            >
              {normalizedOption.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label data-t1eq-tile="true" data-t1eq-page-card="true" className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <input data-t1eq-field="true"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      <span className="text-xs font-black uppercase tracking-wide text-slate-200">
        {label}
      </span>
    </label>
  );
}