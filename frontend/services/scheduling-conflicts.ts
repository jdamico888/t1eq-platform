import type { ScheduleEvent } from "@/types/schedule-event";

export type ScheduleConflict = {
  id: string;

  technicianId?: string;
  technicianName?: string;

  eventA: ScheduleEvent;
  eventB: ScheduleEvent;

  overlapStart: string;
  overlapEnd: string;

  severity: "Warning" | "Blocking";
};

export type TechnicianScheduleLoad = {
  technicianId?: string;
  technicianName?: string;

  eventCount: number;
  lineCount: number;
  totalScheduledHours: number;
};

const getTime = (value: string) => {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const dateRangesOverlap = (
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) => {
  const firstStartTime = getTime(firstStart);
  const firstEndTime = getTime(firstEnd);
  const secondStartTime = getTime(secondStart);
  const secondEndTime = getTime(secondEnd);

  return firstStartTime < secondEndTime && secondStartTime < firstEndTime;
};

const getOverlapWindow = (
  firstEvent: ScheduleEvent,
  secondEvent: ScheduleEvent
) => {
  const overlapStartTime = Math.max(
    getTime(firstEvent.startDateTime),
    getTime(secondEvent.startDateTime)
  );

  const overlapEndTime = Math.min(
    getTime(firstEvent.endDateTime),
    getTime(secondEvent.endDateTime)
  );

  return {
    overlapStart: new Date(overlapStartTime).toISOString(),
    overlapEnd: new Date(overlapEndTime).toISOString(),
  };
};

export const detectScheduleConflicts = (
  scheduleEvents: ScheduleEvent[]
): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];

  for (let firstIndex = 0; firstIndex < scheduleEvents.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < scheduleEvents.length;
      secondIndex += 1
    ) {
      const firstEvent = scheduleEvents[firstIndex];
      const secondEvent = scheduleEvents[secondIndex];

      if (!firstEvent.technicianId || !secondEvent.technicianId) {
        continue;
      }

      if (firstEvent.technicianId !== secondEvent.technicianId) {
        continue;
      }

      const overlaps = dateRangesOverlap(
        firstEvent.startDateTime,
        firstEvent.endDateTime,
        secondEvent.startDateTime,
        secondEvent.endDateTime
      );

      if (!overlaps) {
        continue;
      }

      const overlapWindow = getOverlapWindow(firstEvent, secondEvent);

      conflicts.push({
        id: `${firstEvent.id}-${secondEvent.id}`,

        technicianId: firstEvent.technicianId,
        technicianName: firstEvent.technicianName,

        eventA: firstEvent,
        eventB: secondEvent,

        overlapStart: overlapWindow.overlapStart,
        overlapEnd: overlapWindow.overlapEnd,

        severity: "Blocking",
      });
    }
  }

  return conflicts;
};

export const hasTechnicianConflict = (
  scheduleEvents: ScheduleEvent[],
  proposedEvent: ScheduleEvent
) => {
  if (!proposedEvent.technicianId) {
    return false;
  }

  return scheduleEvents.some((scheduleEvent) => {
    if (scheduleEvent.id === proposedEvent.id) {
      return false;
    }

    if (scheduleEvent.technicianId !== proposedEvent.technicianId) {
      return false;
    }

    return dateRangesOverlap(
      scheduleEvent.startDateTime,
      scheduleEvent.endDateTime,
      proposedEvent.startDateTime,
      proposedEvent.endDateTime
    );
  });
};

export const getTechnicianScheduleLoad = (
  scheduleEvents: ScheduleEvent[],
  technicianId: string
): TechnicianScheduleLoad => {
  const technicianEvents = scheduleEvents.filter(
    (scheduleEvent) => scheduleEvent.technicianId === technicianId
  );

  const totalScheduledHours = technicianEvents.reduce(
    (total, scheduleEvent) => {
      const durationMilliseconds =
        getTime(scheduleEvent.endDateTime) - getTime(scheduleEvent.startDateTime);

      const durationHours = durationMilliseconds / 1000 / 60 / 60;

      return total + Math.max(durationHours, 0);
    },
    0
  );

  const lineCount = technicianEvents.reduce(
    (total, scheduleEvent) => total + (scheduleEvent.actionItems?.length ?? 0),
    0
  );

  return {
    technicianId,
    technicianName: technicianEvents[0]?.technicianName,

    eventCount: technicianEvents.length,
    lineCount,
    totalScheduledHours,
  };
};

export const getAllTechnicianScheduleLoads = (
  scheduleEvents: ScheduleEvent[]
): TechnicianScheduleLoad[] => {
  const technicianIds = Array.from(
    new Set(
      scheduleEvents
        .map((scheduleEvent) => scheduleEvent.technicianId)
        .filter((technicianId): technicianId is string => Boolean(technicianId))
    )
  );

  return technicianIds.map((technicianId) =>
    getTechnicianScheduleLoad(scheduleEvents, technicianId)
  );
};