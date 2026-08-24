"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import RepairOrderActionItemModal from "@/components/repair-orders/repair-order-action-item-modal";
import RepairOrderActionItems from "@/components/repair-orders/repair-order-action-items";
import RepairOrderBillingSummary from "@/components/repair-orders/repair-order-billing-summary";
import RepairOrderClockPrerequisitesPanel from "@/components/repair-orders/repair-order-clock-prerequisites-panel";
import RepairOrderDispatchReadinessPanel from "@/components/repair-orders/repair-order-dispatch-readiness-panel";
import RepairOrderHeader from "@/components/repair-orders/repair-order-header";
import RepairOrderInvoicePanel from "@/components/repair-orders/repair-order-invoice-panel";
import RepairOrderSchedulePanel from "@/components/repair-orders/repair-order-schedule-panel";
import RepairOrderSummary from "@/components/repair-orders/repair-order-summary";
import RepairOrderTechnicianPanel from "@/components/repair-orders/repair-order-technician-panel";
import RepairOrderTimeline from "@/components/repair-orders/repair-order-timeline";

import { applyRepairOrderStatusTransition } from "@/services/repair-order-workflow";
import {
  getRepairOrders,
  updateRepairOrder,
  type RepairOrderInput,
} from "@/services/repair-orders";
import { getActiveTechnicianProfiles } from "@/services/technician-profiles";

import type {
  RepairOrder,
  RepairOrderActionItem,
  RepairOrderLaborEntry,
  RepairOrderPhoto,
  RepairOrderSignature,
  RepairOrderStatus,
  RepairOrderTimeClockMethod,
} from "@/types/repair-order";
import type { TechnicianProfile as EmployeeProfile } from "@/types/technician-profile";
import type { Truck } from "@/types/truck-stock";

const createRepairOrderInput = (
  repairOrder: RepairOrder,
  actionItems: RepairOrderActionItem[],
  status?: RepairOrderStatus
): RepairOrderInput => {
  const nextStatus = status ?? repairOrder.status;

  return {
    customerId: repairOrder.customerId,
    customerName: repairOrder.customerName,

    siteId: repairOrder.siteId ?? "",
    siteName: repairOrder.siteName ?? "",

    equipmentId: repairOrder.equipmentId,
    equipmentName: repairOrder.equipmentName,
    equipmentDescription: repairOrder.equipmentDescription ?? "",

    assignedUserId: repairOrder.assignedUserId ?? "",
    assignedUserName: repairOrder.assignedUserName ?? "",

    assignedTechnicianId: repairOrder.assignedTechnicianId ?? "",
    assignedTechnicianName: repairOrder.assignedTechnicianName ?? "",

    assignedEmployeeProfileId: repairOrder.assignedEmployeeProfileId ?? "",
    assignedEmployeeDisplayName: repairOrder.assignedEmployeeDisplayName ?? "",
    assignedEmployeeRole: repairOrder.assignedEmployeeRole ?? "",

    assignedTruckId: repairOrder.assignedTruckId ?? "",
    assignedTruckName: repairOrder.assignedTruckName ?? "",

    complaint: repairOrder.complaint ?? "",
    customerConcern: repairOrder.customerConcern,

    diagnosis: repairOrder.diagnosis ?? "",
    initialFindings: repairOrder.initialFindings ?? "",

    resolution: repairOrder.resolution ?? "",
    workPerformed: repairOrder.workPerformed ?? "",

    recommendations: repairOrder.recommendations ?? "",
    notes: repairOrder.notes ?? "",

    actionItems,
    laborEntries: repairOrder.laborEntries,

    status: nextStatus,
    priority: repairOrder.priority,

    scheduledDate: repairOrder.scheduledDate ?? "",
    dispatchedDate: repairOrder.dispatchedDate ?? "",
    completedDate: repairOrder.completedDate ?? "",
    invoicedDate: repairOrder.invoicedDate ?? "",
    closedDate: repairOrder.closedDate ?? "",
    cancelledDate: repairOrder.cancelledDate ?? "",
  };
};

const QBIT_SCOPE = "repair-order-detail";

function createClientId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function findMatchingEmployeeProfile(
  repairOrder: RepairOrder,
  employeeProfiles: EmployeeProfile[]
) {
  const assignedEmployeeProfileId = repairOrder.assignedEmployeeProfileId ?? "";
  const assignedTechnicianId = repairOrder.assignedTechnicianId ?? "";
  const assignedTechnicianName = repairOrder.assignedTechnicianName ?? "";
  const assignedUserId = repairOrder.assignedUserId ?? "";

  return (
    employeeProfiles.find(
      (employee) => employee.id === assignedEmployeeProfileId
    ) ??
    employeeProfiles.find((employee) => employee.id === assignedTechnicianId) ??
    employeeProfiles.find(
      (employee) => employee.userId === assignedTechnicianId
    ) ??
    employeeProfiles.find((employee) => employee.userId === assignedUserId) ??
    employeeProfiles.find(
      (employee) => employee.displayName === assignedTechnicianName
    ) ??
    employeeProfiles.find(
      (employee) =>
        `${employee.firstName} ${employee.lastName}`.trim() ===
        assignedTechnicianName
    ) ??
    null
  );
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatHours(value: number) {
  return `${value.toFixed(2)} hr`;
}

function formatYesNo(value: boolean | undefined) {
  return value ? "Yes" : "No";
}

function getClockInMethod(
  employeeProfile: EmployeeProfile
): RepairOrderTimeClockMethod {
  if (
    employeeProfile.clockingSettings.clockInRule ===
    "Flat Rate - Job Clock In on model/serial picture"
  ) {
    return "Photo";
  }

  return "Employee Setup Rule";
}

function getClockOutMethod(
  employeeProfile: EmployeeProfile
): RepairOrderTimeClockMethod {
  if (
    employeeProfile.clockingSettings.clockOutRule ===
    "Flat Rate - Job Clock Out on customer signature"
  ) {
    return "Customer Signature";
  }

  return "Employee Setup Rule";
}

function calculateElapsedMinutes(startDate: string, endDate: string) {
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max(0, Math.round((endTime - startTime) / 60000));
}

function getGeneratedJobHours(
  employeeProfile: EmployeeProfile,
  actualClockHours: number
) {
  const billingSettings = employeeProfile.billingSettings;

  if (
    billingSettings.defaultCustomerBillingMode === "Company Flat Rate" &&
    billingSettings.flatJobLaborAmount > 0 &&
    billingSettings.defaultCustomerLaborRate > 0
  ) {
    return Number(
      (
        billingSettings.flatJobLaborAmount /
        billingSettings.defaultCustomerLaborRate
      ).toFixed(2)
    );
  }

  return actualClockHours;
}

function getCustomerLaborHours(
  employeeProfile: EmployeeProfile,
  actualClockHours: number,
  generatedJobHours: number
) {
  const billingSettings = employeeProfile.billingSettings;

  if (!billingSettings.canGenerateCustomerLaborCharges) {
    return 0;
  }

  if (billingSettings.defaultCustomerBillingMode === "Company Flat Rate") {
    return generatedJobHours;
  }

  if (
    billingSettings.defaultCustomerBillingMode === "Company Hourly" ||
    billingSettings.defaultCustomerBillingMode === "Company Minimum Charge"
  ) {
    return actualClockHours;
  }

  return 0;
}

function getCustomerLaborTotal(
  employeeProfile: EmployeeProfile,
  actualClockHours: number,
  generatedJobHours: number
) {
  const billingSettings = employeeProfile.billingSettings;

  if (!billingSettings.canGenerateCustomerLaborCharges) {
    return 0;
  }

  const customerLaborHours = getCustomerLaborHours(
    employeeProfile,
    actualClockHours,
    generatedJobHours
  );

  const hourlyTotal =
    customerLaborHours * billingSettings.defaultCustomerLaborRate;

  if (billingSettings.defaultCustomerBillingMode === "Company Flat Rate") {
    return billingSettings.flatJobLaborAmount > 0
      ? billingSettings.flatJobLaborAmount
      : hourlyTotal;
  }

  if (billingSettings.defaultCustomerBillingMode === "Company Hourly") {
    return hourlyTotal;
  }

  if (billingSettings.defaultCustomerBillingMode === "Company Minimum Charge") {
    return Math.max(billingSettings.minimumLaborCharge, hourlyTotal);
  }

  return 0;
}

function getPayrollRate(employeeProfile: EmployeeProfile) {
  const payrollSettings = employeeProfile.payrollSettings;

  if (payrollSettings.payType === "Flat Rate") {
    return payrollSettings.flatRatePayRate;
  }

  if (payrollSettings.payType === "Hourly") {
    return payrollSettings.hourlyPayRate;
  }

  return 0;
}

function getPayrollHours(
  employeeProfile: EmployeeProfile,
  actualClockHours: number,
  generatedJobHours: number
) {
  const payrollSettings = employeeProfile.payrollSettings;

  if (!payrollSettings.payrollEligible) {
    return 0;
  }

  if (payrollSettings.payType === "Flat Rate") {
    return generatedJobHours;
  }

  if (payrollSettings.payType === "Hourly") {
    return actualClockHours;
  }

  return 0;
}

function getPayrollAmount(
  employeeProfile: EmployeeProfile,
  payrollHours: number
) {
  const payrollSettings = employeeProfile.payrollSettings;

  if (!payrollSettings.payrollEligible) {
    return 0;
  }

  if (payrollSettings.payType === "Flat Rate") {
    return payrollHours * payrollSettings.flatRatePayRate;
  }

  if (payrollSettings.payType === "Hourly") {
    return payrollHours * payrollSettings.hourlyPayRate;
  }

  return 0;
}

function getActiveLaborEntry
(
  repairOrder: RepairOrder,
  employeeProfile: EmployeeProfile | null
) {
  if (!employeeProfile) {
    return null;
  }

  return (
    repairOrder.laborEntries.find(
      (laborEntry) =>
        laborEntry.employeeProfileId === employeeProfile.id &&
        Boolean(laborEntry.clockInDate) &&
        !laborEntry.clockOutDate
    ) ?? null
  );
}

export default function RepairOrderWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const repairOrderId = useMemo(() => {
    const id = params?.id;

    if (Array.isArray(id)) {
      return id[0] ?? "";
    }

    return id ?? "";
  }, [params]);

  const [repairOrder, setRepairOrder] = useState<RepairOrder | null>(null);
  const [employeeProfiles, setEmployeeProfiles] = useState<EmployeeProfile[]>(
    []
  );
  const [isActionItemModalOpen, setIsActionItemModalOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] =
    useState<RepairOrderActionItem | null>(null);

  const selectedEmployeeProfile = useMemo(() => {
    if (!repairOrder) {
      return null;
    }

    return findMatchingEmployeeProfile(repairOrder, employeeProfiles);
  }, [repairOrder, employeeProfiles]);

  const activeLaborEntry = useMemo(() => {
    if (!repairOrder) {
      return null;
    }

    return getActiveLaborEntry(repairOrder, selectedEmployeeProfile);
  }, [repairOrder, selectedEmployeeProfile]);

  function loadRepairOrder() {
    const repairOrders = getRepairOrders();

    const selectedRepairOrder =
      repairOrders.find((item) => item.id === repairOrderId) ?? null;

    setRepairOrder(selectedRepairOrder);
  }

  function loadEmployeeProfiles() {
    setEmployeeProfiles(getActiveTechnicianProfiles());
  }

  useEffect(() => {
    loadRepairOrder();
    loadEmployeeProfiles();
  }, [repairOrderId]);

  function openAddActionItemModal() {
    setEditingActionItem(null);
    setIsActionItemModalOpen(true);
  }

  function openEditActionItemModal(actionItem: RepairOrderActionItem) {
    setEditingActionItem(actionItem);
    setIsActionItemModalOpen(true);
  }

  function closeActionItemModal() {
    setEditingActionItem(null);
    setIsActionItemModalOpen(false);
  }

  function saveActionItems(updatedActionItems: RepairOrderActionItem[]) {
    if (!repairOrder) return;

    updateRepairOrder(
      repairOrder.id,
      createRepairOrderInput(repairOrder, updatedActionItems)
    );

    loadRepairOrder();
  }

  function handleSubmitActionItem(actionItem: RepairOrderActionItem) {
    if (!repairOrder) return;

    const existingActionItem = repairOrder.actionItems.some(
      (item) => item.id === actionItem.id
    );

    const updatedActionItems = existingActionItem
      ? repairOrder.actionItems.map((item) =>
          item.id === actionItem.id ? actionItem : item
        )
      : [...repairOrder.actionItems, actionItem];

    saveActionItems(updatedActionItems);
    closeActionItemModal();
  }

  function handleUpdateActionItem(actionItem: RepairOrderActionItem) {
    if (!repairOrder) return;

    const updatedActionItems = repairOrder.actionItems.map((item) =>
      item.id === actionItem.id ? actionItem : item
    );

    saveActionItems(updatedActionItems);
  }

  function handleDeleteActionItem(actionItem: RepairOrderActionItem) {
    if (!repairOrder) return;

    const confirmed = window.confirm(`Delete action item "${actionItem.title}"?`);

    if (!confirmed) return;

    const updatedActionItems = repairOrder.actionItems.filter(
      (item) => item.id !== actionItem.id
    );

    saveActionItems(updatedActionItems);
  }

  function handleStatusChange(nextStatus: RepairOrderStatus) {
    if (!repairOrder) return;

    const updatedRepairOrder = applyRepairOrderStatusTransition(
      repairOrder,
      nextStatus
    );

    updateRepairOrder(
      repairOrder.id,
      createRepairOrderInput(
        updatedRepairOrder,
        updatedRepairOrder.actionItems,
        nextStatus
      )
    );

    loadRepairOrder();
  }

  function handleEmployeeProfileChange(employeeProfileId: string) {
    if (!repairOrder) return;

    const selectedEmployee =
      employeeProfiles.find((employee) => employee.id === employeeProfileId) ??
      null;

    const updatedRepairOrder: RepairOrder = {
      ...repairOrder,
      assignedTechnicianId: selectedEmployee?.id ?? "",
      assignedTechnicianName: selectedEmployee?.displayName ?? "",
      assignedEmployeeProfileId: selectedEmployee?.id ?? "",
      assignedEmployeeDisplayName: selectedEmployee?.displayName ?? "",
      assignedEmployeeRole: selectedEmployee?.role ?? "",
      assignedUserId: selectedEmployee?.userId ?? "",
      assignedUserName: selectedEmployee?.displayName ?? "",
    };

    updateRepairOrder(
      repairOrder.id,
      createRepairOrderInput(updatedRepairOrder, updatedRepairOrder.actionItems)
    );

    loadRepairOrder();
  }

  function handleTruckChange(truck: Truck | null) {
    if (!repairOrder) return;

    const updatedRepairOrder: RepairOrder = {
      ...repairOrder,
      assignedTruckId: truck?.id ?? "",
      assignedTruckName: truck?.name ?? "",
    };

    updateRepairOrder(
      repairOrder.id,
      createRepairOrderInput(updatedRepairOrder, updatedRepairOrder.actionItems)
    );

    loadRepairOrder();
  }

  function handleModelSerialPhotoCapture(imageUrl: string) {
    if (!repairOrder) return;

    const now = new Date().toISOString();

    const photo: RepairOrderPhoto = {
      id: createClientId("PHOTO"),
      imageUrl,
      source: "Desktop Upload",
      label: "Model / Serial Tag",
      capturedDate: now,
    };

    updateRepairOrder(repairOrder.id, {
      modelSerialPhotoRequired: repairOrder.modelSerialPhotoRequired,
      modelSerialPhotoCaptured: true,
      modelSerialPhotoUrl: imageUrl,
      modelSerialPhotoSource: "Desktop Upload",
      modelSerialPhotoCapturedDate: now,
      photos: [photo, ...repairOrder.photos],
    });

    loadRepairOrder();
  }

  function handleCustomerSignatureCapture(signature: RepairOrderSignature) {
    if (!repairOrder) return;

    updateRepairOrder(repairOrder.id, {
      customerSignature: signature,
    });

    loadRepairOrder();
  }

  function handleClockIn() {
    if (!repairOrder || !selectedEmployeeProfile) return;

    if (activeLaborEntry) {
      alert("This employee already has an active labor clock on this repair order.");
      return;
    }

    if (
      selectedEmployeeProfile.clockingSettings.requiresModelSerialPhotoForClockIn &&
      !repairOrder.modelSerialPhotoCaptured
    ) {
      alert(
        "This employee profile requires a model/serial photo before job clock-in."
      );
      return;
    }

    const now = new Date().toISOString();
    const payrollSettings = selectedEmployeeProfile.payrollSettings;
    const clockingSettings = selectedEmployeeProfile.clockingSettings;
    const billingSettings = selectedEmployeeProfile.billingSettings;
    const metricSettings = selectedEmployeeProfile.metricSettings;

    const newLaborEntry: RepairOrderLaborEntry = {
      id: createClientId("LABOR"),

      technicianId: selectedEmployeeProfile.id,
      technicianName: selectedEmployeeProfile.displayName,

      employeeProfileId: selectedEmployeeProfile.id,
      employeeUserId: selectedEmployeeProfile.userId,
      employeeDisplayName: selectedEmployeeProfile.displayName,
      employeeRole: selectedEmployeeProfile.role,
      employeePayType: payrollSettings.payType,

      clockInDate: now,

      clockInRule: clockingSettings.clockInRule,
      clockOutRule: clockingSettings.clockOutRule,
      clockingPurpose: clockingSettings.clockingPurpose,

      clockInMethod: getClockInMethod(selectedEmployeeProfile),

      modelSerialPhotoRequiredForClockIn:
        clockingSettings.requiresModelSerialPhotoForClockIn,
      modelSerialPhotoCapturedForClockIn: repairOrder.modelSerialPhotoCaptured,
      modelSerialPhotoUrlForClockIn: repairOrder.modelSerialPhotoUrl,

      customerSignatureRequiredForClockOut:
        clockingSettings.requiresCustomerSignatureForClockOut,
      customerSignatureCapturedForClockOut: Boolean(
        repairOrder.customerSignature
      ),
      customerSignatureUrlForClockOut:
        repairOrder.customerSignature?.signatureDataUrl,

      hours: 0,
      totalMinutes: 0,

      laborType: "Repair",
      billingGroup: "Labor",

      laborRate: billingSettings.defaultCustomerLaborRate,
      rateSource: "Employee Setup",

      billable: billingSettings.canGenerateCustomerLaborCharges,

      customerBillingMode: billingSettings.defaultCustomerBillingMode,
      billableToCustomer: billingSettings.canGenerateCustomerLaborCharges,
      customerLaborRate: billingSettings.defaultCustomerLaborRate,
      customerLaborHours: 0,
      customerLaborTotal: 0,
      customerMinimumLaborCharge: billingSettings.minimumLaborCharge,
      customerFlatJobLaborAmount: billingSettings.flatJobLaborAmount,

      payrollEligible: payrollSettings.payrollEligible,
      payrollRate: getPayrollRate(selectedEmployeeProfile),
      payrollHours: 0,
      payrollAmount: 0,
      salaryAttendanceOnly: payrollSettings.payType === "Salary",

      metricEligible: metricSettings.includedInCompanyMetrics,
      metricLaborHours: 0,
      metricLaborRevenue: 0,
      metricUtilizationHours: 0,
      metricEfficiencyHours: 0,
      metricComebackEligible: metricSettings.countsTowardComebacks,
      metricFirstTimeFixEligible: metricSettings.countsTowardFirstTimeFixRate,
      metricCustomerSatisfactionEligible:
        metricSettings.countsTowardCustomerSatisfaction,

      total: 0,

      notes: "Labor clock started from Employee Setup rules.",

      createdDate: now,
      updatedDate: now,
    };

    updateRepairOrder(repairOrder.id, {
      laborEntries: [newLaborEntry, ...repairOrder.laborEntries],
      status: repairOrder.status === "Open" ? "In Progress" : repairOrder.status,
      inProgressDate: repairOrder.inProgressDate ?? now,
    });

    loadRepairOrder();
  }

  function handleClockOut() {
  if (!repairOrder || !selectedEmployeeProfile || !activeLaborEntry) return;

  if (
    selectedEmployeeProfile.clockingSettings
      .requiresCustomerSignatureForClockOut &&
    !repairOrder.customerSignature
  ) {
    alert(
      "This employee profile requires a customer signature before job clock-out."
    );
    return;
  }

  const now = new Date().toISOString();

  const elapsedMinutes = calculateElapsedMinutes(
    activeLaborEntry.clockInDate ?? now,
    now
  );

  const actualClockHours = Number((elapsedMinutes / 60).toFixed(2));

  const generatedJobHours = getGeneratedJobHours(
    selectedEmployeeProfile,
    actualClockHours
  );

  const customerLaborHours = getCustomerLaborHours(
    selectedEmployeeProfile,
    actualClockHours,
    generatedJobHours
  );

  const customerLaborTotal = getCustomerLaborTotal(
    selectedEmployeeProfile,
    actualClockHours,
    generatedJobHours
  );

  const payrollHours = getPayrollHours(
    selectedEmployeeProfile,
    actualClockHours,
    generatedJobHours
  );

  const payrollRate = getPayrollRate(selectedEmployeeProfile);
  const payrollAmount = getPayrollAmount(
    selectedEmployeeProfile,
    payrollHours
  );

  const payrollSettings = selectedEmployeeProfile.payrollSettings;
  const billingSettings = selectedEmployeeProfile.billingSettings;
  const metricSettings = selectedEmployeeProfile.metricSettings;

  const updatedLaborEntries = repairOrder.laborEntries.map((laborEntry) => {
    if (laborEntry.id !== activeLaborEntry.id) {
      return laborEntry;
    }

    const updatedLaborEntry: RepairOrderLaborEntry = {
      ...laborEntry,

      clockOutDate: now,
      clockOutMethod: getClockOutMethod(selectedEmployeeProfile),

      customerSignatureRequiredForClockOut:
        selectedEmployeeProfile.clockingSettings
          .requiresCustomerSignatureForClockOut,
      customerSignatureCapturedForClockOut: Boolean(
        repairOrder.customerSignature
      ),
      customerSignatureUrlForClockOut:
        repairOrder.customerSignature?.signatureDataUrl,

      hours: actualClockHours,
      totalMinutes: elapsedMinutes,

      laborRate: billingSettings.defaultCustomerLaborRate,
      rateSource: "Company Billing Settings",

      customerBillingMode: billingSettings.defaultCustomerBillingMode,
      billableToCustomer: billingSettings.canGenerateCustomerLaborCharges,
      customerLaborRate: billingSettings.defaultCustomerLaborRate,
      customerLaborHours,
      customerLaborTotal,
      customerMinimumLaborCharge: billingSettings.minimumLaborCharge,
      customerFlatJobLaborAmount: billingSettings.flatJobLaborAmount,

      payrollEligible: payrollSettings.payrollEligible,
      payrollRate,
      payrollHours,
      payrollAmount,
      salaryAttendanceOnly: payrollSettings.payType === "Salary",

      metricEligible: metricSettings.includedInCompanyMetrics,
      metricLaborHours: metricSettings.countsTowardLaborHours
        ? actualClockHours
        : 0,
      metricLaborRevenue: metricSettings.countsTowardLaborRevenue
        ? customerLaborTotal
        : 0,
      metricUtilizationHours: metricSettings.countsTowardUtilization
        ? actualClockHours
        : 0,
      metricEfficiencyHours: metricSettings.countsTowardEfficiency
        ? generatedJobHours
        : 0,
      metricComebackEligible: metricSettings.countsTowardComebacks,
      metricFirstTimeFixEligible: metricSettings.countsTowardFirstTimeFixRate,
      metricCustomerSatisfactionEligible:
        metricSettings.countsTowardCustomerSatisfaction,

      total: customerLaborTotal,

      notes: "Labor clock closed from Employee Setup rules.",
      updatedDate: now,
    };

    return updatedLaborEntry;
  });

  updateRepairOrder(repairOrder.id, {
    laborEntries: updatedLaborEntries,
  });

  loadRepairOrder();
}

  if (!repairOrder) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-not-found" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div data-t1eq-qbit-id="repair-order-detail-not-found-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
            Repair Order Workspace
          </div>

          <h1 data-t1eq-qbit-id="repair-order-detail-not-found-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-3 text-3xl font-bold">Repair Order Not Found</h1>

          <p data-t1eq-qbit-id="repair-order-detail-not-found-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            The requested repair order could not be found in local storage.
          </p>

          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => router.push("/repair-orders")}
            data-t1eq-qbit-id="repair-order-detail-not-found-back"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-6 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Back to Repair Orders
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <button data-t1eq-action-button="true"
          type="button"
          onClick={() => router.push("/repair-orders")}
          data-t1eq-qbit-id="repair-order-detail-back"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          ← Back to Repair Orders
        </button>

        <RepairOrderHeader
          repairOrder={repairOrder}
          onStatusChange={handleStatusChange}
        />

        <RepairOrderSummary repairOrder={repairOrder} />

        <RepairOrderBillingSummary repairOrder={repairOrder} />

        <RepairOrderInvoicePanel repairOrder={repairOrder} />

        <RepairOrderTechnicianPanel
          repairOrder={repairOrder}
          onTruckChange={handleTruckChange}
        />

        <RepairOrderEmployeeSetupPanel
          employeeProfiles={employeeProfiles}
          selectedEmployeeProfile={selectedEmployeeProfile}
          assignedTechnicianName={repairOrder.assignedTechnicianName ?? ""}
          onEmployeeProfileChange={handleEmployeeProfileChange}
        />

        <RepairOrderClockPrerequisitesPanel
          modelSerialPhotoCaptured={repairOrder.modelSerialPhotoCaptured}
          modelSerialPhotoUrl={repairOrder.modelSerialPhotoUrl}
          customerSignature={repairOrder.customerSignature}
          onModelSerialPhotoCapture={handleModelSerialPhotoCapture}
          onCustomerSignatureCapture={handleCustomerSignatureCapture}
        />

        <RepairOrderLaborClockPanel
          selectedEmployeeProfile={selectedEmployeeProfile}
          activeLaborEntry={activeLaborEntry}
          laborEntries={repairOrder.laborEntries}
          modelSerialPhotoCaptured={repairOrder.modelSerialPhotoCaptured}
          customerSignatureCaptured={Boolean(repairOrder.customerSignature)}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />

        <RepairOrderSchedulePanel repairOrder={repairOrder} />

        <RepairOrderDispatchReadinessPanel repairOrder={repairOrder} />

        <RepairOrderTimeline repairOrder={repairOrder} />

        <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-action-items" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 data-t1eq-qbit-id="repair-order-detail-action-items-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold text-white">Action Items</h2>

              <p data-t1eq-qbit-id="repair-order-detail-action-items-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-white/60">
                Inspection, repair, diagnosis, parts, and recommendation work
                tied to this repair order.
              </p>
            </div>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={openAddActionItemModal}
              data-t1eq-qbit-id="repair-order-detail-action-items-add"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
            >
              Add Action Item
            </button>
          </div>

          <RepairOrderActionItems
            actionItems={repairOrder.actionItems}
            assignedTruckId={repairOrder.assignedTruckId}
            repairOrderId={repairOrder.id}
            repairOrderNumber={
              repairOrder.repairOrderNumber ?? repairOrder.ro
            }
            onEdit={openEditActionItemModal}
            onDelete={handleDeleteActionItem}
            onUpdate={handleUpdateActionItem}
          />
        </section>
      </div>

      <RepairOrderActionItemModal
        isOpen={isActionItemModalOpen}
        actionItem={editingActionItem ?? undefined}
        onSubmit={handleSubmitActionItem}
        onClose={closeActionItemModal}
      />
    </main>
  );
}

function RepairOrderEmployeeSetupPanel({
  employeeProfiles,
  selectedEmployeeProfile,
  assignedTechnicianName,
  onEmployeeProfileChange,
}: {
  employeeProfiles: EmployeeProfile[];
  selectedEmployeeProfile: EmployeeProfile | null;
  assignedTechnicianName: string;
  onEmployeeProfileChange: (employeeProfileId: string) => void;
}) {
  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-employee-setup" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p data-t1eq-qbit-id="repair-order-detail-employee-setup-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
            Employee Setup Rules
          </p>

          <h2 data-t1eq-qbit-id="repair-order-detail-employee-setup-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-2xl font-bold text-white">
            Labor Control Profile
          </h2>

          <p data-t1eq-qbit-id="repair-order-detail-employee-setup-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            This connects the repair order to the employee setup record. Payroll,
            clocking behavior, customer labor billing, and company metrics stay
            separate even when the same person performs the work.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <label className="block">
            <span data-t1eq-qbit-id="repair-order-detail-employee-select-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
              Assigned Employee Profile
            </span>

            <select data-t1eq-field="true"
              value={selectedEmployeeProfile?.id ?? ""}
              onChange={(event) => onEmployeeProfileChange(event.target.value)}
              data-t1eq-qbit-id="repair-order-detail-employee-select"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
            >
              <option value="">
                {assignedTechnicianName
                  ? `Unlinked: ${assignedTechnicianName}`
                  : "Select employee profile"}
              </option>

              {employeeProfiles.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.displayName} · {employee.role} ·{" "}
                  {employee.payrollSettings.payType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!selectedEmployeeProfile && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-employee-setup-unlinked" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-dashed border-orange-400/30 bg-orange-500/10 p-5">
          <h3 data-t1eq-qbit-id="repair-order-detail-employee-setup-unlinked-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-black uppercase tracking-wide text-orange-200">
            No Employee Setup Profile Linked
          </h3>

          <p data-t1eq-qbit-id="repair-order-detail-employee-setup-unlinked-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-sm leading-6 text-orange-100/80">
            Select an employee profile to let this repair order inherit clocking,
            billing, payroll, and metric rules from Employee Setup.
          </p>
        </div>
      )}

      {selectedEmployeeProfile && (
        <div className="grid gap-4 xl:grid-cols-4">
          <RuleCard
            qbitId="repair-order-detail-rule-payroll"
            qbitScope={QBIT_SCOPE}
            title="Payroll"
            rows={[
              ["Pay Type", selectedEmployeeProfile.payrollSettings.payType],
              [
                "Payroll Eligible",
                formatYesNo(
                  selectedEmployeeProfile.payrollSettings.payrollEligible
                ),
              ],
              [
                "Hourly Pay",
                formatMoney(
                  selectedEmployeeProfile.payrollSettings.hourlyPayRate
                ),
              ],
              [
                "Flat Rate %",
                `${selectedEmployeeProfile.payrollSettings.flatRatePayPercent}%`,
              ],
              [
                "Annual Salary",
                formatMoney(
                  selectedEmployeeProfile.payrollSettings.salaryAnnualAmount
                ),
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-clocking"
            qbitScope={QBIT_SCOPE}
            title="Clocking"
            rows={[
              ["Clock In", selectedEmployeeProfile.clockingSettings.clockInRule],
              [
                "Clock Out",
                selectedEmployeeProfile.clockingSettings.clockOutRule,
              ],
              [
                "Photo Starts Job",
                formatYesNo(
                  selectedEmployeeProfile.clockingSettings
                    .requiresModelSerialPhotoForClockIn
                ),
              ],
              [
                "Signature Ends Job",
                formatYesNo(
                  selectedEmployeeProfile.clockingSettings
                    .requiresCustomerSignatureForClockOut
                ),
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-customer-billing"
            qbitScope={QBIT_SCOPE}
            title="Customer Billing"
            rows={[
              [
                "Can Bill Labor",
                formatYesNo(
                  selectedEmployeeProfile.billingSettings
                    .canGenerateCustomerLaborCharges
                ),
              ],
              [
                "Billing Mode",
                selectedEmployeeProfile.billingSettings
                  .defaultCustomerBillingMode,
              ],
              [
                "Labor Rate",
                formatMoney(
                  selectedEmployeeProfile.billingSettings
                    .defaultCustomerLaborRate
                ),
              ],
              [
                "Minimum",
                formatMoney(
                  selectedEmployeeProfile.billingSettings.minimumLaborCharge
                ),
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-metrics"
            qbitScope={QBIT_SCOPE}
            title="Metrics"
            rows={[
              [
                "Included",
                formatYesNo(
                  selectedEmployeeProfile.metricSettings
                    .includedInCompanyMetrics
                ),
              ],
              [
                "Labor Revenue",
                formatYesNo(
                  selectedEmployeeProfile.metricSettings
                    .countsTowardLaborRevenue
                ),
              ],
              [
                "Labor Hours",
                formatYesNo(
                  selectedEmployeeProfile.metricSettings.countsTowardLaborHours
                ),
              ],
              [
                "Utilization",
                formatYesNo(
                  selectedEmployeeProfile.metricSettings.countsTowardUtilization
                ),
              ],
            ]}
          />
        </div>
      )}
    </section>
  );
}

function RepairOrderLaborClockPanel({
  selectedEmployeeProfile,
  activeLaborEntry,
  laborEntries,
  modelSerialPhotoCaptured,
  customerSignatureCaptured,
  onClockIn,
  onClockOut,
}: {
  selectedEmployeeProfile: EmployeeProfile | null;
  activeLaborEntry: RepairOrderLaborEntry | null;
  laborEntries: RepairOrderLaborEntry[];
  modelSerialPhotoCaptured: boolean;
  customerSignatureCaptured: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  const completedLaborEntries = laborEntries.filter(
    (laborEntry) => laborEntry.clockInDate && laborEntry.clockOutDate
  );

  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-labor-clock" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p data-t1eq-qbit-id="repair-order-detail-labor-clock-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
            Labor Clock
          </p>

          <h2 data-t1eq-qbit-id="repair-order-detail-labor-clock-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-2xl font-bold text-white">
            Employee Rule Clock-In / Clock-Out
          </h2>

          <p data-t1eq-qbit-id="repair-order-detail-labor-clock-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Clocking creates a labor entry with four separate branches: customer
            billing, payroll, attendance/activity clocking, and company metrics.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button data-t1eq-action-button="true"
            type="button"
            onClick={onClockIn}
            disabled={!selectedEmployeeProfile || Boolean(activeLaborEntry)}
            data-t1eq-qbit-id="repair-order-detail-clock-in"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clock In
          </button>

          <button data-t1eq-action-button="true"
            type="button"
            onClick={onClockOut}
            disabled={!selectedEmployeeProfile || !activeLaborEntry}
            data-t1eq-qbit-id="repair-order-detail-clock-out"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clock Out
          </button>
        </div>
      </div>

      {!selectedEmployeeProfile && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="repair-order-detail-labor-clock-unlinked" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-dashed border-orange-400/30 bg-orange-500/10 p-5 text-sm font-bold leading-6 text-orange-100/80">
          Select an employee profile before clocking labor.
        </div>
      )}

      {selectedEmployeeProfile && (
        <div className="grid gap-4 xl:grid-cols-4">
          <RuleCard
            qbitId="repair-order-detail-rule-active-clock"
            qbitScope={QBIT_SCOPE}
            title="Active Clock"
            rows={[
              [
                "Employee",
                activeLaborEntry?.employeeDisplayName ??
                  selectedEmployeeProfile.displayName,
              ],
              [
                "Clocked In",
                activeLaborEntry?.clockInDate
                  ? new Date(activeLaborEntry.clockInDate).toLocaleString()
                  : "No active clock",
              ],
              ["Clock Rule", selectedEmployeeProfile.clockingSettings.clockInRule],
              [
                "Clock Out Rule",
                selectedEmployeeProfile.clockingSettings.clockOutRule,
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-requirements"
            qbitScope={QBIT_SCOPE}
            title="Requirements"
            rows={[
              [
                "Model / Serial Photo",
                selectedEmployeeProfile.clockingSettings
                  .requiresModelSerialPhotoForClockIn
                  ? modelSerialPhotoCaptured
                    ? "Captured"
                    : "Required"
                  : "Not Required",
              ],
              [
                "Customer Signature",
                selectedEmployeeProfile.clockingSettings
                  .requiresCustomerSignatureForClockOut
                  ? customerSignatureCaptured
                    ? "Captured"
                    : "Required"
                  : "Not Required",
              ],
              [
                "Manual Clock In",
                formatYesNo(
                  selectedEmployeeProfile.clockingSettings.allowsManualClockIn
                ),
              ],
              [
                "Manual Clock Out",
                formatYesNo(
                  selectedEmployeeProfile.clockingSettings.allowsManualClockOut
                ),
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-billing-output"
            qbitScope={QBIT_SCOPE}
            title="Billing Output"
            rows={[
              [
                "Billing Mode",
                selectedEmployeeProfile.billingSettings
                  .defaultCustomerBillingMode,
              ],
              [
                "Customer Rate",
                formatMoney(
                  selectedEmployeeProfile.billingSettings
                    .defaultCustomerLaborRate
                ),
              ],
              [
                "Last Customer Total",
                completedLaborEntries[0]
                  ? formatMoney(completedLaborEntries[0].customerLaborTotal ?? 0)
                  : "$0.00",
              ],
              [
                "RO Labor Total",
                formatMoney(
                  laborEntries.reduce(
                    (total, laborEntry) =>
                      total + (laborEntry.customerLaborTotal ?? laborEntry.total),
                    0
                  )
                ),
              ],
            ]}
          />

          <RuleCard
            qbitId="repair-order-detail-rule-payroll-metrics"
            qbitScope={QBIT_SCOPE}
            title="Payroll / Metrics"
            rows={[
              ["Pay Type", selectedEmployeeProfile.payrollSettings.payType],
              [
                "Last Payroll",
                completedLaborEntries[0]
                  ? formatMoney(completedLaborEntries[0].payrollAmount ?? 0)
                  : "$0.00",
              ],
              [
                "Last Metric Hours",
                completedLaborEntries[0]
                  ? formatHours(completedLaborEntries[0].metricLaborHours ?? 0)
                  : "0.00 hr",
              ],
              [
                "Metric Eligible",
                formatYesNo(
                  selectedEmployeeProfile.metricSettings
                    .includedInCompanyMetrics
                ),
              ],
            ]}
          />
        </div>
      )}
    </section>
  );
}

function RuleCard({
  title,
  rows,
  qbitId,
  qbitScope = "global",
}: {
  title: string;
  rows: [string, string][];
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={qbitId ? qbitId : undefined} data-t1eq-qbit-type={qbitId ? "page-card" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 data-t1eq-qbit-id={qbitId ? `${qbitId}-title` : undefined} data-t1eq-qbit-type={qbitId ? "text" : undefined} data-t1eq-qbit-scope={qbitId ? qbitScope : undefined} className="text-sm font-black uppercase tracking-wide text-white">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              {label}
            </p>
            <p className="mt-1 text-sm font-bold leading-5 text-white/90">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}