import type { RepairOrder } from "@/types/repair-order";
import { getRepairOrders } from "@/services/repair-orders";

export type RepairOrderScheduleItem = {
  id: string;
  repairOrderId: string;
  repairOrderNumber: string;
  customerId?: string;
  customerName: string;
  siteId?: string;
  siteName?: string;
  equipmentId?: string;
  equipmentName?: string;
  concern: string;
  status: RepairOrder["status"];
  priority: RepairOrder["priority"];
  scheduledDate?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTruckId?: string;
  assignedTruckName?: string;
};

export type RepairOrderScheduleEvent = {
  id: string;
  repairOrderId: string;
  title: string;
  startDate: string;
  endDate?: string;
  customerName: string;
  siteName?: string;
  equipmentName?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTruckId?: string;
  assignedTruckName?: string;
  status: RepairOrder["status"];
  priority: RepairOrder["priority"];
};

export type CreateScheduleEventInput = {
  repairOrder: RepairOrder;
  startDate?: string;
  startDateTime?: string;
  endDate?: string;
  endDateTime?: string;
};

function getRepairOrderNumber(repairOrder: RepairOrder) {
  return repairOrder.repairOrderNumber || repairOrder.ro || repairOrder.id;
}

function getRepairOrderConcern(repairOrder: RepairOrder) {
  return (
    repairOrder.customerConcern ||
    repairOrder.concern ||
    repairOrder.complaint ||
    ""
  );
}

function getRepairOrderSiteName(repairOrder: RepairOrder) {
  return (
    repairOrder.siteName ||
    repairOrder.equipmentSnapshot?.locationName ||
    repairOrder.customerSnapshot.serviceAddress ||
    ""
  );
}

function getRepairOrderEquipmentName(repairOrder: RepairOrder) {
  return (
    repairOrder.equipmentName ||
    repairOrder.equipmentSnapshot?.equipmentName ||
    ""
  );
}

function repairOrderToScheduleItem(
  repairOrder: RepairOrder
): RepairOrderScheduleItem {
  return {
    id: repairOrder.id,
    repairOrderId: repairOrder.id,
    repairOrderNumber: getRepairOrderNumber(repairOrder),

    customerId: repairOrder.customerId,
    customerName:
      repairOrder.customerName || repairOrder.customerSnapshot.customerName,

    siteId: repairOrder.siteId,
    siteName: getRepairOrderSiteName(repairOrder),

    equipmentId: repairOrder.equipmentId,
    equipmentName: getRepairOrderEquipmentName(repairOrder),

    concern: getRepairOrderConcern(repairOrder),

    status: repairOrder.status,
    priority: repairOrder.priority,

    scheduledDate: repairOrder.scheduledDate,

    assignedTechnicianId: repairOrder.assignedTechnicianId,
    assignedTechnicianName: repairOrder.assignedTechnicianName,

    assignedTruckId: repairOrder.assignedTruckId,
    assignedTruckName: repairOrder.assignedTruckName,
  };
}

function normalizeScheduleEventInput(
  input: RepairOrder | CreateScheduleEventInput
): CreateScheduleEventInput {
  if ("repairOrder" in input) {
    return input;
  }

  return {
    repairOrder: input,
  };
}

export function createScheduleEventFromRepairOrder(
  input: RepairOrder | CreateScheduleEventInput
): RepairOrderScheduleEvent {
  const { repairOrder, startDate, startDateTime, endDate, endDateTime } =
    normalizeScheduleEventInput(input);

  const resolvedStartDate =
    startDateTime ||
    startDate ||
    repairOrder.scheduledDate ||
    repairOrder.dispatchedDate ||
    repairOrder.openedDate ||
    repairOrder.createdDate ||
    new Date().toISOString();

  const resolvedEndDate = endDateTime || endDate;

  const repairOrderNumber = getRepairOrderNumber(repairOrder);
  const customerName =
    repairOrder.customerName || repairOrder.customerSnapshot.customerName;

  return {
    id: `schedule-${repairOrder.id}`,
    repairOrderId: repairOrder.id,
    title: `${repairOrderNumber} - ${customerName}`,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    customerName,
    siteName: getRepairOrderSiteName(repairOrder),
    equipmentName: getRepairOrderEquipmentName(repairOrder),
    assignedTechnicianId: repairOrder.assignedTechnicianId,
    assignedTechnicianName: repairOrder.assignedTechnicianName,
    assignedTruckId: repairOrder.assignedTruckId,
    assignedTruckName: repairOrder.assignedTruckName,
    status: repairOrder.status,
    priority: repairOrder.priority,
  };
}

export function getScheduledRepairOrders(): RepairOrderScheduleItem[] {
  return getRepairOrders()
    .filter((repairOrder) => Boolean(repairOrder.scheduledDate))
    .map(repairOrderToScheduleItem);
}

export function getUnscheduledRepairOrders(): RepairOrderScheduleItem[] {
  return getRepairOrders()
    .filter(
      (repairOrder) =>
        !repairOrder.scheduledDate &&
        repairOrder.status !== "Completed" &&
        repairOrder.status !== "Closed" &&
        repairOrder.status !== "Invoiced" &&
        repairOrder.status !== "Cancelled"
    )
    .map(repairOrderToScheduleItem);
}

export function getRepairOrdersScheduledForDate(
  date: string
): RepairOrderScheduleItem[] {
  return getScheduledRepairOrders().filter((repairOrder) =>
    repairOrder.scheduledDate?.startsWith(date)
  );
}

export function getRepairOrdersByScheduledTechnician(
  technicianId: string
): RepairOrderScheduleItem[] {
  return getScheduledRepairOrders().filter(
    (repairOrder) => repairOrder.assignedTechnicianId === technicianId
  );
}

export function getRepairOrdersByScheduledTruck(
  truckId: string
): RepairOrderScheduleItem[] {
  return getScheduledRepairOrders().filter(
    (repairOrder) => repairOrder.assignedTruckId === truckId
  );
}

export function getRepairOrderScheduleItems(): RepairOrderScheduleItem[] {
  return getRepairOrders().map(repairOrderToScheduleItem);
}