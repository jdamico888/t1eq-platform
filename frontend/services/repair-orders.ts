import type {
  RepairOrder,
  RepairOrderActionItem,
  RepairOrderActionItemStatus,
  RepairOrderActionItemType,
  RepairOrderBillingGroup,
  RepairOrderCustomerSnapshot,
  RepairOrderEquipmentSnapshot,
  RepairOrderInput,
  RepairOrderLaborEntry,
  RepairOrderLaborRateSource,
  RepairOrderLaborType,
  RepairOrderPartEntry,
  RepairOrderPhoto,
  RepairOrderPhotoSource,
  RepairOrderStatus,
  RepairOrderTimeClockMethod,
} from "@/types/repair-order";

import type {
  CustomerLaborBillingMode,
  EmployeeClockInRule,
  EmployeeClockOutRule,
  EmployeeClockingPurpose,
  EmployeePayType,
} from "@/types/technician-profile";

export type { RepairOrder, RepairOrderInput };

export type RepairOrderActionItemInput = Partial<RepairOrderActionItem>;

const STORAGE_KEY = "t1eq-repair-orders";

function createTimestamp() {
  return new Date().toISOString();
}

function createId(prefix = "RO") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  const stringValue = safeString(value).trim();

  return stringValue ? stringValue : undefined;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function safeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return Boolean(value);
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeStatus(value: unknown): RepairOrderStatus {
  if (value === "Waiting on Parts") {
    return "Waiting Parts";
  }

  if (
    value === "Draft" ||
    value === "Open" ||
    value === "Scheduled" ||
    value === "Dispatched" ||
    value === "In Progress" ||
    value === "Waiting Parts" ||
    value === "Waiting Approval" ||
    value === "Completed" ||
    value === "Closed" ||
    value === "Invoiced" ||
    value === "Cancelled"
  ) {
    return value;
  }

  return "Draft";
}

function normalizePriority(value: unknown) {
  if (
    value === "Low" ||
    value === "Normal" ||
    value === "High" ||
    value === "Urgent"
  ) {
    return value;
  }

  return "Normal";
}

function normalizeBillingGroup(value: unknown): RepairOrderBillingGroup {
  if (
    value === "Inspection" ||
    value === "Repair" ||
    value === "Parts" ||
    value === "Other" ||
    value === "Labor" ||
    value === "Travel" ||
    value === "Mileage" ||
    value === "Inspection Charges" ||
    value === "Repair Charges" ||
    value === "Parts Charges" ||
    value === "Other Charges"
  ) {
    return value;
  }

  return "Repair Charges";
}

function normalizeActionItemType(value: unknown): RepairOrderActionItemType {
  if (value === "Follow Up") {
    return "Follow-Up";
  }

  if (
    value === "Inspection" ||
    value === "Repair" ||
    value === "Diagnosis" ||
    value === "Calibration" ||
    value === "Parts" ||
    value === "Recommendation" ||
    value === "Follow-Up" ||
    value === "Other"
  ) {
    return value;
  }

  return "Repair";
}

function normalizeActionItemStatus(value: unknown): RepairOrderActionItemStatus {
  if (
    value === "Open" ||
    value === "In Progress" ||
    value === "Waiting Parts" ||
    value === "Waiting on Parts" ||
    value === "Waiting Approval" ||
    value === "Completed" ||
    value === "Deferred" ||
    value === "Declined" ||
    value === "Cancelled"
  ) {
    return value;
  }

  return "Open";
}

function normalizePhotoSource(value: unknown): RepairOrderPhotoSource {
  if (
    value === "Camera" ||
    value === "Desktop Upload" ||
    value === "Imported" ||
    value === "Unknown"
  ) {
    return value;
  }

  return "Unknown";
}

function normalizeTimeClockMethod(
  value: unknown
): RepairOrderTimeClockMethod | undefined {
  if (
    value === "Manual" ||
    value === "Photo" ||
    value === "Status Change" ||
    value === "Customer Signature" ||
    value === "Employee Setup Rule" ||
    value === "Unknown"
  ) {
    return value;
  }

  return undefined;
}

function normalizeLaborType(value: unknown): RepairOrderLaborType | undefined {
  if (
    value === "Inspection" ||
    value === "Diagnosis" ||
    value === "Repair" ||
    value === "Calibration" ||
    value === "Travel" ||
    value === "Mileage" ||
    value === "Warranty" ||
    value === "Administrative" ||
    value === "Other"
  ) {
    return value;
  }

  return undefined;
}

function normalizeLaborRateSource(
  value: unknown
): RepairOrderLaborRateSource | undefined {
  if (
    value === "Flat Rate" ||
    value === "Hourly" ||
    value === "Manual" ||
    value === "Manual Override" ||
    value === "Rate Profile" ||
    value === "Employee Setup" ||
    value === "Company Billing Settings" ||
    value === "Warranty" ||
    value === "Manufacturer Contract" ||
    value === "Customer Contract" ||
    value === "Default" ||
    value === "Unknown"
  ) {
    return value;
  }

  return undefined;
}

function normalizeEmployeePayType(value: unknown): EmployeePayType | undefined {
  if (value === "Flat Rate" || value === "Hourly" || value === "Salary") {
    return value;
  }

  return undefined;
}

function normalizeClockInRule(
  value: unknown
): EmployeeClockInRule | undefined {
  if (
    value === "Flat Rate - Job Clock In on model/serial picture" ||
    value === "Flat Rate - Job Clock In on click" ||
    value === "Hourly - Daily Clock In" ||
    value === "Salary - Clock In on click"
  ) {
    return value;
  }

  return undefined;
}

function normalizeClockOutRule(
  value: unknown
): EmployeeClockOutRule | undefined {
  if (
    value === "Flat Rate - Job Clock Out on customer signature" ||
    value === "Flat Rate - Job Clock Out" ||
    value === "Flat Rate - Job Clock Out on click" ||
    value === "Hourly - Day Clock Out" ||
    value === "Salary - Clock Out on click"
  ) {
    return value;
  }

  return undefined;
}

function normalizeClockingPurpose(
  value: unknown
): EmployeeClockingPurpose | undefined {
  if (
    value === "Job Timing" ||
    value === "Daily Attendance" ||
    value === "Activity Tracking"
  ) {
    return value;
  }

  return undefined;
}

function normalizeCustomerBillingMode(
  value: unknown
): CustomerLaborBillingMode | undefined {
  if (
    value === "Company Flat Rate" ||
    value === "Company Hourly" ||
    value === "Company Minimum Charge" ||
    value === "Warranty" ||
    value === "No Charge" ||
    value === "Contract Included"
  ) {
    return value;
  }

  return undefined;
}

function getJulianDay(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const difference = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;

  return Math.floor(difference / oneDay).toString().padStart(3, "0");
}

function generateRepairOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const julianDay = getJulianDay(now);
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const second = now.getSeconds().toString().padStart(2, "0");

  return `RO-${year}${julianDay}-${hour}${minute}${second}`;
}

function getGeneratedTravelTotal(
  actionItem: Partial<RepairOrderActionItem>
): number {
  if (actionItem.generatedTravelTotal !== undefined) {
    return safeNumber(actionItem.generatedTravelTotal);
  }

  return (
    safeNumber(actionItem.generatedTravelMiles) *
    safeNumber(actionItem.generatedTravelRate)
  );
}

function normalizePhoto(photo: Partial<RepairOrderPhoto>): RepairOrderPhoto {
  return {
    id: photo.id ?? createId("PHOTO"),
    imageUrl: safeString(photo.imageUrl),
    source: normalizePhotoSource(photo.source),
    label: photo.label,
    capturedDate: photo.capturedDate ?? createTimestamp(),
  };
}

function normalizePhotos(value: unknown): RepairOrderPhoto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((photo): photo is Partial<RepairOrderPhoto> => Boolean(photo))
    .map(normalizePhoto)
    .filter((photo) => photo.imageUrl.trim().length > 0);
}

function normalizePartEntry(
  partEntry: Partial<RepairOrderPartEntry>
): RepairOrderPartEntry {
  const quantity = safeNumber(partEntry.quantity, 1);
  const unitCost = safeNumber(partEntry.unitCost ?? partEntry.cost);
  const unitPrice = safeNumber(
    partEntry.unitPrice ?? partEntry.sellPrice ?? partEntry.price
  );
  const cost = safeNumber(partEntry.cost ?? partEntry.unitCost);
  const price = safeNumber(
    partEntry.price ?? partEntry.unitPrice ?? partEntry.sellPrice
  );
  const sellPrice = safeNumber(
    partEntry.sellPrice ?? partEntry.unitPrice ?? partEntry.price
  );
  const total = safeNumber(partEntry.total, quantity * sellPrice);

  return {
    id: partEntry.id ?? createId("PART"),
    partNumber: safeString(partEntry.partNumber),
    description: safeString(partEntry.description, "Part"),
    quantity,
    unitCost,
    unitPrice,
    cost,
    price,
    sellPrice,
    total,
    supplierName: partEntry.supplierName,
    inventoryItemId: partEntry.inventoryItemId,
    sourceStockLocation: partEntry.sourceStockLocation,
    sourceTruckId: partEntry.sourceTruckId,
    sourceTruckName: partEntry.sourceTruckName,
    partImageUrl: partEntry.partImageUrl,
    notes: partEntry.notes,
    createdDate: partEntry.createdDate ?? createTimestamp(),
    updatedDate: partEntry.updatedDate,
  };
}

function normalizePartEntries(value: unknown): RepairOrderPartEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (partEntry): partEntry is Partial<RepairOrderPartEntry> =>
        Boolean(partEntry)
    )
    .map(normalizePartEntry);
}

function normalizeLaborEntry(
  laborEntry: Partial<RepairOrderLaborEntry>
): RepairOrderLaborEntry {
  const hours = safeNumber(
    laborEntry.hours,
    safeNumber(laborEntry.totalMinutes) / 60
  );
  const totalMinutes = safeNumber(laborEntry.totalMinutes, hours * 60);

  const laborRate = safeNumber(laborEntry.laborRate);

  const customerLaborRate = safeNumber(
    laborEntry.customerLaborRate,
    laborRate
  );
  const customerLaborHours = safeNumber(
    laborEntry.customerLaborHours,
    hours
  );
  const customerLaborTotal = safeNumber(
    laborEntry.customerLaborTotal,
    customerLaborHours * customerLaborRate
  );

  const payrollRate = safeNumber(laborEntry.payrollRate);
  const payrollHours = safeNumber(laborEntry.payrollHours, hours);
  const payrollAmount = safeNumber(
    laborEntry.payrollAmount,
    payrollHours * payrollRate
  );

  const metricLaborHours = safeNumber(
    laborEntry.metricLaborHours,
    hours
  );
  const metricLaborRevenue = safeNumber(
    laborEntry.metricLaborRevenue,
    customerLaborTotal
  );

  return {
    id: laborEntry.id ?? createId("LABOR"),

    technicianId: laborEntry.technicianId,
    technicianName: laborEntry.technicianName,

    employeeProfileId: laborEntry.employeeProfileId,
    employeeUserId: laborEntry.employeeUserId,
    employeeDisplayName: laborEntry.employeeDisplayName,
    employeeRole: laborEntry.employeeRole,
    employeePayType: normalizeEmployeePayType(laborEntry.employeePayType),

    actionItemId: laborEntry.actionItemId,
    actionItemTitle: laborEntry.actionItemTitle,

    clockInDate: laborEntry.clockInDate,
    clockOutDate: laborEntry.clockOutDate,

    clockInRule: normalizeClockInRule(laborEntry.clockInRule),
    clockOutRule: normalizeClockOutRule(laborEntry.clockOutRule),
    clockingPurpose: normalizeClockingPurpose(laborEntry.clockingPurpose),

    clockInMethod: normalizeTimeClockMethod(laborEntry.clockInMethod),
    clockOutMethod: normalizeTimeClockMethod(laborEntry.clockOutMethod),

    modelSerialPhotoRequiredForClockIn: safeBoolean(
      laborEntry.modelSerialPhotoRequiredForClockIn
    ),
    modelSerialPhotoCapturedForClockIn: safeBoolean(
      laborEntry.modelSerialPhotoCapturedForClockIn
    ),
    modelSerialPhotoUrlForClockIn: laborEntry.modelSerialPhotoUrlForClockIn,

    customerSignatureRequiredForClockOut: safeBoolean(
      laborEntry.customerSignatureRequiredForClockOut
    ),
    customerSignatureCapturedForClockOut: safeBoolean(
      laborEntry.customerSignatureCapturedForClockOut
    ),
    customerSignatureUrlForClockOut:
      laborEntry.customerSignatureUrlForClockOut,

    hours,
    totalMinutes,

    laborType: normalizeLaborType(laborEntry.laborType),
    billingGroup: normalizeBillingGroup(laborEntry.billingGroup),

    laborRate,
    rateSource: normalizeLaborRateSource(laborEntry.rateSource),
    rateProfileName: laborEntry.rateProfileName,

    manufacturer: laborEntry.manufacturer,
    billable: laborEntry.billable,

    customerBillingMode: normalizeCustomerBillingMode(
      laborEntry.customerBillingMode
    ),
    billableToCustomer: safeBoolean(laborEntry.billableToCustomer),
    customerLaborRate,
    customerLaborHours,
    customerLaborTotal,
    customerMinimumLaborCharge: safeNumber(
      laborEntry.customerMinimumLaborCharge
    ),
    customerFlatJobLaborAmount: safeNumber(
      laborEntry.customerFlatJobLaborAmount
    ),

    payrollEligible: safeBoolean(laborEntry.payrollEligible),
    payrollRate,
    payrollHours,
    payrollAmount,
    salaryAttendanceOnly: safeBoolean(laborEntry.salaryAttendanceOnly),

    metricEligible: safeBoolean(laborEntry.metricEligible),
    metricLaborHours,
    metricLaborRevenue,
    metricUtilizationHours: safeNumber(
      laborEntry.metricUtilizationHours,
      metricLaborHours
    ),
    metricEfficiencyHours: safeNumber(
      laborEntry.metricEfficiencyHours,
      metricLaborHours
    ),
    metricComebackEligible: safeBoolean(
      laborEntry.metricComebackEligible
    ),
    metricFirstTimeFixEligible: safeBoolean(
      laborEntry.metricFirstTimeFixEligible
    ),
    metricCustomerSatisfactionEligible: safeBoolean(
      laborEntry.metricCustomerSatisfactionEligible
    ),

    mileage: laborEntry.mileage,
    mileageRate: laborEntry.mileageRate,

    total: safeNumber(laborEntry.total, customerLaborTotal),

    notes: laborEntry.notes,

    createdDate: laborEntry.createdDate ?? createTimestamp(),
    updatedDate: laborEntry.updatedDate,
  };
}

function normalizeLaborEntries(value: unknown): RepairOrderLaborEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (laborEntry): laborEntry is Partial<RepairOrderLaborEntry> =>
        Boolean(laborEntry)
    )
    .map(normalizeLaborEntry);
}

function normalizeActionItem(
  actionItem: Partial<RepairOrderActionItem>
): RepairOrderActionItem {
  const status = normalizeActionItemStatus(actionItem.status);
  const now = createTimestamp();

  const laborEntries = normalizeLaborEntries(actionItem.laborEntries);
  const partEntries = normalizePartEntries(actionItem.partEntries);

  const laborEntryTotal = laborEntries.reduce(
    (total, laborEntry) => total + laborEntry.total,
    0
  );

  const partEntryTotal = partEntries.reduce(
    (total, partEntry) => total + partEntry.total,
    0
  );

  const generatedLaborHours = optionalNumber(
    actionItem.generatedLaborHours ?? actionItem.estimatedLaborHours
  );

  const generatedLaborRate = optionalNumber(
    actionItem.generatedLaborRate ?? actionItem.laborRate
  );

  const generatedLaborTotal = safeNumber(
    actionItem.generatedLaborTotal,
    safeNumber(generatedLaborHours) * safeNumber(generatedLaborRate)
  );

  const generatedPartsTotal = safeNumber(
    actionItem.generatedPartsTotal,
    safeNumber(actionItem.partsTotal, partEntryTotal)
  );

  const generatedTravelMiles = optionalNumber(actionItem.generatedTravelMiles);
  const generatedTravelRate = optionalNumber(actionItem.generatedTravelRate);
  const generatedTravelHours = optionalNumber(actionItem.generatedTravelHours);
  const generatedTravelTotal = getGeneratedTravelTotal(actionItem);

  const generatedMiscTotal = safeNumber(actionItem.generatedMiscTotal);

  const laborHours = safeNumber(
    actionItem.laborHours,
    safeNumber(generatedLaborHours, safeNumber(actionItem.estimatedLaborHours))
  );

  const laborRate = safeNumber(actionItem.laborRate, safeNumber(generatedLaborRate));

  const laborTotal = safeNumber(
    actionItem.laborTotal,
    laborEntryTotal || generatedLaborTotal || laborHours * laborRate
  );

  const partsTotal = safeNumber(
    actionItem.partsTotal,
    partEntryTotal || generatedPartsTotal
  );

  const total = safeNumber(
    actionItem.total,
    laborTotal + partsTotal + generatedTravelTotal + generatedMiscTotal
  );

  return {
    id: actionItem.id ?? createId("ACTION"),
    type: normalizeActionItemType(actionItem.type),
    status,
    title: safeString(actionItem.title, "Repair Action"),
    description: actionItem.description,

    billingGroup: normalizeBillingGroup(actionItem.billingGroup),

    scheduledDate: optionalString(actionItem.scheduledDate),
    scheduledStartTime: optionalString(actionItem.scheduledStartTime),
    scheduledEndTime: optionalString(actionItem.scheduledEndTime),

    estimatedLaborHours: safeNumber(
      actionItem.estimatedLaborHours,
      safeNumber(generatedLaborHours)
    ),

    flatRateHours:
      actionItem.flatRateHours === undefined
        ? generatedLaborHours
        : safeNumber(actionItem.flatRateHours),

    generatedLaborDescription: optionalString(
      actionItem.generatedLaborDescription
    ),
    generatedLaborHours,
    generatedLaborRate,
    generatedLaborTotal,

    generatedPartsDescription: optionalString(
      actionItem.generatedPartsDescription
    ),
    generatedPartsTotal,

    generatedTravelDescription: optionalString(
      actionItem.generatedTravelDescription
    ),
    generatedTravelMiles,
    generatedTravelRate,
    generatedTravelHours,
    generatedTravelTotal,

    generatedMiscDescription: optionalString(
      actionItem.generatedMiscDescription
    ),
    generatedMiscTotal,

    generationNotes: optionalString(actionItem.generationNotes),

    laborHours,
    laborRate,
    laborTotal,
    partsTotal,
    total,

    laborEntries,
    partEntries,

    assignedTechnicianId: actionItem.assignedTechnicianId,
    assignedTechnicianName: actionItem.assignedTechnicianName,

    assignedEmployeeProfileId: actionItem.assignedEmployeeProfileId,
    assignedEmployeeDisplayName: actionItem.assignedEmployeeDisplayName,
    assignedEmployeeRole: actionItem.assignedEmployeeRole,

    partsRequired:
      actionItem.partsRequired ??
      optionalString(actionItem.generatedPartsDescription),
    recommendationNotes: actionItem.recommendationNotes,

    customerApproved: Boolean(actionItem.customerApproved),
    customerDeclined: Boolean(actionItem.customerDeclined),

    startedDate: actionItem.startedDate,
    completedDate:
      actionItem.completedDate ?? (status === "Completed" ? now : undefined),

    clockInDateTime: actionItem.clockInDateTime,
    clockOutDateTime: actionItem.clockOutDateTime,
    timeClockMethod: normalizeTimeClockMethod(actionItem.timeClockMethod),

    serialPlatePhotoUrl: actionItem.serialPlatePhotoUrl,
    beforePhotoUrls: safeStringArray(actionItem.beforePhotoUrls),
    afterPhotoUrls: safeStringArray(actionItem.afterPhotoUrls),
    customerSignatureUrl: actionItem.customerSignatureUrl,

    completionNotes: actionItem.completionNotes,
    notes: actionItem.notes,

    photos: normalizePhotos(actionItem.photos),

    createdDate: actionItem.createdDate ?? now,
    updatedDate: actionItem.updatedDate,
  };
}

function normalizeActionItems(value: unknown): RepairOrderActionItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (actionItem): actionItem is Partial<RepairOrderActionItem> =>
        Boolean(actionItem)
    )
    .map(normalizeActionItem);
}

function normalizeCustomerSnapshot(
  repairOrder: Partial<RepairOrder>
): RepairOrderCustomerSnapshot {
  return {
    customerId:
      repairOrder.customerSnapshot?.customerId ?? repairOrder.customerId,
    customerName:
      repairOrder.customerSnapshot?.customerName ??
      safeString(repairOrder.customerName),
    contactName: repairOrder.customerSnapshot?.contactName,
    phone: repairOrder.customerSnapshot?.phone,
    email: repairOrder.customerSnapshot?.email,
    billingAddress: repairOrder.customerSnapshot?.billingAddress,
    serviceAddress:
      repairOrder.customerSnapshot?.serviceAddress ?? repairOrder.siteName,
  };
}

function normalizeEquipmentSnapshot(
  repairOrder: Partial<RepairOrder>
): RepairOrderEquipmentSnapshot | undefined {
  const snapshot = repairOrder.equipmentSnapshot;
  const equipmentName =
    snapshot?.equipmentName ?? repairOrder.equipmentName ?? "";

  if (
    !repairOrder.equipmentId &&
    !equipmentName &&
    !snapshot?.equipmentDescription &&
    !snapshot?.equipmentType &&
    !snapshot?.manufacturer &&
    !snapshot?.model &&
    !snapshot?.serialNumber &&
    !snapshot?.assetNumber
  ) {
    return undefined;
  }

  return {
    equipmentId: snapshot?.equipmentId ?? repairOrder.equipmentId,
    equipmentName,
    equipmentDescription:
      snapshot?.equipmentDescription ?? repairOrder.equipmentDescription,
    equipmentType: snapshot?.equipmentType,
    manufacturer: snapshot?.manufacturer,
    model: snapshot?.model,
    serialNumber: snapshot?.serialNumber,
    assetNumber: snapshot?.assetNumber,
    locationName: snapshot?.locationName ?? repairOrder.siteName,
  };
}

function calculateTotals(repairOrder: Partial<RepairOrder>) {
  const actionItems = normalizeActionItems(repairOrder.actionItems);
  const topLevelLaborEntries = normalizeLaborEntries(
    repairOrder.laborEntries
  );
  const topLevelPartEntries = normalizePartEntries(repairOrder.partEntries);

  const actionLaborTotal = actionItems.reduce(
    (total, actionItem) =>
      total +
      safeNumber(actionItem.laborTotal, safeNumber(actionItem.generatedLaborTotal)),
    0
  );

  const laborEntryTotal = topLevelLaborEntries.reduce(
    (total, laborEntry) => total + laborEntry.total,
    0
  );

  const actionPartsTotal = actionItems.reduce(
    (total, actionItem) =>
      total +
      safeNumber(actionItem.partsTotal, safeNumber(actionItem.generatedPartsTotal)),
    0
  );

  const partEntryTotal = topLevelPartEntries.reduce(
    (total, partEntry) => total + partEntry.total,
    0
  );

  const actionOtherTotal = actionItems.reduce(
    (total, actionItem) =>
      total +
      getGeneratedTravelTotal(actionItem) +
      safeNumber(actionItem.generatedMiscTotal),
    0
  );

  const subtotalLabor = safeNumber(
    repairOrder.subtotalLabor,
    actionLaborTotal + laborEntryTotal
  );
  const subtotalParts = safeNumber(
    repairOrder.subtotalParts,
    actionPartsTotal + partEntryTotal
  );
  const subtotalOther = safeNumber(
    repairOrder.subtotalOther,
    actionOtherTotal
  );

  return {
    subtotalLabor,
    subtotalParts,
    subtotalOther,
    totalAmount:
      repairOrder.totalAmount === undefined
        ? subtotalLabor + subtotalParts + subtotalOther
        : safeNumber(repairOrder.totalAmount),
  };
}

function normalizeRepairOrder(
  repairOrder: Partial<RepairOrder>
): RepairOrder {
  const now = createTimestamp();
  const status = normalizeStatus(repairOrder.status);
  const repairOrderNumber =
    repairOrder.repairOrderNumber ??
    repairOrder.ro ??
    generateRepairOrderNumber();

  const customerName = safeString(
    repairOrder.customerName,
    repairOrder.customerSnapshot?.customerName ?? ""
  );
  const equipmentName = repairOrder.equipmentName ?? "";

  const actionItems = normalizeActionItems(repairOrder.actionItems);
  const laborEntries = normalizeLaborEntries(repairOrder.laborEntries);
  const partEntries = normalizePartEntries(repairOrder.partEntries);

  const totals = calculateTotals({
    ...repairOrder,
    actionItems,
    laborEntries,
    partEntries,
  });

  return {
    id: repairOrder.id ?? createId(),

    repairOrderNumber,
    ro: repairOrder.ro ?? repairOrderNumber,

    status,
    priority: normalizePriority(repairOrder.priority),

    customerId: repairOrder.customerId,
    customerName,
    customerSnapshot: normalizeCustomerSnapshot({
      ...repairOrder,
      customerName,
    }),

    siteId: repairOrder.siteId,
    siteName: repairOrder.siteName,

    equipmentId: repairOrder.equipmentId,
    equipmentName,
    equipmentDescription: repairOrder.equipmentDescription,
    equipmentSnapshot: normalizeEquipmentSnapshot({
      ...repairOrder,
      equipmentName,
    }),

    complaint: safeString(
      repairOrder.complaint,
      repairOrder.customerConcern ?? repairOrder.concern ?? ""
    ),
    concern: repairOrder.concern ?? repairOrder.customerConcern,
    customerConcern:
      repairOrder.customerConcern ??
      repairOrder.concern ??
      repairOrder.complaint,

    cause: repairOrder.cause,
    correction: repairOrder.correction,

    diagnosis: repairOrder.diagnosis,
    initialFindings: repairOrder.initialFindings,
    workPerformed: repairOrder.workPerformed,
    resolution: repairOrder.resolution,
    recommendations: repairOrder.recommendations,

    internalNotes: repairOrder.internalNotes,
    customerNotes: repairOrder.customerNotes,
    notes: repairOrder.notes,

    draftDate: repairOrder.draftDate,
    scheduledDate: repairOrder.scheduledDate,
    dispatchedDate:
      repairOrder.dispatchedDate ??
      (status === "Dispatched" ? now : undefined),
    inProgressDate:
      repairOrder.inProgressDate ??
      (status === "In Progress" ? now : undefined),
    waitingPartsDate:
      repairOrder.waitingPartsDate ??
      (status === "Waiting Parts" ? now : undefined),
    waitingApprovalDate:
      repairOrder.waitingApprovalDate ??
      (status === "Waiting Approval" ? now : undefined),
    openedDate: repairOrder.openedDate ?? now,
    completedDate:
      repairOrder.completedDate ?? (status === "Completed" ? now : undefined),
    closedDate:
      repairOrder.closedDate ?? (status === "Closed" ? now : undefined),
    invoicedDate:
      repairOrder.invoicedDate ?? (status === "Invoiced" ? now : undefined),
    cancelledDate:
      repairOrder.cancelledDate ??
      (status === "Cancelled" ? now : undefined),

    assignedTechnicianId:
      repairOrder.assignedTechnicianId ?? repairOrder.assignedUserId,
    assignedTechnicianName:
      repairOrder.assignedTechnicianName ?? repairOrder.assignedUserName,

    assignedEmployeeProfileId: repairOrder.assignedEmployeeProfileId,
    assignedEmployeeDisplayName: repairOrder.assignedEmployeeDisplayName,
    assignedEmployeeRole: repairOrder.assignedEmployeeRole,

    assignedUserId:
      repairOrder.assignedUserId ?? repairOrder.assignedTechnicianId,
    assignedUserName:
      repairOrder.assignedUserName ?? repairOrder.assignedTechnicianName,

    assignedTruckId: repairOrder.assignedTruckId,
    assignedTruckName: repairOrder.assignedTruckName,

    assignedRouteId: repairOrder.assignedRouteId,
    assignedRouteName: repairOrder.assignedRouteName,

    modelSerialPhotoRequired:
      repairOrder.modelSerialPhotoRequired === undefined
        ? true
        : Boolean(repairOrder.modelSerialPhotoRequired),
    modelSerialPhotoCaptured: Boolean(
      repairOrder.modelSerialPhotoCaptured ?? repairOrder.modelSerialPhotoUrl
    ),
    modelSerialPhotoUrl: repairOrder.modelSerialPhotoUrl,
    modelSerialPhotoSource: normalizePhotoSource(
      repairOrder.modelSerialPhotoSource
    ),
    modelSerialPhotoCapturedDate: repairOrder.modelSerialPhotoCapturedDate,

    photos: normalizePhotos(repairOrder.photos),
    actionItems,
    laborEntries,
    partEntries,

    customerSignature: repairOrder.customerSignature,

    subtotalLabor: totals.subtotalLabor,
    subtotalParts: totals.subtotalParts,
    subtotalOther: totals.subtotalOther,
    totalAmount: totals.totalAmount,

    createdDate: repairOrder.createdDate ?? now,
    updatedDate: repairOrder.updatedDate,
  };
}

function readRepairOrdersStorage(): RepairOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map((repairOrder) =>
      normalizeRepairOrder(repairOrder as Partial<RepairOrder>)
    );
  } catch (error) {
    console.error("Failed to parse repair orders.", error);

    return [];
  }
}

function writeRepairOrdersStorage(repairOrders: RepairOrder[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(repairOrders));
  window.dispatchEvent(new Event("t1eq-repair-orders-changed"));
}

export function getRepairOrders(): RepairOrder[] {
  return readRepairOrdersStorage();
}

export function saveRepairOrders(repairOrders: RepairOrder[]): RepairOrder[] {
  const normalizedRepairOrders = repairOrders.map(normalizeRepairOrder);

  writeRepairOrdersStorage(normalizedRepairOrders);

  return normalizedRepairOrders;
}

export function createRepairOrder(input: RepairOrderInput): RepairOrder {
  const now = createTimestamp();
  const repairOrderNumber =
    input.repairOrderNumber ?? generateRepairOrderNumber();

  const newRepairOrder = normalizeRepairOrder({
    ...input,
    id: input.id ?? createId(),
    repairOrderNumber,
    ro: input.ro ?? repairOrderNumber,
    status: input.status ?? "Draft",
    openedDate: input.openedDate ?? now,
    createdDate: input.createdDate ?? now,
    updatedDate: now,
  });

  const nextRepairOrders = [newRepairOrder, ...getRepairOrders()];

  saveRepairOrders(nextRepairOrders);

  return newRepairOrder;
}

export function updateRepairOrder(
  repairOrderId: string,
  updates: Partial<RepairOrder>
): RepairOrder | null {
  const currentRepairOrders = getRepairOrders();
  const existingRepairOrder = currentRepairOrders.find(
    (repairOrder) => repairOrder.id === repairOrderId
  );

  if (!existingRepairOrder) {
    return null;
  }

  const updatedRepairOrder = normalizeRepairOrder({
    ...existingRepairOrder,
    ...updates,
    id: existingRepairOrder.id,
    repairOrderNumber: existingRepairOrder.repairOrderNumber,
    ro: existingRepairOrder.ro,
    createdDate: existingRepairOrder.createdDate,
    updatedDate: createTimestamp(),
  });

  const nextRepairOrders = currentRepairOrders.map((repairOrder) =>
    repairOrder.id === repairOrderId ? updatedRepairOrder : repairOrder
  );

  saveRepairOrders(nextRepairOrders);

  return updatedRepairOrder;
}

export function deleteRepairOrder(repairOrderId: string): RepairOrder[] {
  const nextRepairOrders = getRepairOrders().filter(
    (repairOrder) => repairOrder.id !== repairOrderId
  );

  saveRepairOrders(nextRepairOrders);

  return nextRepairOrders;
}

export function getRepairOrderById(repairOrderId: string): RepairOrder | null {
  return (
    getRepairOrders().find((repairOrder) => repairOrder.id === repairOrderId) ??
    null
  );
}

export function getRepairOrderByNumber(
  repairOrderNumber: string
): RepairOrder | null {
  const normalizedRepairOrderNumber = repairOrderNumber.trim().toLowerCase();

  return (
    getRepairOrders().find(
      (repairOrder) =>
        repairOrder.repairOrderNumber.trim().toLowerCase() ===
          normalizedRepairOrderNumber ||
        repairOrder.ro?.trim().toLowerCase() === normalizedRepairOrderNumber
    ) ?? null
  );
}

export function getRepairOrdersByCustomer(
  customerId: string,
  _options?: unknown
): RepairOrder[] {
  return getRepairOrders().filter(
    (repairOrder) => repairOrder.customerId === customerId
  );
}

export function getRepairOrdersByEquipment(
  equipmentId: string,
  _options?: unknown
): RepairOrder[] {
  return getRepairOrders().filter(
    (repairOrder) => repairOrder.equipmentId === equipmentId
  );
}

export function searchRepairOrders(searchTerm: string): RepairOrder[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return getRepairOrders();
  }

  return getRepairOrders().filter((repairOrder) => {
    const searchableValues = [
      repairOrder.repairOrderNumber,
      repairOrder.ro,
      repairOrder.status,
      repairOrder.priority,
      repairOrder.customerName,
      repairOrder.customerSnapshot.customerName,
      repairOrder.customerSnapshot.contactName,
      repairOrder.customerSnapshot.phone,
      repairOrder.customerSnapshot.email,
      repairOrder.customerSnapshot.serviceAddress,
      repairOrder.siteName,
      repairOrder.equipmentName ?? "",
      repairOrder.equipmentDescription,
      repairOrder.equipmentSnapshot?.equipmentName,
      repairOrder.equipmentSnapshot?.manufacturer,
      repairOrder.equipmentSnapshot?.model,
      repairOrder.equipmentSnapshot?.serialNumber,
      repairOrder.equipmentSnapshot?.assetNumber,
      repairOrder.complaint,
      repairOrder.concern,
      repairOrder.customerConcern,
      repairOrder.cause,
      repairOrder.correction,
      repairOrder.diagnosis,
      repairOrder.initialFindings,
      repairOrder.workPerformed,
      repairOrder.resolution,
      repairOrder.recommendations,
      repairOrder.assignedTechnicianName,
      repairOrder.assignedEmployeeDisplayName,
      repairOrder.assignedEmployeeRole,
      repairOrder.assignedUserName,
      repairOrder.assignedTruckName,
      repairOrder.internalNotes,
      repairOrder.customerNotes,
      repairOrder.notes,
    ];

    return searchableValues.some((value) =>
      value?.toLowerCase().includes(normalizedSearchTerm)
    );
  });
}

export function getOpenRepairOrders(): RepairOrder[] {
  return getRepairOrders().filter(
    (repairOrder) =>
      repairOrder.status !== "Completed" &&
      repairOrder.status !== "Closed" &&
      repairOrder.status !== "Invoiced" &&
      repairOrder.status !== "Cancelled"
  );
}

export function getCompletedRepairOrders(): RepairOrder[] {
  return getRepairOrders().filter(
    (repairOrder) =>
      repairOrder.status === "Completed" ||
      repairOrder.status === "Closed" ||
      repairOrder.status === "Invoiced"
  );
}

export function addRepairOrderActionItem(
  repairOrderId: string,
  input: RepairOrderActionItemInput
): RepairOrder | null {
  const repairOrder = getRepairOrderById(repairOrderId);

  if (!repairOrder) {
    return null;
  }

  const newActionItem = normalizeActionItem({
    ...input,
    id: input.id ?? createId("ACTION"),
    status: input.status ?? "Open",
    billingGroup: input.billingGroup ?? "Repair Charges",
    createdDate: input.createdDate ?? createTimestamp(),
    updatedDate: createTimestamp(),
  });

  return updateRepairOrder(repairOrderId, {
    actionItems: [newActionItem, ...repairOrder.actionItems],
  });
}

export function updateRepairOrderActionItem(
  repairOrderId: string,
  actionItemId: string,
  updates: Partial<RepairOrderActionItem>
): RepairOrder | null {
  const repairOrder = getRepairOrderById(repairOrderId);

  if (!repairOrder) {
    return null;
  }

  const nextActionItems = repairOrder.actionItems.map((actionItem) =>
    actionItem.id === actionItemId
      ? normalizeActionItem({
          ...actionItem,
          ...updates,
          id: actionItem.id,
          createdDate: actionItem.createdDate,
          updatedDate: createTimestamp(),
        })
      : actionItem
  );

  return updateRepairOrder(repairOrderId, {
    actionItems: nextActionItems,
  });
}

export function removeRepairOrderActionItem(
  repairOrderId: string,
  actionItemId: string
): RepairOrder | null {
  const repairOrder = getRepairOrderById(repairOrderId);

  if (!repairOrder) {
    return null;
  }

  return updateRepairOrder(repairOrderId, {
    actionItems: repairOrder.actionItems.filter(
      (actionItem) => actionItem.id !== actionItemId
    ),
  });
}

export function addRepairOrderPhoto(
  repairOrderId: string,
  photo: Partial<RepairOrderPhoto>
): RepairOrder | null {
  const repairOrder = getRepairOrderById(repairOrderId);

  if (!repairOrder) {
    return null;
  }

  const newPhoto = normalizePhoto(photo);

  return updateRepairOrder(repairOrderId, {
    photos: [newPhoto, ...repairOrder.photos],
  });
}

export function addRepairOrderLaborEntry(
  repairOrderId: string,
  laborEntry: Partial<RepairOrderLaborEntry>
): RepairOrder | null {
  const repairOrder = getRepairOrderById(repairOrderId);

  if (!repairOrder) {
    return null;
  }

  const newLaborEntry = normalizeLaborEntry({
    ...laborEntry,
    id: laborEntry.id ?? createId("LABOR"),
    createdDate: laborEntry.createdDate ?? createTimestamp(),
    updatedDate: createTimestamp(),
  });

  return updateRepairOrder(repairOrderId, {
    laborEntries: [newLaborEntry, ...repairOrder.laborEntries],
  });
}

export function completeRepairOrder(
  repairOrderId: string,
  correction?: string
): RepairOrder | null {
  return updateRepairOrder(repairOrderId, {
    status: "Completed",
    correction,
    completedDate: createTimestamp(),
  });
}

export function cancelRepairOrder(repairOrderId: string): RepairOrder | null {
  return updateRepairOrder(repairOrderId, {
    status: "Cancelled",
    cancelledDate: createTimestamp(),
  });
}