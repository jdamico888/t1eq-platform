"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE,
  REPAIR_ORDER_ACTION_STATUSES,
  REPAIR_ORDER_ACTION_TYPES,
} from "@/constants/repair-orders";

import {
  getEmployeeAbsenceRecords,
  getEmployeeAvailabilityRules,
  getEmployeeHolidayRecords,
  getEmployeeVacationLedgerEntries,
} from "@/services/employee-schedule";

import { getTechnicianProfiles } from "@/services/technician-profiles";

import type {
  EmployeeAbsenceRecord,
  EmployeeAvailabilityRule,
  EmployeeHolidayRecord,
  EmployeeVacationLedgerEntry,
} from "@/types/employee-schedule";

import type {
  RepairOrderActionBillingGroup,
  RepairOrderActionItem,
  RepairOrderActionStatus,
  RepairOrderActionType,
} from "@/types/repair-orders";

import type { TechnicianProfile } from "@/types/technician-profile";

type RepairOrderActionItemFormInput = {
  type: RepairOrderActionType;
  billingGroup: RepairOrderActionBillingGroup;
  title: string;
  description: string;
  status: RepairOrderActionStatus;

  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;

  assignedEmployeeProfileId: string;

  laborHours: string;
  laborRate: string;
  partsTotal: string;
  notes: string;
};

type EmployeeSuggestion = {
  employee: TechnicianProfile;
  available: boolean;
  score: number;
  reason: string;
};

type RepairOrderActionItemFormProps = {
  initialActionItem?: RepairOrderActionItem;
  onSubmit: (actionItem: RepairOrderActionItem) => void;
  onCancel?: () => void;
};

const dayOfWeekNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultFormInput(): RepairOrderActionItemFormInput {
  const defaultType: RepairOrderActionType = "Inspection";

  return {
    type: defaultType,
    billingGroup: REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE[defaultType],
    title: "",
    description: "",
    status: "Open",

    scheduledDate: todayInputValue(),
    scheduledStartTime: "08:00",
    scheduledEndTime: "17:00",

    assignedEmployeeProfileId: "",

    laborHours: "",
    laborRate: "",
    partsTotal: "",
    notes: "",
  };
}

function createFormInputFromActionItem(
  actionItem: RepairOrderActionItem
): RepairOrderActionItemFormInput {
  return {
    type: actionItem.type,
    billingGroup: actionItem.billingGroup,
    title: actionItem.title,
    description: actionItem.description ?? "",
    status: actionItem.status,

    scheduledDate: actionItem.scheduledDate ?? todayInputValue(),
    scheduledStartTime: actionItem.scheduledStartTime ?? "08:00",
    scheduledEndTime: actionItem.scheduledEndTime ?? "17:00",

    assignedEmployeeProfileId:
      actionItem.assignedEmployeeProfileId ??
      actionItem.assignedTechnicianId ??
      "",

    laborHours:
      actionItem.laborHours === undefined ? "" : String(actionItem.laborHours),
    laborRate:
      actionItem.laborRate === undefined ? "" : String(actionItem.laborRate),
    partsTotal:
      actionItem.partsTotal === undefined ? "" : String(actionItem.partsTotal),
    notes: actionItem.notes ?? "",
  };
}

function parseCurrencyNumber(value: string): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDayOfWeek(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);
  const dayIndex = parsedDate.getDay();

  return dayOfWeekNames[dayIndex] ?? "Monday";
}

function isEffectiveOnDate(
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

function isTimeWindowCovered(
  ruleStartTime: string,
  ruleEndTime: string,
  requestedStartTime: string,
  requestedEndTime: string
): boolean {
  if (!requestedStartTime || !requestedEndTime) {
    return true;
  }

  if (!ruleStartTime || !ruleEndTime) {
    return false;
  }

  return ruleStartTime <= requestedStartTime && ruleEndTime >= requestedEndTime;
}

function getAvailabilityReason(
  employee: TechnicianProfile,
  date: string,
  startTime: string,
  endTime: string,
  availabilityRules: EmployeeAvailabilityRule[],
  holidayRecords: EmployeeHolidayRecord[],
  vacationLedgerEntries: EmployeeVacationLedgerEntry[],
  absenceRecords: EmployeeAbsenceRecord[]
): { available: boolean; reason: string } {
  if (!date) {
    return {
      available: false,
      reason: "No scheduled date selected",
    };
  }

  if (!employee.active || employee.status !== "Active") {
    return {
      available: false,
      reason: "Employee is not active",
    };
  }

  const holidayRecord = holidayRecords.find(
    (record) =>
      record.employeeProfileId === employee.id && record.date === date
  );

  if (holidayRecord) {
    return {
      available: false,
      reason: `Holiday: ${holidayRecord.holidayName}`,
    };
  }

  const absenceRecord = absenceRecords.find(
    (record) =>
      record.employeeProfileId === employee.id && record.missedDate === date
  );

  if (absenceRecord) {
    return {
      available: false,
      reason: `Absent: ${absenceRecord.reason}`,
    };
  }

  const vacationEntry = vacationLedgerEntries.find(
    (entry) =>
      entry.employeeProfileId === employee.id &&
      entry.date === date &&
      entry.entryType === "Used"
  );

  if (vacationEntry) {
    return {
      available: false,
      reason: "Vacation ledger entry for this date",
    };
  }

  const dayOfWeek = getDayOfWeek(date);

  const matchingRule = availabilityRules.find(
    (rule) =>
      rule.employeeProfileId === employee.id &&
      rule.dayOfWeek === dayOfWeek &&
      isEffectiveOnDate(rule.effectiveStartDate, rule.effectiveEndDate, date) &&
      isTimeWindowCovered(
        rule.startTime,
        rule.endTime,
        startTime,
        endTime
      )
  );

  if (!matchingRule) {
    return {
      available: false,
      reason: "No matching availability rule",
    };
  }

  if (
    matchingRule.status !== "Available" &&
    matchingRule.status !== "On Call"
  ) {
    return {
      available: false,
      reason: `Availability status: ${matchingRule.status}`,
    };
  }

  return {
    available: true,
    reason: `${matchingRule.status}: ${matchingRule.startTime} - ${matchingRule.endTime}`,
  };
}

function getRoleScore(
  employee: TechnicianProfile,
  actionType: RepairOrderActionType
): number {
  if (actionType === "Inspection") {
    if (employee.role === "Inspector") {
      return 250;
    }

    if (employee.role === "Lead Technician") {
      return 150;
    }

    if (employee.role === "Service Manager") {
      return 125;
    }
  }

  if (
    actionType === "Repair" ||
    actionType === "Diagnosis" ||
    actionType === "Calibration"
  ) {
    if (employee.role === "Lead Technician") {
      return 200;
    }

    if (employee.role === "Technician") {
      return 175;
    }

    if (employee.role === "Inspector") {
      return 75;
    }
  }

  if (actionType === "Parts") {
    if (employee.role === "Service Manager") {
      return 125;
    }

    if (employee.role === "Lead Technician") {
      return 100;
    }

    if (employee.role === "Technician") {
      return 75;
    }
  }

  if (actionType === "Recommendation" || actionType === "Follow-Up") {
    if (employee.role === "Service Manager") {
      return 175;
    }

    if (employee.role === "Lead Technician") {
      return 150;
    }
  }

  if (employee.role === "Owner" || employee.role === "Admin") {
    return 25;
  }

  return 50;
}

function getSkillScore(employee: TechnicianProfile): number {
  if (employee.skillLevel === "Specialist") {
    return 90;
  }

  if (employee.skillLevel === "Master Technician") {
    return 80;
  }

  if (employee.skillLevel === "Senior Technician") {
    return 60;
  }

  if (employee.skillLevel === "Technician") {
    return 40;
  }

  return 10;
}

function getSpecialtyScore(
  employee: TechnicianProfile,
  title: string,
  description: string
): number {
  const searchableText = `${title} ${description}`.toLowerCase();

  return employee.specialties.reduce((score, specialty) => {
    const normalizedSpecialty = specialty.trim().toLowerCase();

    if (!normalizedSpecialty) {
      return score;
    }

    return searchableText.includes(normalizedSpecialty)
      ? score + 75
      : score;
  }, 0);
}

function buildEmployeeSuggestions(
  employees: TechnicianProfile[],
  formInput: RepairOrderActionItemFormInput,
  availabilityRules: EmployeeAvailabilityRule[],
  holidayRecords: EmployeeHolidayRecord[],
  vacationLedgerEntries: EmployeeVacationLedgerEntry[],
  absenceRecords: EmployeeAbsenceRecord[]
): EmployeeSuggestion[] {
  return employees
    .filter((employee) => employee.active && employee.status === "Active")
    .map((employee) => {
      const availability = getAvailabilityReason(
        employee,
        formInput.scheduledDate,
        formInput.scheduledStartTime,
        formInput.scheduledEndTime,
        availabilityRules,
        holidayRecords,
        vacationLedgerEntries,
        absenceRecords
      );

      const score =
        (availability.available ? 1_000 : 0) +
        getRoleScore(employee, formInput.type) +
        getSkillScore(employee) +
        getSpecialtyScore(
          employee,
          formInput.title,
          formInput.description
        );

      return {
        employee,
        available: availability.available,
        score,
        reason: availability.reason,
      };
    })
    .sort((left, right) => {
      if (left.available !== right.available) {
        return left.available ? -1 : 1;
      }

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.employee.displayName.localeCompare(
        right.employee.displayName
      );
    });
}

export default function RepairOrderActionItemForm({
  initialActionItem,
  onSubmit,
  onCancel,
}: RepairOrderActionItemFormProps) {
  const [employees, setEmployees] = useState<TechnicianProfile[]>([]);
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

  const [formInput, setFormInput] = useState<RepairOrderActionItemFormInput>(
    initialActionItem
      ? createFormInputFromActionItem(initialActionItem)
      : createDefaultFormInput()
  );

  useEffect(() => {
    setEmployees(getTechnicianProfiles());
    setAvailabilityRules(getEmployeeAvailabilityRules());
    setHolidayRecords(getEmployeeHolidayRecords());
    setVacationLedgerEntries(getEmployeeVacationLedgerEntries());
    setAbsenceRecords(getEmployeeAbsenceRecords());
  }, []);

  const calculatedTotals = useMemo(() => {
    const laborHours = parseCurrencyNumber(formInput.laborHours);
    const laborRate = parseCurrencyNumber(formInput.laborRate);
    const partsTotal = parseCurrencyNumber(formInput.partsTotal);

    const laborTotal = laborHours * laborRate;
    const total = laborTotal + partsTotal;

    return {
      laborTotal,
      partsTotal,
      total,
    };
  }, [formInput.laborHours, formInput.laborRate, formInput.partsTotal]);

  const employeeSuggestions = useMemo(() => {
    return buildEmployeeSuggestions(
      employees,
      formInput,
      availabilityRules,
      holidayRecords,
      vacationLedgerEntries,
      absenceRecords
    );
  }, [
    employees,
    formInput,
    availabilityRules,
    holidayRecords,
    vacationLedgerEntries,
    absenceRecords,
  ]);

  const selectedEmployee = useMemo(() => {
    return (
      employees.find(
        (employee) => employee.id === formInput.assignedEmployeeProfileId
      ) ?? null
    );
  }, [employees, formInput.assignedEmployeeProfileId]);

  const selectedEmployeeSuggestion = useMemo(() => {
    return (
      employeeSuggestions.find(
        (suggestion) =>
          suggestion.employee.id === formInput.assignedEmployeeProfileId
      ) ?? null
    );
  }, [employeeSuggestions, formInput.assignedEmployeeProfileId]);

  function handleTypeChange(value: RepairOrderActionType) {
    setFormInput((previous) => ({
      ...previous,
      type: value,
      billingGroup: REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE[value],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = formInput.title.trim();

    if (!title) {
      alert("Action item title is required.");
      return;
    }

    const now = new Date().toISOString();

    const laborHours = parseOptionalNumber(formInput.laborHours);
    const assignedEmployee = selectedEmployee;

    const actionItem: RepairOrderActionItem = {
      ...(initialActionItem ?? {}),

      id: initialActionItem?.id ?? crypto.randomUUID(),

      type: formInput.type,
      billingGroup: formInput.billingGroup,

      title,
      description: formInput.description.trim() || undefined,

      status: formInput.status,

      scheduledDate: formInput.scheduledDate || undefined,
      scheduledStartTime: formInput.scheduledStartTime || undefined,
      scheduledEndTime: formInput.scheduledEndTime || undefined,

      assignedEmployeeProfileId: assignedEmployee?.id,
      assignedEmployeeDisplayName: assignedEmployee?.displayName,
      assignedEmployeeRole: assignedEmployee?.role,

      assignedTechnicianId: assignedEmployee?.id,
      assignedTechnicianName: assignedEmployee?.displayName,

      estimatedLaborHours: laborHours,
      flatRateHours: laborHours,

      laborHours,
      laborRate: parseOptionalNumber(formInput.laborRate),

      partsTotal: calculatedTotals.partsTotal,
      laborTotal: calculatedTotals.laborTotal,
      total: calculatedTotals.total,

      notes: formInput.notes.trim() || undefined,

      createdDate: initialActionItem?.createdDate ?? now,
      updatedDate: now,
    };

    onSubmit(actionItem);

    if (!initialActionItem) {
      setFormInput(createDefaultFormInput());
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Action Type
          </label>

          <select
            value={formInput.type}
            onChange={(event) =>
              handleTypeChange(event.target.value as RepairOrderActionType)
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          >
            {REPAIR_ORDER_ACTION_TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-950">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Status
          </label>

          <select
            value={formInput.status}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                status: event.target.value as RepairOrderActionStatus,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          >
            {REPAIR_ORDER_ACTION_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-slate-950">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Billing Group
        </label>

        <input
          value={formInput.billingGroup}
          readOnly
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Title
        </label>

        <input
          value={formInput.title}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              title: event.target.value,
            }))
          }
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Example: Inspect lift arm restraints"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Description
        </label>

        <textarea
          value={formInput.description}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          rows={4}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Describe the inspection, repair, diagnosis, recommendation, or other action item."
        />
      </div>

      <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
        <div className="text-sm font-bold uppercase tracking-wide text-orange-200">
          Schedule / Assignment
        </div>

        <p className="mt-2 text-sm leading-6 text-orange-100/80">
          Employee suggestions are filtered against the Employee Schedule module:
          recurring availability, holidays, vacation ledger, and absence
          records.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Scheduled Date
            </label>

            <input
              type="date"
              value={formInput.scheduledDate}
              onChange={(event) =>
                setFormInput((previous) => ({
                  ...previous,
                  scheduledDate: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400/60"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Start Time
            </label>

            <input
              type="time"
              value={formInput.scheduledStartTime}
              onChange={(event) =>
                setFormInput((previous) => ({
                  ...previous,
                  scheduledStartTime: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400/60"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
              End Time
            </label>

            <input
              type="time"
              value={formInput.scheduledEndTime}
              onChange={(event) =>
                setFormInput((previous) => ({
                  ...previous,
                  scheduledEndTime: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400/60"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Suggested Available Employee
          </label>

          <select
            value={formInput.assignedEmployeeProfileId}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                assignedEmployeeProfileId: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400/60"
          >
            <option value="" className="bg-slate-950">
              No employee assigned
            </option>

            {employeeSuggestions.map((suggestion) => (
              <option
                key={suggestion.employee.id}
                value={suggestion.employee.id}
                className="bg-slate-950"
              >
                {suggestion.available ? "Available" : "Unavailable"} ·{" "}
                {suggestion.employee.displayName} · {suggestion.employee.role} ·{" "}
                {suggestion.employee.skillLevel} · Score {suggestion.score}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployeeSuggestion && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-bold text-white">
              {selectedEmployee?.displayName}
            </div>

            <div
              className={`mt-1 text-sm font-semibold ${
                selectedEmployeeSuggestion.available
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {selectedEmployeeSuggestion.available
                ? "Available"
                : "Unavailable"}{" "}
              · {selectedEmployeeSuggestion.reason}
            </div>

            <div className="mt-2 text-xs font-semibold text-white/50">
              Role: {selectedEmployee?.role} · Skill:{" "}
              {selectedEmployee?.skillLevel} · Score:{" "}
              {selectedEmployeeSuggestion.score}
            </div>
          </div>
        )}

        {employeeSuggestions.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/50">
            No active employees found. Create employees first, then build their
            availability in Employee Schedule.
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Labor Hours
          </label>

          <input
            type="number"
            min="0"
            step="0.1"
            value={formInput.laborHours}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                laborHours: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Labor Rate
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={formInput.laborRate}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                laborRate: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Parts Total
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={formInput.partsTotal}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                partsTotal: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Labor Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.laborTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Parts Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.partsTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Action Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.total.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Notes
        </label>

        <textarea
          value={formInput.notes}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              notes: event.target.value,
            }))
          }
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Internal notes for this action item."
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
        >
          {initialActionItem ? "Update Action Item" : "Add Action Item"}
        </button>
      </div>
    </form>
  );
}