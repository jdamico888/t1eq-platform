"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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
  getDefaultPayrollSettings,
  technicianRoleOptions,
  technicianSkillLevelOptions,
  technicianStatusOptions,
} from "@/types/technician-profile";

import {
  createTechnicianProfile,
  deleteTechnicianProfile,
  getTechnicianProfiles,
  updateTechnicianProfile,
} from "@/services/technician-profiles";

type EmployeeRoleFilter = "All" | EmployeeRole;

function createEmptyForm(): EmployeeProfileInput {
  return createDefaultTechnicianProfileInput("");
}

function safeNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getDisplayName(formData: EmployeeProfileInput): string {
  const combinedName = `${formData.firstName} ${formData.lastName}`.trim();

  return formData.displayName.trim() || combinedName || "Unnamed Employee";
}

function getRoleLabel(role: EmployeeRole): string {
  if (role === "Technician" || role === "Lead Technician") {
    return "Technician Group";
  }

  return role;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployeeRoleFilter>("All");
  const [formData, setFormData] = useState<EmployeeProfileInput>(
    createEmptyForm()
  );

  useEffect(() => {
    loadEmployees();
  }, []);

  function loadEmployees() {
    setEmployees(getTechnicianProfiles());
  }

  function resetForm() {
    setEditingEmployeeId(null);
    setFormData(createEmptyForm());
  }

  function updateForm(updates: Partial<EmployeeProfileInput>) {
    setFormData((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  }

  function handleBasicFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    updateForm({
      [name]: value,
    } as Partial<EmployeeProfileInput>);
  }

  function handlePayTypeChange(payType: EmployeePayType) {
    setFormData((currentForm) => ({
      ...currentForm,
      payrollSettings: {
        ...getDefaultPayrollSettings(payType),
        hourlyPayRate: currentForm.payrollSettings.hourlyPayRate,
        flatRatePayPercent: currentForm.payrollSettings.flatRatePayPercent,
        salaryAnnualAmount: currentForm.payrollSettings.salaryAnnualAmount,
        payrollNotes: currentForm.payrollSettings.payrollNotes,
        payrollEligible: currentForm.payrollSettings.payrollEligible,
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
      | "payrollSettings",
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

    if (editingEmployeeId) {
      updateTechnicianProfile(editingEmployeeId, normalizedFormData);
    } else {
      createTechnicianProfile(normalizedFormData);
    }

    loadEmployees();
    resetForm();
  }

  function handleEdit(employee: EmployeeProfile) {
    setEditingEmployeeId(employee.id);

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
      ];

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [employees, search, roleFilter]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-300">
            Employee Setup
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Employees
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-300">
            Configure employees by role. Technician is a subgroup of employee
            setup, not a separate parent module. Pay structure, clocking rules,
            customer labor billing, and company metrics are controlled
            separately.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <button
            type="button"
            onClick={() => setRoleFilter("All")}
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
            <button
              key={item.role}
              type="button"
              onClick={() => setRoleFilter(item.role)}
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
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                {editingEmployeeId ? "Edit Employee" : "Create Employee"}
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {getDisplayName(formData)}
              </h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
                  Identity / Role
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InputField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Display Name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Employee Number"
                    name="employeeNumber"
                    value={formData.employeeNumber}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Employee / User ID"
                    name="userId"
                    value={formData.userId}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Technician Number"
                    name="technicianNumber"
                    value={formData.technicianNumber}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Territory"
                    name="territory"
                    value={formData.territory}
                    onChange={handleBasicFieldChange}
                  />

                  <InputField
                    label="Service Vehicle"
                    name="serviceVehicleName"
                    value={formData.serviceVehicleName}
                    onChange={handleBasicFieldChange}
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
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
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
                  />

                  <NumberField
                    label="Hourly Pay Rate"
                    value={formData.payrollSettings.hourlyPayRate}
                    onChange={(value) =>
                      handlePayrollNumberChange("hourlyPayRate", value)
                    }
                  />

                  <NumberField
                    label="Flat Rate Pay Rate"
                    value={formData.payrollSettings.flatRatePayRate}
                    onChange={(value) =>
                      handlePayrollNumberChange("flatRatePayRate", value)
                 }
                   />

                  <NumberField
                    label="Salary Annual Amount"
                    value={formData.payrollSettings.salaryAnnualAmount}
                    onChange={(value) =>
                      handlePayrollNumberChange("salaryAnnualAmount", value)
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
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
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <ReadOnlyFlag
                      label="Model / Serial Photo Starts Job"
                      value={
                        formData.clockingSettings
                          .requiresModelSerialPhotoForClockIn
                      }
                    />

                    <ReadOnlyFlag
                      label="Customer Signature Ends Job"
                      value={
                        formData.clockingSettings
                          .requiresCustomerSignatureForClockOut
                      }
                    />

                    <ReadOnlyFlag
                      label="Manual Clock-In Allowed"
                      value={formData.clockingSettings.allowsManualClockIn}
                    />

                    <ReadOnlyFlag
                      label="Manual Clock-Out Allowed"
                      value={formData.clockingSettings.allowsManualClockOut}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
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
                  />

                  <NumberField
                    label="Minimum Labor Charge"
                    value={formData.billingSettings.minimumLaborCharge}
                    onChange={(value) =>
                      handleBillingNumberChange("minimumLaborCharge", value)
                    }
                  />

                  <NumberField
                    label="Flat Job Labor Amount"
                    value={formData.billingSettings.flatJobLaborAmount}
                    onChange={(value) =>
                      handleBillingNumberChange("flatJobLaborAmount", value)
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
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
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <TextareaField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleBasicFieldChange}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-orange-400"
                >
                  {editingEmployeeId ? "Update Employee" : "Create Employee"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Employee Records
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {filteredEmployees.length} Employees
                </h2>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
              />
            </div>

            <div className="space-y-3">
              {filteredEmployees.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm font-bold text-slate-400">
                  No employees found.
                </div>
              )}

              {filteredEmployees.map((employee) => (
                <article
                  key={employee.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                        {employee.status} · {getRoleLabel(employee.role)}
                      </p>

                      <h3 className="mt-1 text-xl font-black text-white">
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
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(employee)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        name={name}
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
      <input
        type="number"
        min="0"
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
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
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
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950">
            {option}
          </option>
        ))}
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
    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <input
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

function ReadOnlyFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
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