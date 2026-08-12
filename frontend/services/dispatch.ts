import { calculateRepairOrderDispatchReadiness } from "@/services/repair-order-dispatch-readiness";
import { getRepairOrders } from "@/services/repair-orders";

import type { DispatchJob } from "@/types/dispatch-job";
import type { RepairOrder } from "@/types/repair-orders";

const createDispatchJobFromRepairOrder = (
  repairOrder: RepairOrder
): DispatchJob => {
  const dispatchJob = {
    id: repairOrder.id,
    repairOrderId: repairOrder.id,
    repairOrderNumber: repairOrder.repairOrderNumber || repairOrder.ro,

    customerId: repairOrder.customerId,
    customerName: repairOrder.customerName,

    siteId: repairOrder.siteId,
    siteName: repairOrder.siteName,

    equipmentName: repairOrder.equipmentName,

    technicianId: repairOrder.assignedTechnicianId,
    technicianName: repairOrder.assignedTechnicianName,

    status: repairOrder.status as DispatchJob["status"],
    priority: repairOrder.priority,

    scheduledStart: repairOrder.scheduledDate,
    scheduledDate: repairOrder.scheduledDate,

    customerConcern: repairOrder.customerConcern || repairOrder.complaint,

    createdDate: repairOrder.createdDate,
    updatedDate: repairOrder.updatedDate,
  };

  return dispatchJob as DispatchJob;
};

export const getDispatchJobs = (): DispatchJob[] => {
  return getRepairOrders()
    .filter((repairOrder) => repairOrder.status !== "Draft")
    .filter((repairOrder) => repairOrder.status !== "Closed")
    .filter((repairOrder) => repairOrder.status !== "Cancelled")
    .filter((repairOrder) => repairOrder.status !== "Invoiced")
    .map(createDispatchJobFromRepairOrder);
};

export const getDispatchableRepairOrders = (): RepairOrder[] => {
  return getRepairOrders().filter((repairOrder) => {
    const readiness = calculateRepairOrderDispatchReadiness(repairOrder);

    return readiness.isReadyForDispatch;
  });
};

export const getDispatchedRepairOrders = (): RepairOrder[] => {
  return getRepairOrders().filter(
    (repairOrder) =>
      repairOrder.status === "Dispatched" ||
      repairOrder.status === "In Progress" ||
      repairOrder.status === "Waiting on Parts" ||
      repairOrder.status === "Waiting Approval"
  );
};

export const getRepairOrdersByTechnician = (
  technicianId: string
): RepairOrder[] => {
  return getRepairOrders().filter(
    (repairOrder) => repairOrder.assignedTechnicianId === technicianId
  );
};

export const getUnassignedDispatchRepairOrders = (): RepairOrder[] => {
  return getRepairOrders().filter(
    (repairOrder) =>
      !repairOrder.assignedTechnicianId && !repairOrder.assignedTechnicianName
  );
};

export const getScheduledRepairOrders = (): RepairOrder[] => {
  return getRepairOrders().filter(
    (repairOrder) => repairOrder.status === "Scheduled"
  );
};

export const getOpenRepairOrdersForDispatch = (): RepairOrder[] => {
  return getRepairOrders().filter(
    (repairOrder) =>
      repairOrder.status === "Open" ||
      repairOrder.status === "Scheduled" ||
      repairOrder.status === "Dispatched"
  );
};