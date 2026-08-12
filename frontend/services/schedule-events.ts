import type { ScheduleEvent } from "../types/schedule-event";

const STORAGE_KEY = "t1eq-schedule-events";

export function getScheduleEvents(): ScheduleEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedScheduleEvents = localStorage.getItem(STORAGE_KEY);

  if (!savedScheduleEvents) {
    return [];
  }

  try {
    return JSON.parse(savedScheduleEvents) as ScheduleEvent[];
  } catch (error) {
    console.error("Failed to parse schedule events.", error);

    return [];
  }
}

export function saveScheduleEvents(scheduleEvents: ScheduleEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleEvents));
}

export function createScheduleEvent(scheduleEvent: ScheduleEvent) {
  const scheduleEvents = getScheduleEvents();

  saveScheduleEvents([scheduleEvent, ...scheduleEvents]);

  return scheduleEvent;
}

export function updateScheduleEvent(updatedScheduleEvent: ScheduleEvent) {
  const scheduleEvents = getScheduleEvents();

  const updatedScheduleEvents = scheduleEvents.map((scheduleEvent) =>
    scheduleEvent.id === updatedScheduleEvent.id
      ? {
          ...updatedScheduleEvent,
          updatedDate: new Date().toISOString(),
        }
      : scheduleEvent
  );

  saveScheduleEvents(updatedScheduleEvents);

  return updatedScheduleEvent;
}

export function deleteScheduleEvent(scheduleEventId: string) {
  const scheduleEvents = getScheduleEvents();

  const updatedScheduleEvents = scheduleEvents.filter(
    (scheduleEvent) => scheduleEvent.id !== scheduleEventId
  );

  saveScheduleEvents(updatedScheduleEvents);
}

export function getScheduleEventById(scheduleEventId: string) {
  return getScheduleEvents().find(
    (scheduleEvent) => scheduleEvent.id === scheduleEventId
  );
}

export function getScheduleEventsByTechnician(
  technicianId: string,
  technicianName?: string
) {
  return getScheduleEvents().filter(
    (scheduleEvent) =>
      scheduleEvent.technicianId === technicianId ||
      scheduleEvent.technicianName === technicianName
  );
}

export function getTodayScheduleEvents() {
  const today = new Date().toDateString();

  return getScheduleEvents().filter(
    (scheduleEvent) =>
      new Date(scheduleEvent.startDateTime).toDateString() === today
  );
}

export function getUpcomingScheduleEvents(days = 7) {
  const now = new Date();
  const futureDate = new Date();

  futureDate.setDate(futureDate.getDate() + days);

  return getScheduleEvents().filter((scheduleEvent) => {
    const eventDate = new Date(scheduleEvent.startDateTime);

    return eventDate >= now && eventDate <= futureDate;
  });
}