"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createTechnicianProfile,
  deleteTechnicianProfile,
  getTechnicianProfiles,
  updateTechnicianProfile,
} from "@/services/technician-profiles";

import { getRolePermissionsSettings } from "@/services/role-permissions";
import type { Role as PermissionRole } from "@/types/role-permissions";

import { employeeVacationAccrualMethodOptions } from "@/types/employee-schedule";

import type {
  CustomerLaborBillingMode,
  EmployeeClockInRule,
  EmployeeClockOutRule,
  EmployeePayType,
  TechnicianProfile as EmployeeProfile,
  TechnicianProfileInput as EmployeeProfileInput,
  TechnicianRole as EmployeeRole,
  TechnicianSkillLevel as EmployeeSkillLevel,
  TechnicianStatus as EmployeeStatus,
} from "@/types/technician-profile";

import {
  createDefaultTechnicianProfileInput,
  customerLaborBillingModeOptions,
  employeeClockInRuleOptions,
  employeeClockOutRuleOptions,
  employeePayTypeOptions,
  getDefaultClockingSettings,
  technicianRoleOptions,
  technicianSkillLevelOptions,
  technicianStatusOptions,
} from "@/types/technician-profile";

type PostSaveAction =
  | "Stay on Employee Setup"
  | "Open Employee Schedule";

const employeeScheduleRoute = "/employee-schedule";

function safeNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getRoleLabel(role: EmployeeRole): string {
  return role;
}

function getDisplayName(employee: EmployeeProfileInput): string {
  const displayName = employee.displayName.trim();

  if (displayName) {
    return displayName;
  }

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return fullName || "Unnamed Employee";
}

const QBIT_SCOPE = "employees";

function openEmployeeSchedule(employeeProfileId: string) {
  const query = new URLSearchParams({
    employeeProfileId,
  });

  window.location.href = `${employeeScheduleRoute}?${query.toString()}`;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [formData, setFormData] = useState<EmployeeProfileInput>(() =>
    createDefaultTechnicianProfileInput()
  );
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | EmployeeRole>("All");
  const [permissionRoles, setPermissionRoles] = useState<PermissionRole[]>(
    []
  );
  const [postSaveAction, setPostSaveAction] = useState<PostSaveAction>(
    "Stay on Employee Setup"
  );

  function loadEmployees() {
    setEmployees(getTechnicianProfiles());
  }

  function resetForm() {
    setEditingEmployeeId(null);
    setFormData(createDefaultTechnicianProfileInput());
    setPostSaveAction("Stay on Employee Setup");
  }

  function updateForm(updates: Partial<EmployeeProfileInput>) {
    setFormData((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  }

  useEffect(() => {
    loadEmployees();
    setPermissionRoles(getRolePermissionsSettings().roles);

    function handleProfileChange() {
      loadEmployees();
    }

    window.addEventListener(
      "t1eq-technician-profiles-changed",
      handleProfileChange
    );

    return () => {
      window.removeEventListener(
        "t1eq-technician-profiles-changed",
        handleProfileChange
      );
    };
  }, []);

  function handleBasicFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handlePayTypeChange(payType: EmployeePayType) {
    setFormData((currentForm) => ({
      ...currentForm,
      payrollSettings: {
        ...currentForm.payrollSettings,
        payType,
      },
      clockingSettings: getDefaultClockingSettings(payType),
      compensation: {
        ...currentForm.compensation,
        payType,
        compensationType: payType,
        model: payType,
        payModel: payType,
      },
    }));
  }

  function handlePayrollNumberChange(name: string, value: string) {
    const numericValue = safeNumber(value);

    setFormData((currentForm) => ({
      ...currentForm,
      payrollSettings: {
        ...currentForm.payrollSettings,
        [name]: numericValue,
      },
      compensation: {
        ...currentForm.compensation,
        [name]: numericValue,
        ...(name === "hourlyPayRate"
          ? {
              hourlyRate: numericValue,
              baseHourlyRate: numericValue,
            }
          : {}),
        ...(name === "flatRatePayRate"
          ? {
              flatRatePayRate: numericValue,
            }
          : {}),
        ...(name === "salaryAnnualAmount"
          ? {
              salaryAnnualAmount: numericValue,
              annualSalary: numericValue,
              salaryAmount: numericValue,
            }
          : {}),
      },
    }));
  }

  function handleClockingRuleChange(
    fieldName: "clockInRule" | "clockOutRule",
    value: EmployeeClockInRule | EmployeeClockOutRule
  ) {
    setFormData((currentForm) => {
      const nextClockingSettings = {
        ...currentForm.clockingSettings,
        [fieldName]: value,
      };

      const clockInRule =
        fieldName === "clockInRule"
          ? (value as EmployeeClockInRule)
          : nextClockingSettings.clockInRule;

      const clockOutRule =
        fieldName === "clockOutRule"
          ? (value as EmployeeClockOutRule)
          : nextClockingSettings.clockOutRule;

      return {
        ...currentForm,
        clockingSettings: {
          ...nextClockingSettings,
          requiresModelSerialPhotoForClockIn:
            clockInRule ===
            "Flat Rate - Job Clock In on model/serial picture",
          requiresCustomerSignatureForClockOut:
            clockOutRule ===
            "Flat Rate - Job Clock Out on customer signature",
          allowsManualClockIn:
            clockInRule === "Flat Rate - Job Clock In on click" ||
            clockInRule === "Hourly - Daily Clock In" ||
            clockInRule === "Salary - Clock In on click",
          allowsManualClockOut:
            clockOutRule === "Flat Rate - Job Clock Out" ||
            clockOutRule === "Flat Rate - Job Clock Out on click" ||
            clockOutRule === "Hourly - Day Clock Out" ||
            clockOutRule === "Salary - Clock Out on click",
        },
      };
    });
  }

  function handleBooleanSettingChange(
    section:
      | "billingSettings"
      | "metricSettings"
      | "clockingSettings"
      | "payrollSettings"
      | "vacationSettings",
    fieldName: string,
    checked: boolean
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [section]: {
        ...currentForm[section],
        [fieldName]: checked,
      },
    }));
  }

  function handleBillingNumberChange(fieldName: string, value: string) {
    setFormData((currentForm) => ({
      ...currentForm,
      billingSettings: {
        ...currentForm.billingSettings,
        [fieldName]: safeNumber(value),
      },
    }));
  }

  function handleVacationNumberChange(fieldName: string, value: string) {
    setFormData((currentForm) => ({
      ...currentForm,
      vacationSettings: {
        ...currentForm.vacationSettings,
        [fieldName]: safeNumber(value),
      },
    }));
  }

  function handleVacationTextChange(fieldName: string, value: string) {
    setFormData((currentForm) => ({
      ...currentForm,
      vacationSettings: {
        ...currentForm.vacationSettings,
        [fieldName]: value,
      },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const displayName = getDisplayName(formData);

    if (!displayName || displayName === "Unnamed Employee") {
      alert("Employee name is required.");
      return;
    }

    const normalizedFormData: EmployeeProfileInput = {
      ...formData,
      displayName,
      active: formData.status === "Active",
      compensation: {
        ...formData.compensation,
        active: formData.status === "Active",
        payrollEligible: formData.payrollSettings.payrollEligible,
      },
    };

    const shouldOpenSchedule =
      !editingEmployeeId && postSaveAction === "Open Employee Schedule";

    const savedEmployee = editingEmployeeId
      ? updateTechnicianProfile(editingEmployeeId, normalizedFormData)
      : createTechnicianProfile(normalizedFormData);

    loadEmployees();
    resetForm();

    if (shouldOpenSchedule && savedEmployee) {
      openEmployeeSchedule(savedEmployee.id);
    }
  }

  function handleEdit(employee: EmployeeProfile) {
    setEditingEmployeeId(employee.id);
    setPostSaveAction("Stay on Employee Setup");

    setFormData({
      userId: employee.userId,
      active: employee.active,
      compensation: employee.compensation,

      technicianNumber: employee.technicianNumber,
      employeeNumber: employee.employeeNumber,

      firstName: employee.firstName,
      lastName: employee.lastName,
      displayName: employee.displayName,

      email: employee.email,
      phone: employee.phone,

      status: employee.status,
      role: employee.role,
      skillLevel: employee.skillLevel,

      territory: employee.territory,
      serviceVehicleId: employee.serviceVehicleId,
      serviceVehicleName: employee.serviceVehicleName,

      specialties: employee.specialties,
      certifications: employee.certifications,

      payrollSettings: employee.payrollSettings,
      clockingSettings: employee.clockingSettings,
      billingSettings: employee.billingSettings,
      metricSettings: employee.metricSettings,
      vacationSettings: employee.vacationSettings,

      notes: employee.notes,
    });
  }

  function handleDelete(employee: EmployeeProfile) {
    const confirmed = window.confirm(`Delete ${employee.displayName}?`);

    if (!confirmed) {
      return;
    }

    deleteTechnicianProfile(employee.id);
    loadEmployees();

    if (editingEmployeeId === employee.id) {
      resetForm();
    }
  }

  const roleCounts = useMemo(() => {
    return technicianRoleOptions.map((role) => ({
      role,
      count: employees.filter((employee) => employee.role === role).length,
    }));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (roleFilter !== "All" && employee.role !== roleFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        employee.technicianNumber,
        employee.employeeNumber,
        employee.firstName,
        employee.lastName,
        employee.displayName,
        employee.email,
        employee.phone,
        employee.status,
        employee.role,
        employee.skillLevel,
        employee.territory,
        employee.serviceVehicleName,
        employee.notes,
        employee.payrollSettings.payType,
        employee.clockingSettings.clockInRule,
        employee.clockingSettings.clockOutRule,
        employee.billingSettings.defaultCustomerBillingMode,
        employee.vacationSettings.accrualMethod,
        employee.vacationSettings.vacationEligible
          ? "Vacation Eligible"
          : "Vacation Not Eligible",
      ];

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [employees, search, roleFilter]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-header" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
          <p data-t1eq-qbit-id="employees-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-[0.26em] text-orange-300">
            Employee Setup
          </p>
          <h1 data-t1eq-qbit-id="employees-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-4xl font-black tracking-tight">
            Employees
          </h1>
          <p data-t1eq-qbit-id="employees-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-300">
            Configure employees by role. Technician is a subgroup of employee
            setup, not a separate parent module. Pay structure, clocking rules,
            customer labor billing, company metrics, and vacation parameters are
            controlled here. Scheduling becomes its own module after the
            employee record exists.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => setRoleFilter("All")}
            data-t1eq-qbit-id="employees-role-filter-all"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className={`rounded-2xl border p-4 text-left transition ${
              roleFilter === "All"
                ? "border-orange-400 bg-orange-500/15"
                : "border-white/10 bg-white/[0.04] hover:border-orange-400/60"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              All Employees
            </p>
            <p className="mt-2 text-3xl font-black">{employees.length}</p>
          </button>

          {roleCounts.map((item) => (
            <button data-t1eq-action-button="true"
              key={item.role}
              type="button"
              onClick={() => setRoleFilter(item.role)}
              data-t1eq-qbit-id={`employees-role-filter-${item.role.replace(/\s+/g, "-").toLowerCase()}`}
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={`rounded-2xl border p-4 text-left transition ${
                roleFilter === item.role
                  ? "border-orange-400 bg-orange-500/15"
                  : "border-white/10 bg-white/[0.04] hover:border-orange-400/60"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {item.role}
              </p>
              <p className="mt-2 text-3xl font-black">{item.count}</p>
            </button>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-5">
              <p data-t1eq-qbit-id="employees-form-mode" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                {editingEmployeeId ? "Edit Employee" : "Create Employee"}
              </p>
              <h2 data-t1eq-qbit-id="employees-form-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-2xl font-black">
                {getDisplayName(formData)}
              </h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-identity" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-identity-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Identity / Role
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InputField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-first-name"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-last-name"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Display Name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-display-name"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Employee Number"
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-employee-number"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Employee / User ID"
                    name="userId"
                    value={formData.userId}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-user-id"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Technician Number"
                    name="technicianNumber"
                    value={formData.technicianNumber}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-technician-number"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-phone"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-email"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Territory"
                    name="territory"
                    value={formData.territory}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-territory"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Service Vehicle"
                    name="serviceVehicleName"
                    value={formData.serviceVehicleName}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-service-vehicle"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Status"
                    value={formData.status}
                    options={technicianStatusOptions}
                    onChange={(value) =>
                      updateForm({
                        status: value as EmployeeStatus,
                        active: value === "Active",
                      })
                    }
                    qbitId="employees-form-status"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Role / Subgroup"
                    value={formData.role}
                    options={technicianRoleOptions}
                    onChange={(value) =>
                      updateForm({
                        role: value as EmployeeRole,
                      })
                    }
                    qbitId="employees-form-role"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Skill Level"
                    value={formData.skillLevel}
                    options={technicianSkillLevelOptions}
                    onChange={(value) =>
                      updateForm({
                        skillLevel: value as EmployeeSkillLevel,
                      })
                    }
                    qbitId="employees-form-skill-level"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Permission Role"
                    value={formData.permissionRoleId ?? ""}
                    options={[
                      { label: "— Not Set —", value: "" },
                      ...permissionRoles.map((permissionRole) => ({
                        label: permissionRole.name,
                        value: permissionRole.id,
                      })),
                    ]}
                    onChange={(value) =>
                      updateForm({
                        permissionRoleId: value || undefined,
                      })
                    }
                    qbitId="employees-form-permission-role"
                    qbitScope={QBIT_SCOPE}
                  />

                  <InputField
                    label="Login PIN (local device only, not encrypted)"
                    name="pin"
                    type="password"
                    value={formData.pin ?? ""}
                    onChange={handleBasicFieldChange}
                    qbitId="employees-form-pin"
                    qbitScope={QBIT_SCOPE}
                  />
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-payroll" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-payroll-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Payroll Settings
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField
                    label="Pay Type"
                    value={formData.payrollSettings.payType}
                    options={employeePayTypeOptions}
                    onChange={(value) =>
                      handlePayTypeChange(value as EmployeePayType)
                    }
                    qbitId="employees-form-pay-type"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Payroll Eligible"
                    checked={formData.payrollSettings.payrollEligible}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "payrollSettings",
                        "payrollEligible",
                        checked
                      )
                    }
                    qbitId="employees-form-payroll-eligible"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Hourly Pay Rate"
                    value={formData.payrollSettings.hourlyPayRate}
                    onChange={(value) =>
                      handlePayrollNumberChange("hourlyPayRate", value)
                    }
                    qbitId="employees-form-hourly-pay-rate"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Flat Rate Pay Rate"
                    value={formData.payrollSettings.flatRatePayRate}
                    onChange={(value) =>
                      handlePayrollNumberChange("flatRatePayRate", value)
                    }
                    qbitId="employees-form-flat-rate-pay-rate"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Salary Annual Amount"
                    value={formData.payrollSettings.salaryAnnualAmount}
                    onChange={(value) =>
                      handlePayrollNumberChange("salaryAnnualAmount", value)
                    }
                    qbitId="employees-form-salary-annual-amount"
                    qbitScope={QBIT_SCOPE}
                  />
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-clocking" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-clocking-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Clock-In / Clock-Out Rules
                </h3>

                <div className="mt-4 grid gap-3">
                  <SelectField
                    label="Clock In Rule"
                    value={formData.clockingSettings.clockInRule}
                    options={employeeClockInRuleOptions}
                    onChange={(value) =>
                      handleClockingRuleChange(
                        "clockInRule",
                        value as EmployeeClockInRule
                      )
                    }
                    qbitId="employees-form-clock-in-rule"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Clock Out Rule"
                    value={formData.clockingSettings.clockOutRule}
                    options={employeeClockOutRuleOptions}
                    onChange={(value) =>
                      handleClockingRuleChange(
                        "clockOutRule",
                        value as EmployeeClockOutRule
                      )
                    }
                    qbitId="employees-form-clock-out-rule"
                    qbitScope={QBIT_SCOPE}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <ReadOnlyFlag
                      label="Model / Serial Photo Starts Job"
                      value={
                        formData.clockingSettings
                          .requiresModelSerialPhotoForClockIn
                      }
                      qbitId="employees-form-clocking-photo-flag"
                      qbitScope={QBIT_SCOPE}
                    />

                    <ReadOnlyFlag
                      label="Customer Signature Ends Job"
                      value={
                        formData.clockingSettings
                          .requiresCustomerSignatureForClockOut
                      }
                      qbitId="employees-form-clocking-signature-flag"
                      qbitScope={QBIT_SCOPE}
                    />

                    <ReadOnlyFlag
                      label="Manual Clock-In Allowed"
                      value={formData.clockingSettings.allowsManualClockIn}
                      qbitId="employees-form-clocking-manual-in-flag"
                      qbitScope={QBIT_SCOPE}
                    />

                    <ReadOnlyFlag
                      label="Manual Clock-Out Allowed"
                      value={formData.clockingSettings.allowsManualClockOut}
                      qbitId="employees-form-clocking-manual-out-flag"
                      qbitScope={QBIT_SCOPE}
                    />
                  </div>
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-billing" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-billing-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Customer Labor Billing
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Can Generate Customer Labor Charges"
                    checked={
                      formData.billingSettings.canGenerateCustomerLaborCharges
                    }
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "billingSettings",
                        "canGenerateCustomerLaborCharges",
                        checked
                      )
                    }
                    qbitId="employees-form-can-generate-labor-charges"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Default Customer Billing Mode"
                    value={formData.billingSettings.defaultCustomerBillingMode}
                    options={customerLaborBillingModeOptions}
                    onChange={(value) =>
                      setFormData((currentForm) => ({
                        ...currentForm,
                        billingSettings: {
                          ...currentForm.billingSettings,
                          defaultCustomerBillingMode:
                            value as CustomerLaborBillingMode,
                        },
                      }))
                    }
                    qbitId="employees-form-default-billing-mode"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Default Customer Labor Rate"
                    value={formData.billingSettings.defaultCustomerLaborRate}
                    onChange={(value) =>
                      handleBillingNumberChange(
                        "defaultCustomerLaborRate",
                        value
                      )
                    }
                    qbitId="employees-form-default-labor-rate"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Minimum Labor Charge"
                    value={formData.billingSettings.minimumLaborCharge}
                    onChange={(value) =>
                      handleBillingNumberChange("minimumLaborCharge", value)
                    }
                    qbitId="employees-form-minimum-labor-charge"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Flat Job Labor Amount"
                    value={formData.billingSettings.flatJobLaborAmount}
                    onChange={(value) =>
                      handleBillingNumberChange("flatJobLaborAmount", value)
                    }
                    qbitId="employees-form-flat-job-labor-amount"
                    qbitScope={QBIT_SCOPE}
                  />
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-metrics" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-metrics-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Company Metrics
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Included In Company Metrics"
                    checked={formData.metricSettings.includedInCompanyMetrics}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "includedInCompanyMetrics",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-included"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Labor Revenue"
                    checked={formData.metricSettings.countsTowardLaborRevenue}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardLaborRevenue",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-labor-revenue"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Labor Hours"
                    checked={formData.metricSettings.countsTowardLaborHours}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardLaborHours",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-labor-hours"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Utilization"
                    checked={formData.metricSettings.countsTowardUtilization}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardUtilization",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-utilization"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Efficiency"
                    checked={formData.metricSettings.countsTowardEfficiency}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardEfficiency",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-efficiency"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Comebacks"
                    checked={formData.metricSettings.countsTowardComebacks}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardComebacks",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-comebacks"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward First-Time Fix Rate"
                    checked={
                      formData.metricSettings.countsTowardFirstTimeFixRate
                    }
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardFirstTimeFixRate",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-first-time-fix"
                    qbitScope={QBIT_SCOPE}
                  />

                  <CheckboxField
                    label="Counts Toward Customer Satisfaction"
                    checked={
                      formData.metricSettings.countsTowardCustomerSatisfaction
                    }
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "metricSettings",
                        "countsTowardCustomerSatisfaction",
                        checked
                      )
                    }
                    qbitId="employees-form-metric-customer-satisfaction"
                    qbitScope={QBIT_SCOPE}
                  />
                </div>
              </div>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-vacation" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 data-t1eq-qbit-id="employees-form-vacation-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-white">
                  Vacation Settings
                </h3>

                <p data-t1eq-qbit-id="employees-form-vacation-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-xs font-bold leading-5 text-slate-400">
                  Vacation eligibility and accrual parameters are stored on the
                  employee record. The schedule system uses these values to
                  calculate daily updated vacation balances.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <CheckboxField
                    label="Vacation Eligible"
                    checked={formData.vacationSettings.vacationEligible}
                    onChange={(checked) =>
                      handleBooleanSettingChange(
                        "vacationSettings",
                        "vacationEligible",
                        checked
                      )
                    }
                    qbitId="employees-form-vacation-eligible"
                    qbitScope={QBIT_SCOPE}
                  />

                  <SelectField
                    label="Vacation Accrual Method"
                    value={formData.vacationSettings.accrualMethod}
                    options={employeeVacationAccrualMethodOptions}
                    onChange={(value) =>
                      handleVacationTextChange("accrualMethod", value)
                    }
                    qbitId="employees-form-vacation-accrual-method"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Accrual Rate Hours"
                    value={formData.vacationSettings.accrualRateHours}
                    onChange={(value) =>
                      handleVacationNumberChange("accrualRateHours", value)
                    }
                    qbitId="employees-form-vacation-accrual-rate"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Hours Per Vacation Day"
                    value={formData.vacationSettings.hoursPerVacationDay}
                    onChange={(value) =>
                      handleVacationNumberChange("hoursPerVacationDay", value)
                    }
                    qbitId="employees-form-vacation-hours-per-day"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Annual Vacation Cap Hours"
                    value={formData.vacationSettings.annualVacationCapHours}
                    onChange={(value) =>
                      handleVacationNumberChange(
                        "annualVacationCapHours",
                        value
                      )
                    }
                    qbitId="employees-form-vacation-cap-hours"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Carryover Limit Hours"
                    value={formData.vacationSettings.carryoverLimitHours}
                    onChange={(value) =>
                      handleVacationNumberChange("carryoverLimitHours", value)
                    }
                    qbitId="employees-form-vacation-carryover-limit"
                    qbitScope={QBIT_SCOPE}
                  />

                  <NumberField
                    label="Starting Vacation Balance Hours"
                    value={
                      formData.vacationSettings.startingVacationBalanceHours
                    }
                    onChange={(value) =>
                      handleVacationNumberChange(
                        "startingVacationBalanceHours",
                        value
                      )
                    }
                    qbitId="employees-form-vacation-starting-balance"
                    qbitScope={QBIT_SCOPE}
                  />

                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Accrual Start Date
                    </span>
                    <input data-t1eq-field="true"
                      type="date"
                      value={formData.vacationSettings.accrualStartDate}
                      onChange={(event) =>
                        handleVacationTextChange(
                          "accrualStartDate",
                          event.target.value
                        )
                      }
                      data-t1eq-qbit-id="employees-form-vacation-accrual-start-date"
                      data-t1eq-qbit-type="field"
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Vacation Notes
                      </span>
                      <textarea data-t1eq-field="true"
                        value={formData.vacationSettings.vacationNotes}
                        onChange={(event) =>
                          handleVacationTextChange(
                            "vacationNotes",
                            event.target.value
                          )
                        }
                        rows={3}
                        data-t1eq-qbit-id="employees-form-vacation-notes"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {!editingEmployeeId && (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-post-save" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
                  <h3 data-t1eq-qbit-id="employees-form-post-save-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-orange-200">
                    After Save Shortcut
                  </h3>

                  <p data-t1eq-qbit-id="employees-form-post-save-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-xs font-bold leading-5 text-orange-100/80">
                    Employee Schedule is its own module. Use this shortcut only
                    when creating a new employee record and you want to continue
                    directly into schedule setup after saving.
                  </p>

                  <div className="mt-4">
                    <SelectField
                      label="After Saving New Employee"
                      value={postSaveAction}
                      options={[
                        "Stay on Employee Setup",
                        "Open Employee Schedule",
                      ]}
                      onChange={(value) =>
                        setPostSaveAction(value as PostSaveAction)
                      }
                      qbitId="employees-form-post-save-action"
                      qbitScope={QBIT_SCOPE}
                    />
                  </div>
                </div>
              )}

              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-form-notes" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <TextareaField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleBasicFieldChange}
                  qbitId="employees-form-notes-field"
                  qbitScope={QBIT_SCOPE}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button data-t1eq-action-button="true"
                  type="submit"
                  data-t1eq-qbit-id="employees-form-submit"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-orange-400"
                >
                  {editingEmployeeId ? "Update Employee" : "Create Employee"}
                </button>

                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={resetForm}
                  data-t1eq-qbit-id="employees-form-cancel"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-list" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p data-t1eq-qbit-id="employees-list-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Employee Records
                </p>
                <h2 data-t1eq-qbit-id="employees-list-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-2xl font-black">
                  {filteredEmployees.length} Employees
                </h2>
              </div>

              <input data-t1eq-field="true"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                data-t1eq-qbit-id="employees-list-search"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
              />
            </div>

            <div className="space-y-3">
              {filteredEmployees.length === 0 && (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="employees-list-empty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm font-bold text-slate-400">
                  No employees found.
                </div>
              )}

              {filteredEmployees.map((employee) => {
                const employeeQbitId = `employee-${employee.id}`;

                return (
                <article data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={employee.id}
                  data-t1eq-qbit-id={employeeQbitId}
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p data-t1eq-qbit-id={`${employeeQbitId}-status`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                        {employee.status} · {getRoleLabel(employee.role)}
                      </p>

                      <h3 data-t1eq-qbit-id={`${employeeQbitId}-name`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-xl font-black text-white">
                        {employee.displayName}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-400">
                        {employee.skillLevel} ·{" "}
                        {employee.payrollSettings.payType}
                      </p>

                      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-300 md:grid-cols-2">
                        <p>Clock In: {employee.clockingSettings.clockInRule}</p>

                        <p>
                          Clock Out: {employee.clockingSettings.clockOutRule}
                        </p>

                        <p>
                          Billing:{" "}
                          {
                            employee.billingSettings
                              .defaultCustomerBillingMode
                          }
                        </p>

                        <p>
                          Customer Rate:{" "}
                          {formatMoney(
                            employee.billingSettings.defaultCustomerLaborRate
                          )}
                        </p>

                        <p>
                          Flat Rate Pay:{" "}
                          {formatMoney(employee.payrollSettings.flatRatePayRate)}
                        </p>

                        <p>
                          Vacation:{" "}
                          {employee.vacationSettings.vacationEligible
                            ? employee.vacationSettings.accrualMethod
                            : "Not Eligible"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button data-t1eq-action-button="true"
                        type="button"
                        onClick={() => handleEdit(employee)}
                        data-t1eq-qbit-id={`${employeeQbitId}-edit`}
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        Edit
                      </button>

                      <button data-t1eq-action-button="true"
                        type="button"
                        onClick={() => handleDelete(employee)}
                        data-t1eq-qbit-id={`${employeeQbitId}-delete`}
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <label className="block">
      <span data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input data-t1eq-field="true"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        data-t1eq-qbit-id={qbitId ? qbitId : undefined}
        data-t1eq-qbit-type={qbitId ? "field" : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <label className="block">
      <span data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input data-t1eq-field="true"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-t1eq-qbit-id={qbitId ? qbitId : undefined}
        data-t1eq-qbit-type={qbitId ? "field" : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <label className="block">
      <span data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea data-t1eq-field="true"
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        data-t1eq-qbit-id={qbitId ? qbitId : undefined}
        data-t1eq-qbit-type={qbitId ? "field" : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
      />
    </label>
  );
}

type SelectFieldOption = string | { label: string; value: string };

function SelectField({
  label,
  value,
  options,
  onChange,
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <label className="block">
      <span data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select data-t1eq-field="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-t1eq-qbit-id={qbitId ? qbitId : undefined}
        data-t1eq-qbit-type={qbitId ? "field" : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
      >
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;

          return (
            <option
              key={optionValue}
              value={optionValue}
              className="bg-slate-950"
            >
              {optionLabel}
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
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <label data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={qbitId ? qbitId : undefined} data-t1eq-qbit-type={qbitId ? "field" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
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

function ReadOnlyFlag({
  label,
  value,
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  value: boolean;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={qbitId ? qbitId : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-black ${
          value ? "text-emerald-300" : "text-slate-500"
        }`}
      >
        {value ? "Yes" : "No"}
      </p>
    </div>
  );
}