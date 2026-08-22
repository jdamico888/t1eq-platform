import {
  detectScheduleConflicts,
  getAllTechnicianScheduleLoads,
} from "@/services/scheduling-conflicts";

import type { ScheduleEvent } from "@/types/schedule-event";

type SchedulingConflictsPanelProps = {
  scheduleEvents: ScheduleEvent[];
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function SchedulingConflictsPanel({
  scheduleEvents,
}: SchedulingConflictsPanelProps) {
  const conflicts = detectScheduleConflicts(scheduleEvents);
  const technicianLoads = getAllTechnicianScheduleLoads(scheduleEvents);

  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-black/10 bg-black/[0.03] p-5">
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-black">
          Scheduling Intelligence
        </h2>

        <p className="mt-1 text-sm text-black/60">
          Technician conflicts, workload, and schedule risk indicators.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-black/10 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-black/50">
            Active Conflicts
          </div>

          <div className="mt-1 text-3xl font-bold text-black">
            {conflicts.length}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-black/10 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-black/50">
            Technicians Scheduled
          </div>

          <div className="mt-1 text-3xl font-bold text-black">
            {technicianLoads.length}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-black/10 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-black/50">
            Total Schedule Events
          </div>

          <div className="mt-1 text-3xl font-bold text-black">
            {scheduleEvents.length}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div>
          <h3 className="text-xl font-bold text-black">Conflicts</h3>

          {conflicts.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-3 rounded-xl border border-dashed border-black/10 bg-white/60 p-5 text-center text-sm text-black/50">
              No schedule conflicts detected.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {conflicts.map((conflict) => (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={conflict.id}
                  className="rounded-xl border border-red-300 bg-red-50 p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-red-700/70">
                    {conflict.severity} Conflict
                  </div>

                  <div className="mt-1 text-lg font-bold text-red-950">
                    {conflict.technicianName || "Technician"}
                  </div>

                  <div className="mt-2 text-sm leading-6 text-red-900/80">
                    <div>{conflict.eventA.title}</div>
                    <div>{conflict.eventB.title}</div>
                  </div>

                  <div className="mt-3 text-sm font-semibold text-red-900">
                    {formatDateTime(conflict.overlapStart)} →{" "}
                    {formatDateTime(conflict.overlapEnd)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-black">Technician Loads</h3>

          {technicianLoads.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-3 rounded-xl border border-dashed border-black/10 bg-white/60 p-5 text-center text-sm text-black/50">
              No technician schedule load data available.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {technicianLoads.map((load) => (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={load.technicianId}
                  className="rounded-xl border border-black/10 bg-white/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-black">
                        {load.technicianName || "Technician"}
                      </div>

                      <div className="mt-1 text-sm text-black/60">
                        {load.eventCount} scheduled event
                        {load.eventCount === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wide text-black/50">
                        Hours
                      </div>

                      <div className="mt-1 text-2xl font-bold text-black">
                        {load.totalScheduledHours.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}