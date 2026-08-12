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

  generatedLaborDescription: string;
  generatedLaborHours: string;
  generatedLaborRate: string;

  generatedPartsDescription: string;
  generatedPartsTotal: string;

  generatedTravelDescription: string;
  generatedTravelMiles: string;
  generatedTravelRate: string;
  generatedTravelHours: string;
  generatedTravelTotal: string;

  generatedMiscDescription: string;
  generatedMiscTotal: string;

  generationNotes: string;
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

    generatedLaborDescription: "",
    generatedLaborHours: "",
    generatedLaborRate: "",

    generatedPartsDescription: "",
    generatedPartsTotal: "",

    generatedTravelDescription: "",
    generatedTravelMiles: "",
    generatedTravelRate: "",
    generatedTravelHours: "",
    generatedTravelTotal: "",

    generatedMiscDescription: "",
    generatedMiscTotal: "",

    generationNotes: "",
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

    generatedLaborDescription: actionItem.generatedLaborDescription ?? "",
    generatedLaborHours:
      actionItem.generatedLaborHours === undefined
        ? actionItem.laborHours === undefined
          ? ""
          : String(actionItem.laborHours)
        : String(actionItem.generatedLaborHours),
    generatedLaborRate:
      actionItem.generatedLaborRate === undefined
        ? actionItem.laborRate === undefined
          ? ""
          : String(actionItem.laborRate)
        : String(actionItem.generatedLaborRate),

    generatedPartsDescription:
      actionItem.generatedPartsDescription ?? actionItem.partsRequired ?? "",
    generatedPartsTotal:
      actionItem.generatedPartsTotal === undefined
        ? actionItem.partsTotal === undefined
          ? ""
          : String(actionItem.partsTotal)
        : String(actionItem.generatedPartsTotal),

    generatedTravelDescription: actionItem.generatedTravelDescription ?? "",
    generatedTravelMiles:
      actionItem.generatedTravelMiles === undefined
        ? ""
        : String(actionItem.generatedTravelMiles),
    generatedTravelRate:
      actionItem.generatedTravelRate === undefined
        ? ""
        : String(actionItem.generatedTravelRate),
    generatedTravelHours:
      actionItem.generatedTravelHours === undefined
        ? ""
        : String(actionItem.generatedTravelHours),
    generatedTravelTotal:
      actionItem.generatedTravelTotal === undefined
        ? ""
        : String(actionItem.generatedTravelTotal),

    generatedMiscDescription: actionItem.generatedMiscDescription ?? "",
    generatedMiscTotal:
      actionItem.generatedMiscTotal === undefined
        ? ""
        : String(actionItem.generatedMiscTotal),

    generationNotes: actionItem.generationNotes ?? "",
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

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
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

  if (
    actionType === "Recommendation" ||
    actionType === "Follow-Up" ||
    actionType === "Follow Up"
  ) {
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
    const generatedLaborHours = parseCurrencyNumber(
      formInput.generatedLaborHours
    );
    const generatedLaborRate = parseCurrencyNumber(
      formInput.generatedLaborRate
    );

    const generatedLaborTotal = generatedLaborHours * generatedLaborRate;

    const generatedPartsTotal = parseCurrencyNumber(
      formInput.generatedPartsTotal
    );

    const generatedTravelMiles = parseCurrencyNumber(
      formInput.generatedTravelMiles
    );
    const generatedTravelRate = parseCurrencyNumber(
      formInput.generatedTravelRate
    );

    const calculatedTravelTotal = generatedTravelMiles * generatedTravelRate;
    const manualTravelTotal = parseOptionalNumber(
      formInput.generatedTravelTotal
    );
    const generatedTravelTotal =
      manualTravelTotal === undefined
        ? calculatedTravelTotal
        : manualTravelTotal;

    const generatedMiscTotal = parseCurrencyNumber(
      formInput.generatedMiscTotal
    );

    return {
      generatedLaborTotal,
      generatedPartsTotal,
      generatedTravelTotal,
      generatedMiscTotal,
      total:
        generatedLaborTotal +
        generatedPartsTotal +
        generatedTravelTotal +
        generatedMiscTotal,
    };
  }, [
    formInput.generatedLaborHours,
    formInput.generatedLaborRate,
    formInput.generatedPartsTotal,
    formInput.generatedTravelMiles,
    formInput.generatedTravelRate,
    formInput.generatedTravelTotal,
    formInput.generatedMiscTotal,
  ]);

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

    const generatedLaborHours = parseOptionalNumber(
      formInput.generatedLaborHours
    );
    const generatedLaborRate = parseOptionalNumber(
      formInput.generatedLaborRate
    );
    const generatedPartsTotal = parseOptionalNumber(
      formInput.generatedPartsTotal
    );
    const generatedTravelMiles = parseOptionalNumber(
      formInput.generatedTravelMiles
    );
    const generatedTravelRate = parseOptionalNumber(
      formInput.generatedTravelRate
    );
    const generatedTravelHours = parseOptionalNumber(
      formInput.generatedTravelHours
    );
    const generatedTravelTotal = parseOptionalNumber(
      formInput.generatedTravelTotal
    );
    const generatedMiscTotal = parseOptionalNumber(
      formInput.generatedMiscTotal
    );

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

      estimatedLaborHours: generatedLaborHours,
      flatRateHours: generatedLaborHours,

      generatedLaborDescription:
        formInput.generatedLaborDescription.trim() || undefined,
      generatedLaborHours,
      generatedLaborRate,
      generatedLaborTotal: calculatedTotals.generatedLaborTotal,

      generatedPartsDescription:
        formInput.generatedPartsDescription.trim() || undefined,
      generatedPartsTotal,
      partsRequired: formInput.generatedPartsDescription.trim() || undefined,

      generatedTravelDescription:
        formInput.generatedTravelDescription.trim() || undefined,
      generatedTravelMiles,
      generatedTravelRate,
      generatedTravelHours,
      generatedTravelTotal:
        generatedTravelTotal ?? calculatedTotals.generatedTravelTotal,

      generatedMiscDescription:
        formInput.generatedMiscDescription.trim() || undefined,
      generatedMiscTotal,

      generationNotes: formInput.generationNotes.trim() || undefined,

      laborHours: generatedLaborHours,
      laborRate: generatedLaborRate,
      laborTotal: calculatedTotals.generatedLaborTotal,

      partsTotal: calculatedTotals.generatedPartsTotal,
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
        <SelectBlock
          label="Action Type"
          value={formInput.type}
          options={REPAIR_ORDER_ACTION_TYPES}
          onChange={(value) => handleTypeChange(value as RepairOrderActionType)}
        />

        <SelectBlock
          label="Status"
          value={formInput.status}
          options={REPAIR_ORDER_ACTION_STATUSES}
          onChange={(value) =>
            setFormInput((previous) => ({
              ...previous,
              status: value as RepairOrderActionStatus,
            }))
          }
        />
      </div>

      <ReadOnlyInput label="Billing Group" value={formInput.billingGroup} />

      <TextInput
        label="Title"
        value={formInput.title}
        placeholder="Example: Inspect lift arm restraints"
        onChange={(value) =>
          setFormInput((previous) => ({
            ...previous,
            title: value,
          }))
        }
      />

      <TextAreaInput
        label="Description"
        value={formInput.description}
        placeholder="Describe the inspection, repair, diagnosis, recommendation, or other action item."
        rows={4}
        onChange={(value) =>
          setFormInput((previous) => ({
            ...previous,
            description: value,
          }))
        }
      />

      <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
        <div className="text-sm font-bold uppercase tracking-wide text-orange-200">
          Schedule / Assignment
        </div>

        <p className="mt-2 text-sm leading-6 text-orange-100/80">
          Employee suggestions are filtered against recurring availability,
          holidays, vacation ledger, and absence records.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TextInput
            label="Scheduled Date"
            type="date"
            value={formInput.scheduledDate}
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                scheduledDate: value,
              }))
            }
          />

          <TextInput
            label="Start Time"
            type="time"
            value={formInput.scheduledStartTime}
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                scheduledStartTime: value,
              }))
            }
          />

          <TextInput
            label="End Time"
            type="time"
            value={formInput.scheduledEndTime}
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                scheduledEndTime: value,
              }))
            }
          />
        </div>

        <div className="mt-4">
          <SelectBlock
            label="Suggested Available Employee"
            value={formInput.assignedEmployeeProfileId}
            options={[
              {
                label: "No employee assigned",
                value: "",
              },
              ...employeeSuggestions.map((suggestion) => ({
                label: `${suggestion.available ? "Available" : "Unavailable"} · ${
                  suggestion.employee.displayName
                } · ${suggestion.employee.role} · ${
                  suggestion.employee.skillLevel
                } · Score ${suggestion.score}`,
                value: suggestion.employee.id,
              })),
            ]}
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                assignedEmployeeProfileId: value,
              }))
            }
          />
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
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
        <div className="text-sm font-bold uppercase tracking-wide text-cyan-200">
          Action Item Generation
        </div>

        <p className="mt-2 text-sm leading-6 text-cyan-100/80">
          Generate the expected action item charge structure before actual labor
          and part entries are recorded.
        </p>

        <div className="mt-5 space-y-5">
          <GenerationSectionTitle title="Labor Generation" />

          <TextInput
            label="Labor Description"
            value={formInput.generatedLaborDescription}
            placeholder="Example: Inspect, diagnose, repair, calibrate"
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                generatedLaborDescription: value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Labor Hours"
              type="number"
              value={formInput.generatedLaborHours}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedLaborHours: value,
                }))
              }
            />

            <TextInput
              label="Labor Rate"
              type="number"
              value={formInput.generatedLaborRate}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedLaborRate: value,
                }))
              }
            />

            <TotalDisplay
              label="Generated Labor Total"
              value={calculatedTotals.generatedLaborTotal}
            />
          </div>

          <GenerationSectionTitle title="Parts Generation" />

          <TextInput
            label="Parts Description"
            value={formInput.generatedPartsDescription}
            placeholder="Example: Arm restraint kit, hydraulic seal, switch"
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                generatedPartsDescription: value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Generated Parts Total"
              type="number"
              value={formInput.generatedPartsTotal}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedPartsTotal: value,
                }))
              }
            />

            <TotalDisplay
              label="Parts Total"
              value={calculatedTotals.generatedPartsTotal}
            />
          </div>

          <GenerationSectionTitle title="Travel Generation" />

          <TextInput
            label="Travel Description"
            value={formInput.generatedTravelDescription}
            placeholder="Example: Site travel, return trip, remote location"
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                generatedTravelDescription: value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-4">
            <TextInput
              label="Travel Miles"
              type="number"
              value={formInput.generatedTravelMiles}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedTravelMiles: value,
                }))
              }
            />

            <TextInput
              label="Travel Rate"
              type="number"
              value={formInput.generatedTravelRate}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedTravelRate: value,
                }))
              }
            />

            <TextInput
              label="Travel Hours"
              type="number"
              value={formInput.generatedTravelHours}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedTravelHours: value,
                }))
              }
            />

            <TextInput
              label="Manual Travel Total"
              type="number"
              value={formInput.generatedTravelTotal}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedTravelTotal: value,
                }))
              }
            />
          </div>

          <TotalDisplay
            label="Travel Total"
            value={calculatedTotals.generatedTravelTotal}
          />

          <GenerationSectionTitle title="Misc Generation" />

          <TextInput
            label="Misc Description"
            value={formInput.generatedMiscDescription}
            placeholder="Example: Disposal, permits, special handling"
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                generatedMiscDescription: value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Misc Total"
              type="number"
              value={formInput.generatedMiscTotal}
              onChange={(value) =>
                setFormInput((previous) => ({
                  ...previous,
                  generatedMiscTotal: value,
                }))
              }
            />

            <TotalDisplay
              label="Generated Misc Total"
              value={calculatedTotals.generatedMiscTotal}
            />
          </div>

          <TextAreaInput
            label="Generation Notes"
            value={formInput.generationNotes}
            placeholder="Internal generated charge explanation."
            rows={3}
            onChange={(value) =>
              setFormInput((previous) => ({
                ...previous,
                generationNotes: value,
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <TotalDisplay
          label="Labor"
          value={calculatedTotals.generatedLaborTotal}
        />
        <TotalDisplay
          label="Parts"
          value={calculatedTotals.generatedPartsTotal}
        />
        <TotalDisplay
          label="Travel"
          value={calculatedTotals.generatedTravelTotal}
        />
        <TotalDisplay
          label="Misc"
          value={calculatedTotals.generatedMiscTotal}
        />
        <TotalDisplay label="Action Total" value={calculatedTotals.total} />
      </div>

      <TextAreaInput
        label="Notes"
        value={formInput.notes}
        placeholder="Internal notes for this action item."
        rows={3}
        onChange={(value) =>
          setFormInput((previous) => ({
            ...previous,
            notes: value,
          }))
        }
      />

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

function GenerationSectionTitle({ title }: { title: string }) {
  return (
    <div className="border-t border-white/10 pt-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
      {title}
    </div>
  );
}

function TextInput({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  placeholder,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
      />
    </label>
  );
}

function SelectBlock({
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
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
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

function ReadOnlyInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <input
        value={value}
        readOnly
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70 outline-none"
      />
    </label>
  );
}

function TotalDisplay({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-white">
        {formatCurrency(value)}
      </div>
    </div>
  );
}