"use client";

import { useMemo } from "react";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";

import SchedulingConflictsPanel from "@/components/scheduling/scheduling-conflicts-panel";

import { getDispatchableRepairOrders } from "@/services/dispatch";
import { getScheduleEvents } from "@/services/scheduling";
import { getUserFullName, getUsersByRole } from "@/services/users";

import type { ScheduleEvent } from "@/types/schedule-event";
import type { User } from "@/types/user";

import { getStatusTone } from "../utils/status-tone";

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const isToday = (value: string) => {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const getEventsForTechnician = (
  technician: User,
  scheduleEvents: ScheduleEvent[]
) => {
  return scheduleEvents.filter(
    (scheduleEvent) => scheduleEvent.technicianId === technician.id
  );
};

export default function SchedulingPage() {
  const scheduleEvents = useMemo(() => {
    return getScheduleEvents();
  }, []);

  const technicians = useMemo(() => {
    return getUsersByRole("Technician");
  }, []);

  const dispatchableRepairOrders = useMemo(() => {
    return getDispatchableRepairOrders();
  }, []);

  const scheduledTodayCount = useMemo(() => {
    return scheduleEvents.filter((scheduleEvent) =>
      isToday(scheduleEvent.startDateTime)
    ).length;
  }, [scheduleEvents]);

  const unassignedScheduleEvents = useMemo(() => {
    return scheduleEvents.filter(
      (scheduleEvent) =>
        !scheduleEvent.technicianId && !scheduleEvent.technicianName
    );
  }, [scheduleEvents]);

  return (
    <PageContainer>
      <div>
        <h1 className="text-5xl font-bold text-black">Scheduling</h1>

        <p className="mt-2 text-lg text-black/70">
          Technician workload, repair-order schedule events, and dispatch
          planning.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Scheduled Today" value={scheduledTodayCount} />

        <MetricCard label="Schedule Events" value={scheduleEvents.length} />

        <MetricCard label="Technicians" value={technicians.length} />

        <MetricCard
          label="Dispatch Ready"
          value={dispatchableRepairOrders.length}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Technician Schedule Board</h2>

            <p className="mt-1 text-sm text-black/60">
              Schedule events grouped by assigned technician.
            </p>
          </div>

          {technicians.length === 0 && (
            <EmptyState
              title="No technicians found"
              message="Add technician users to begin building the schedule board."
            />
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {technicians.map((technician) => {
              const technicianEvents = getEventsForTechnician(
                technician,
                scheduleEvents
              );

              return (
                <div
                  key={technician.id}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-5"
                >
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                      Technician
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {getUserFullName(technician)}
                    </div>

                    <div className="mt-1 text-sm text-black/60">
                      {technicianEvents.length} scheduled event
                      {technicianEvents.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  {technicianEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-5 text-center text-sm text-black/50">
                      No scheduled events.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {technicianEvents.map((scheduleEvent) => (
                        <div
                          key={scheduleEvent.id}
                          className="rounded-xl border border-black/10 bg-white/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-bold">
                                {scheduleEvent.title}
                              </div>

                              <div className="mt-1 text-sm text-black/60">
                                {scheduleEvent.customerName ||
                                  "No customer assigned"}
                              </div>
                            </div>

                            <StatusBadge
                              label={scheduleEvent.status}
                              tone={getStatusTone(scheduleEvent.status)}
                            />
                          </div>

                          <div className="mt-3 text-sm text-black/70">
                            <div>
                              Start:{" "}
                              {formatDateTime(scheduleEvent.startDateTime)}
                            </div>

                            <div>
                              End: {formatDateTime(scheduleEvent.endDateTime)}
                            </div>
                          </div>

                          {scheduleEvent.notes && (
                            <div className="mt-3 text-sm leading-6 text-black/60">
                              {scheduleEvent.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <SchedulingConflictsPanel scheduleEvents={scheduleEvents} />

      <Card className="text-black">
        <div className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Unassigned Schedule Events</h2>

            <p className="mt-1 text-sm text-black/60">
              Events created without technician assignment.
            </p>
          </div>

          {unassignedScheduleEvents.length === 0 && (
            <EmptyState
              title="No unassigned schedule events"
              message="Unassigned schedule events will appear here."
            />
          )}

          <div className="space-y-3">
            {unassignedScheduleEvents.map((scheduleEvent) => (
              <div
                key={scheduleEvent.id}
                className="rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="text-xl font-bold">
                      {scheduleEvent.title}
                    </div>

                    <div className="mt-1 text-sm text-black/60">
                      {scheduleEvent.customerName || "No customer assigned"}
                    </div>

                    <div className="mt-3 text-sm text-black/70">
                      {formatDateTime(scheduleEvent.startDateTime)} →{" "}
                      {formatDateTime(scheduleEvent.endDateTime)}
                    </div>
                  </div>

                  <StatusBadge
                    label={scheduleEvent.status}
                    tone={getStatusTone(scheduleEvent.status)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}