"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";

import SchedulingConflictsPanel from "@/components/scheduling/scheduling-conflicts-panel";

import { getDispatchableRepairOrders } from "@/services/dispatch";
import { createScheduleEvent, getScheduleEvents } from "@/services/scheduling";
import { getActiveTechnicianProfiles } from "@/services/technician-profiles";
import { createId, createTimestamp } from "@/lib/storage";

import type {
  ScheduleEvent,
  ScheduleEventType,
} from "@/types/schedule-event";
import type { TechnicianProfile } from "@/types/technician-profile";

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
  technician: TechnicianProfile,
  scheduleEvents: ScheduleEvent[]
) => {
  return scheduleEvents.filter(
    (scheduleEvent) => scheduleEvent.technicianId === technician.id
  );
};

const appointmentTypeOptions: ScheduleEventType[] = [
  "Appointment",
  "Service Call",
  "Inspection",
  "Installation",
  "Calibration",
  "Administrative",
  "Other",
];

type AppointmentFormState = {
  title: string;
  type: ScheduleEventType;
  customerId: string;
  customerName: string;
  siteName: string;
  equipmentName: string;
  technicianId: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  notes: string;
};

const emptyAppointmentForm: AppointmentFormState = {
  title: "",
  type: "Appointment",
  customerId: "",
  customerName: "",
  siteName: "",
  equipmentName: "",
  technicianId: "",
  startDateTime: "",
  endDateTime: "",
  location: "",
  notes: "",
};

export default function SchedulingPage() {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [dispatchableRepairOrders, setDispatchableRepairOrders] = useState<
    ReturnType<typeof getDispatchableRepairOrders>
  >([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(
    emptyAppointmentForm
  );

  function loadScheduleEvents() {
    setScheduleEvents(getScheduleEvents());
  }

  useEffect(() => {
    loadScheduleEvents();
    setTechnicians(getActiveTechnicianProfiles());
    setDispatchableRepairOrders(getDispatchableRepairOrders());

    const params = new URLSearchParams(window.location.search);
    const customerIdParam = params.get("customerId") ?? "";
    const customerNameParam = params.get("customerName") ?? "";
    const shouldOpenCreate = params.get("openCreate") === "1";

    if (customerIdParam || customerNameParam) {
      setAppointmentForm((currentForm) => ({
        ...currentForm,
        customerId: customerIdParam,
        customerName: customerNameParam,
      }));
    }

    if (shouldOpenCreate) {
      setIsCreateOpen(true);
    }
  }, []);

  function updateAppointmentForm<K extends keyof AppointmentFormState>(
    key: K,
    value: AppointmentFormState[K]
  ) {
    setAppointmentForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function resetAppointmentForm() {
    setAppointmentForm(emptyAppointmentForm);
  }

  function handleCreateAppointment() {
    const customerName = appointmentForm.customerName.trim();
    const startDateTime = appointmentForm.startDateTime;

    if (!customerName) {
      alert("Customer name is required.");
      return;
    }

    if (!startDateTime) {
      alert("Start date/time is required.");
      return;
    }

    const selectedTechnician = technicians.find(
      (technician) => technician.id === appointmentForm.technicianId
    );

    const title =
      appointmentForm.title.trim() || `${appointmentForm.type} - ${customerName}`;

    const newScheduleEvent: ScheduleEvent = {
      id: createId(),

      type: appointmentForm.type,
      status: "Scheduled",

      title,

      customerId: appointmentForm.customerId || undefined,
      customerName,

      siteName: appointmentForm.siteName.trim() || undefined,
      equipmentName: appointmentForm.equipmentName.trim() || undefined,

      technicianId: selectedTechnician?.id,
      technicianName: selectedTechnician?.displayName,

      startDateTime,
      endDateTime: appointmentForm.endDateTime || startDateTime,

      location: appointmentForm.location.trim() || undefined,
      notes: appointmentForm.notes.trim() || undefined,

      createdDate: createTimestamp(),
    };

    createScheduleEvent(newScheduleEvent);

    resetAppointmentForm();
    setIsCreateOpen(false);
    loadScheduleEvents();
  }

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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-5xl font-bold text-black">
            Appointments / Scheduling
          </h1>

          <p className="mt-2 text-lg text-black/70">
            Appointments, technician workload, repair-order schedule events,
            and dispatch planning.
          </p>
        </div>

        <button data-t1eq-action-button="true"
          type="button"
          onClick={() => setIsCreateOpen((current) => !current)}
          className="rounded-xl border border-black/20 bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/80"
        >
          {isCreateOpen ? "Close Appointment Form" : "New Appointment"}
        </button>
      </div>

      {isCreateOpen && (
        <Card className="text-black">
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold">New Appointment</h2>

              <p className="mt-1 text-sm text-black/60">
                Schedule a standalone appointment for a customer.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Customer Name
                </span>

                <input data-t1eq-field="true"
                  type="text"
                  value={appointmentForm.customerName}
                  onChange={(event) =>
                    updateAppointmentForm("customerName", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Customer name"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Appointment Type
                </span>

                <select data-t1eq-field="true"
                  value={appointmentForm.type}
                  onChange={(event) =>
                    updateAppointmentForm(
                      "type",
                      event.target.value as ScheduleEventType
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  {appointmentTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Site / Location
                </span>

                <input data-t1eq-field="true"
                  type="text"
                  value={appointmentForm.siteName}
                  onChange={(event) =>
                    updateAppointmentForm("siteName", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Equipment
                </span>

                <input data-t1eq-field="true"
                  type="text"
                  value={appointmentForm.equipmentName}
                  onChange={(event) =>
                    updateAppointmentForm("equipmentName", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Technician
                </span>

                <select data-t1eq-field="true"
                  value={appointmentForm.technicianId}
                  onChange={(event) =>
                    updateAppointmentForm("technicianId", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>

                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Start Date / Time
                </span>

                <input data-t1eq-field="true"
                  type="datetime-local"
                  value={appointmentForm.startDateTime}
                  onChange={(event) =>
                    updateAppointmentForm("startDateTime", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  End Date / Time
                </span>

                <input data-t1eq-field="true"
                  type="datetime-local"
                  value={appointmentForm.endDateTime}
                  onChange={(event) =>
                    updateAppointmentForm("endDateTime", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Location Notes
                </span>

                <input data-t1eq-field="true"
                  type="text"
                  value={appointmentForm.location}
                  onChange={(event) =>
                    updateAppointmentForm("location", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Gate code, parking, access notes..."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  Notes
                </span>

                <textarea data-t1eq-field="true"
                  value={appointmentForm.notes}
                  onChange={(event) =>
                    updateAppointmentForm("notes", event.target.value)
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleCreateAppointment}
                className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/80"
              >
                Create Appointment
              </button>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={resetAppointmentForm}
                className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-black/5"
              >
                Reset
              </button>
            </div>
          </div>
        </Card>
      )}

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
              message="Add employees in Employee Setup to begin building the schedule board."
            />
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {technicians.map((technician) => {
              const technicianEvents = getEventsForTechnician(
                technician,
                scheduleEvents
              );

              return (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={technician.id}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-5"
                >
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                      Technician
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {technician.displayName}
                    </div>

                    <div className="mt-1 text-sm text-black/60">
                      {technicianEvents.length} scheduled event
                      {technicianEvents.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  {technicianEvents.length === 0 ? (
                    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-xl border border-dashed border-black/10 bg-white/60 p-5 text-center text-sm text-black/50">
                      No scheduled events.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {technicianEvents.map((scheduleEvent) => (
                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
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
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
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
