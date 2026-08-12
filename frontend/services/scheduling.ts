import type { ScheduleEvent } from "@/types/schedule-event";

const STORAGE_KEY = "t1eq-schedule-events";

export const getScheduleEvents = (): ScheduleEvent[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as ScheduleEvent[];
  } catch (error) {
    console.error("Failed to parse schedule events.", error);

    return [];
  }
};

export const saveScheduleEvents = (
  scheduleEvents: ScheduleEvent[]
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(scheduleEvents)
  );
};

export const createScheduleEvent = (
  scheduleEvent: ScheduleEvent
) => {
  const scheduleEvents = getScheduleEvents();

  saveScheduleEvents([
    ...scheduleEvents,
    scheduleEvent,
  ]);

  return scheduleEvent;
};

export const updateScheduleEvent = (
  scheduleEventId: string,
  updatedScheduleEvent: ScheduleEvent
) => {
  const scheduleEvents = getScheduleEvents();

  const updatedScheduleEvents = scheduleEvents.map(
    (scheduleEvent) =>
      scheduleEvent.id === scheduleEventId
        ? {
            ...updatedScheduleEvent,
            updatedDate: new Date().toISOString(),
          }
        : scheduleEvent
  );

  saveScheduleEvents(updatedScheduleEvents);

  return updatedScheduleEvent;
};

export const deleteScheduleEvent = (
  scheduleEventId: string
) => {
  const scheduleEvents = getScheduleEvents();

  const filteredScheduleEvents = scheduleEvents.filter(
    (scheduleEvent) =>
      scheduleEvent.id !== scheduleEventId
  );

  saveScheduleEvents(filteredScheduleEvents);
};

export const getScheduleEventsByTechnician = (
  technicianId: string
) => {
  return getScheduleEvents().filter(
    (scheduleEvent) =>
      scheduleEvent.technicianId === technicianId
  );
};

export const getScheduleEventsByRepairOrder = (
  repairOrderId: string
) => {
  return getScheduleEvents().filter(
    (scheduleEvent) =>
      scheduleEvent.repairOrderId === repairOrderId
  );
};

export const getScheduleEventsByDateRange = (
  startDate: string,
  endDate: string
) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return getScheduleEvents().filter(
    (scheduleEvent) => {
      const eventStart = new Date(
        scheduleEvent.startDateTime
      ).getTime();

      return eventStart >= start && eventStart <= end;
    }
  );
};