"use client";

import type { RepairOrder, RepairOrderActionItem } from "@/types/repair-order";

type RepairOrderTimelineItem = {
  id: string;
  label: string;
  date: string;
  description: string;
  status?: string;
};

export type RepairOrderTimelineProps = {
  repairOrder: RepairOrder;
  className?: string;
  [key: string]: unknown;
};

function formatDateTime(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRepairOrderNumber(repairOrder: RepairOrder): string {
  return repairOrder.repairOrderNumber || repairOrder.ro || repairOrder.id;
}

function getFallbackDate(repairOrder: RepairOrder): string {
  return (
    repairOrder.openedDate ||
    repairOrder.createdDate ||
    repairOrder.updatedDate ||
    new Date(0).toISOString()
  );
}

function createTimelineItem(input: {
  id: string;
  label: string;
  date?: string;
  fallbackDate: string;
  description: string;
  status?: string;
}): RepairOrderTimelineItem {
  return {
    id: input.id,
    label: input.label,
    date: input.date ?? input.fallbackDate,
    description: input.description,
    status: input.status,
  };
}

function getCompletedActionItems(
  repairOrder: RepairOrder,
  fallbackDate: string
): RepairOrderTimelineItem[] {
  return repairOrder.actionItems
    .filter((actionItem: RepairOrderActionItem) =>
      Boolean(actionItem.completedDate)
    )
    .map((actionItem: RepairOrderActionItem) =>
      createTimelineItem({
        id: `action-${actionItem.id}`,
        label: "Action Completed",
        date: actionItem.completedDate,
        fallbackDate,
        description: actionItem.title,
        status: actionItem.status,
      })
    );
}

function buildTimelineItems(repairOrder: RepairOrder): RepairOrderTimelineItem[] {
  const fallbackDate = getFallbackDate(repairOrder);
  const repairOrderNumber = getRepairOrderNumber(repairOrder);
  const timelineItems: RepairOrderTimelineItem[] = [];

  timelineItems.push(
    createTimelineItem({
      id: "opened",
      label: "Repair Order Opened",
      date: repairOrder.openedDate,
      fallbackDate,
      description: `${repairOrderNumber} opened for ${
        repairOrder.customerName || repairOrder.customerSnapshot.customerName
      }`,
      status: "Open",
    })
  );

  if (repairOrder.draftDate) {
    timelineItems.push(
      createTimelineItem({
        id: "draft",
        label: "Draft Created",
        date: repairOrder.draftDate,
        fallbackDate,
        description: "Repair order draft was created.",
        status: "Draft",
      })
    );
  }

  if (repairOrder.scheduledDate) {
    timelineItems.push(
      createTimelineItem({
        id: "scheduled",
        label: "Scheduled",
        date: repairOrder.scheduledDate,
        fallbackDate,
        description: repairOrder.assignedTechnicianName
          ? `Scheduled with ${repairOrder.assignedTechnicianName}.`
          : "Repair order was scheduled.",
        status: "Scheduled",
      })
    );
  }

  if (repairOrder.dispatchedDate || repairOrder.status === "Dispatched") {
    timelineItems.push(
      createTimelineItem({
        id: "dispatched",
        label: "Dispatched",
        date: repairOrder.dispatchedDate,
        fallbackDate,
        description: repairOrder.assignedTruckName
          ? `Dispatched on ${repairOrder.assignedTruckName}.`
          : "Repair order was dispatched.",
        status: "Dispatched",
      })
    );
  }

  if (repairOrder.inProgressDate || repairOrder.status === "In Progress") {
    timelineItems.push(
      createTimelineItem({
        id: "in-progress",
        label: "In Progress",
        date: repairOrder.inProgressDate,
        fallbackDate,
        description: "Work started on this repair order.",
        status: "In Progress",
      })
    );
  }

  if (repairOrder.waitingPartsDate || repairOrder.status === "Waiting Parts") {
    timelineItems.push(
      createTimelineItem({
        id: "waiting-parts",
        label: "Waiting Parts",
        date: repairOrder.waitingPartsDate,
        fallbackDate,
        description: "Repair order is waiting on parts.",
        status: "Waiting Parts",
      })
    );
  }

  if (
    repairOrder.waitingApprovalDate ||
    repairOrder.status === "Waiting Approval"
  ) {
    timelineItems.push(
      createTimelineItem({
        id: "waiting-approval",
        label: "Waiting Approval",
        date: repairOrder.waitingApprovalDate,
        fallbackDate,
        description: "Repair order is waiting for approval.",
        status: "Waiting Approval",
      })
    );
  }

  timelineItems.push(...getCompletedActionItems(repairOrder, fallbackDate));

  if (repairOrder.completedDate || repairOrder.status === "Completed") {
    timelineItems.push(
      createTimelineItem({
        id: "completed",
        label: "Completed",
        date: repairOrder.completedDate,
        fallbackDate,
        description:
          repairOrder.workPerformed ||
          repairOrder.resolution ||
          repairOrder.correction ||
          "Repair order was completed.",
        status: "Completed",
      })
    );
  }

  if (repairOrder.closedDate || repairOrder.status === "Closed") {
    timelineItems.push(
      createTimelineItem({
        id: "closed",
        label: "Closed",
        date: repairOrder.closedDate,
        fallbackDate,
        description: "Repair order was closed.",
        status: "Closed",
      })
    );
  }

  if (repairOrder.invoicedDate || repairOrder.status === "Invoiced") {
    timelineItems.push(
      createTimelineItem({
        id: "invoiced",
        label: "Invoiced",
        date: repairOrder.invoicedDate,
        fallbackDate,
        description: "Repair order was invoiced.",
        status: "Invoiced",
      })
    );
  }

  if (repairOrder.cancelledDate || repairOrder.status === "Cancelled") {
    timelineItems.push(
      createTimelineItem({
        id: "cancelled",
        label: "Cancelled",
        date: repairOrder.cancelledDate,
        fallbackDate,
        description: "Repair order was cancelled.",
        status: "Cancelled",
      })
    );
  }

  return timelineItems.sort(
    (firstItem, secondItem) =>
      new Date(firstItem.date).getTime() - new Date(secondItem.date).getTime()
  );
}

export function RepairOrderTimeline({
  repairOrder,
  className = "",
}: RepairOrderTimelineProps) {
  const timelineItems = buildTimelineItems(repairOrder);

  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
          Timeline
        </p>
        <h2 className="text-xl font-black text-zinc-950">
          Repair Order History
        </h2>
      </div>

      <div className="space-y-4">
        {timelineItems.map((timelineItem, index) => (
          <div key={timelineItem.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-zinc-950" />
              {index < timelineItems.length - 1 && (
                <div className="mt-1 h-full min-h-12 w-px bg-zinc-200" />
              )}
            </div>

            <div className="pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-zinc-950">
                  {timelineItem.label}
                </h3>

                {timelineItem.status && (
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-600">
                    {timelineItem.status}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs font-bold text-zinc-500">
                {formatDateTime(timelineItem.date)}
              </p>

              <p className="mt-2 text-sm font-medium text-zinc-700">
                {timelineItem.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RepairOrderTimeline;