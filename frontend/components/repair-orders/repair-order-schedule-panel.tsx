"use client";

import { useEffect, useState } from "react";

import { createScheduleEventFromRepairOrder } from "@/services/repair-order-scheduling";
import { getScheduleEventsByRepairOrder } from "@/services/scheduling";

import type { RepairOrder } from "@/types/repair-orders";
import type { ScheduleEvent } from "@/types/schedule-event";

type RepairOrderSchedulePanelProps = {
  repairOrder: RepairOrder;
  onScheduleCreated?: () => void;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function RepairOrderSchedulePanel({
  repairOrder,
  onScheduleCreated,
}: RepairOrderSchedulePanelProps) {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [notes, setNotes] = useState("");

  function loadScheduleEvents() {
    setScheduleEvents(getScheduleEventsByRepairOrder(repairOrder.id));
  }

  useEffect(() => {
    loadScheduleEvents();
  }, [repairOrder.id]);

  function handleCreateScheduleEvent() {
    if (!startDateTime.trim()) {
      alert("Start date/time is required.");
      return;
    }

    if (!endDateTime.trim()) {
      alert("End date/time is required.");
      return;
    }

    const start = new Date(startDateTime).getTime();
    const end = new Date(endDateTime).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      alert("Start and end date/time must be valid.");
      return;
    }

    if (end <= start) {
      alert("End date/time must be after start date/time.");
      return;
    }

    createScheduleEventFromRepairOrder({
      repairOrder,
      startDateTime,
      endDateTime,
      notes: notes.trim() || undefined,
    });

    setStartDateTime("");
    setEndDateTime("");
    setNotes("");

    loadScheduleEvents();
    onScheduleCreated?.();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Scheduling</h2>

        <p className="mt-1 text-sm text-white/60">
          Create and review schedule events connected to this repair order.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Start Date / Time
          </label>

          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(event) => setStartDateTime(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            End Date / Time
          </label>

          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(event) => setEndDateTime(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleCreateScheduleEvent}
            className="w-full rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
          >
            Create Schedule Event
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Schedule Notes
        </label>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Optional schedule notes."
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-white">
          Existing Schedule Events
        </h3>

        {scheduleEvents.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
            <div className="text-sm font-semibold text-white">
              No schedule events found.
            </div>

            <div className="mt-1 text-sm text-white/60">
              Schedule events created for this repair order will appear here.
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {scheduleEvents.map((scheduleEvent) => (
              <div
                key={scheduleEvent.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-200/70">
                      {scheduleEvent.status}
                    </div>

                    <div className="mt-1 text-lg font-bold text-white">
                      {scheduleEvent.title}
                    </div>

                    <div className="mt-1 text-sm text-white/60">
                      {scheduleEvent.technicianName || "Technician unassigned"}
                    </div>

                    {scheduleEvent.notes && (
                      <div className="mt-2 text-sm leading-6 text-white/70">
                        {scheduleEvent.notes}
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-white/60 md:text-right">
                    <div>{formatDateTime(scheduleEvent.startDateTime)}</div>
                    <div>{formatDateTime(scheduleEvent.endDateTime)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}