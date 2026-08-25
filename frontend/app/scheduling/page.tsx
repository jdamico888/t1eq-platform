"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";

import SchedulingConflictsPanel from "@/components/scheduling/scheduling-conflicts-panel";
import ScheduleEventInvoicePanel from "@/components/scheduling/schedule-event-invoice-panel";
import SpecialOrderPartsPanel from "@/components/scheduling/special-order-parts-panel";

import CustomerLookup, {
  emptyCustomerLookupValues,
  resolveCustomerLookupRecord,
  type CustomerLookupValues,
} from "@/components/forms/CustomerLookup";
import ActionItemQuickAdd from "@/components/forms/ActionItemQuickAdd";

import { getDispatchableRepairOrders } from "@/services/dispatch";
import { createScheduleEvent, getScheduleEvents } from "@/services/scheduling";
import { getActiveTechnicianProfiles } from "@/services/technician-profiles";
import { createId, createTimestamp } from "@/lib/storage";

import type {
  ScheduleEvent,
  ScheduleEventType,
} from "@/types/schedule-event";
import type { RepairOrderActionItem } from "@/types/repair-orders";
import type { TechnicianProfile } from "@/types/technician-profile";

import { getStatusTone } from "../utils/status-tone";

const QBIT_SCOPE = "scheduling";

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
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
  siteName: string;
  technicianId: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  notes: string;
};

const emptyAppointmentForm: AppointmentFormState = {
  title: "",
  type: "Appointment",
  siteName: "",
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

  const [customerValue, setCustomerValue] = useState<CustomerLookupValues>(
    emptyCustomerLookupValues
  );
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(
    null
  );

  const [actionItems, setActionItems] = useState<RepairOrderActionItem[]>([]);
  const [isAddingLine, setIsAddingLine] = useState(false);

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
      setMatchedCustomerId(customerIdParam || null);

      setCustomerValue((currentValue) => ({
        ...currentValue,
        name: customerNameParam,
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
    setCustomerValue(emptyCustomerLookupValues);
    setMatchedCustomerId(null);
    setActionItems([]);
    setIsAddingLine(false);
  }

  function ensureAppointmentCustomerId(): string {
    if (matchedCustomerId) {
      return matchedCustomerId;
    }

    const newCustomer = resolveCustomerLookupRecord(customerValue, null);

    setMatchedCustomerId(newCustomer.id);

    return newCustomer.id;
  }

  function handleStartAddingAppointmentLine() {
    if (!customerValue.name.trim()) {
      alert("Enter a customer before adding a line.");
      return;
    }

    ensureAppointmentCustomerId();
    setIsAddingLine(true);
  }

  function handleAddAppointmentActionItem(actionItem: RepairOrderActionItem) {
    setActionItems((current) => [...current, actionItem]);
    setIsAddingLine(false);
  }

  function handleRemoveAppointmentActionItem(actionItemId: string) {
    setActionItems((current) =>
      current.filter((actionItem) => actionItem.id !== actionItemId)
    );
  }

  function handleCreateAppointment() {
    const customerName = customerValue.name.trim();
    const startDateTime = appointmentForm.startDateTime;

    if (!customerName) {
      alert("Customer name is required.");
      return;
    }

    if (!startDateTime) {
      alert("Start date/time is required.");
      return;
    }

    if (actionItems.length === 0) {
      alert("Add at least one action item (line) before booking the appointment.");
      return;
    }

    const customerId = ensureAppointmentCustomerId();

    const selectedTechnician = technicians.find(
      (technician) => technician.id === appointmentForm.technicianId
    );

    const title =
      appointmentForm.title.trim() || `${appointmentForm.type} - ${customerName}`;

    const firstLine = actionItems[0];

    const newScheduleEvent: ScheduleEvent = {
      id: createId(),

      type: appointmentForm.type,
      status: "Scheduled",

      title,

      customerId,
      customerName,

      siteName: appointmentForm.siteName.trim() || undefined,

      equipmentId: firstLine?.equipmentId,
      equipmentName: firstLine?.equipmentSnapshot?.equipmentName,

      actionItems: actionItems.length > 0 ? actionItems : undefined,

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
    <PageContainer qbitId="scheduling-page" qbitScope={QBIT_SCOPE}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="scheduling-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-5xl font-bold text-black"
          >
            Appointments / Scheduling
          </h1>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="scheduling-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-lg text-black/70"
          >
            Appointments, technician workload, repair-order schedule events,
            and dispatch planning.
          </p>
        </div>

        <button data-t1eq-action-button="true"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-id="scheduling-toggle-create"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          type="button"
          onClick={() => setIsCreateOpen((current) => !current)}
          className="rounded-xl border border-black/20 bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/80"
        >
          {isCreateOpen ? "Close Appointment Form" : "New Appointment"}
        </button>
      </div>

      {isCreateOpen && (
        <Card qbitId="scheduling-create-form" qbitScope={QBIT_SCOPE} className="text-black">
          <div className="space-y-5">
            <div>
              <h2
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="scheduling-create-form-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-3xl font-bold"
              >
                New Appointment
              </h2>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="scheduling-create-form-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-1 text-sm text-black/60"
              >
                Schedule a standalone appointment for a customer.
              </p>
            </div>

            <div>
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="scheduling-customer-heading"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mb-2 text-sm font-bold"
              >
                Customer
              </div>

              <CustomerLookup
                qbitId="scheduling-customer"
                qbitScope={QBIT_SCOPE}
                theme="light"
                value={customerValue}
                onChange={setCustomerValue}
                matchedCustomerId={matchedCustomerId}
                onMatchedCustomerIdChange={setMatchedCustomerId}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-type-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Appointment Type
                </span>

                <select data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-type"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-site-name-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Site / Location
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-site-name"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="text"
                  value={appointmentForm.siteName}
                  onChange={(event) =>
                    updateAppointmentForm("siteName", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-technician-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Technician
                </span>

                <select data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-technician"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-start-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Start Date / Time
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-start"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="datetime-local"
                  value={appointmentForm.startDateTime}
                  onChange={(event) =>
                    updateAppointmentForm("startDateTime", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-end-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  End Date / Time
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-end"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="datetime-local"
                  value={appointmentForm.endDateTime}
                  onChange={(event) =>
                    updateAppointmentForm("endDateTime", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-location-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Location Notes
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-location"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-field-notes-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50"
                >
                  Notes
                </span>

                <textarea data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="scheduling-field-notes"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  value={appointmentForm.notes}
                  onChange={(event) =>
                    updateAppointmentForm("notes", event.target.value)
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="scheduling-lines-heading"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-sm font-bold"
                >
                  Action Items (Lines)
                </div>

                {!isAddingLine && (
                  <button data-t1eq-action-button="true"
                    data-t1eq-qbit-type="action-button"
                    data-t1eq-qbit-id="scheduling-add-line"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="button"
                    onClick={handleStartAddingAppointmentLine}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
                  >
                    + Add Line
                  </button>
                )}
              </div>

              {actionItems.length === 0 && !isAddingLine && (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id="scheduling-lines-empty"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl border border-dashed border-black/10 bg-zinc-50 p-6 text-center text-sm text-black/50"
                >
                  No lines added yet. At least one line is required before
                  this appointment can be booked.
                </div>
              )}

              {actionItems.length > 0 && (
                <div className="space-y-2">
                  {actionItems.map((actionItem) => (
                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="tile"
                      data-t1eq-qbit-id={`scheduling-line-${actionItem.id}`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      key={actionItem.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {actionItem.title}
                        </div>

                        {actionItem.description && (
                          <div className="text-xs text-black/50">
                            {actionItem.description}
                          </div>
                        )}
                      </div>

                      <button data-t1eq-action-button="true"
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-id={`scheduling-line-${actionItem.id}-remove`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        type="button"
                        onClick={() =>
                          handleRemoveAppointmentActionItem(actionItem.id)
                        }
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isAddingLine && (
                <div className="mt-3">
                  <ActionItemQuickAdd
                    qbitId="scheduling-line-form"
                    qbitScope={QBIT_SCOPE}
                    theme="light"
                    customer={{
                      id: matchedCustomerId ?? undefined,
                      name: customerValue.name,
                    }}
                    onAdd={handleAddAppointmentActionItem}
                    onCancel={() => setIsAddingLine(false)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="scheduling-create-submit"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={handleCreateAppointment}
                className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/80"
              >
                Create Appointment
              </button>

              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="scheduling-create-reset"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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
        <MetricCard
          qbitId="scheduling-metric-today"
          qbitScope={QBIT_SCOPE}
          label="Scheduled Today"
          value={scheduledTodayCount}
        />

        <MetricCard
          qbitId="scheduling-metric-events"
          qbitScope={QBIT_SCOPE}
          label="Schedule Events"
          value={scheduleEvents.length}
        />

        <MetricCard
          qbitId="scheduling-metric-technicians"
          qbitScope={QBIT_SCOPE}
          label="Technicians"
          value={technicians.length}
        />

        <MetricCard
          qbitId="scheduling-metric-dispatch-ready"
          qbitScope={QBIT_SCOPE}
          label="Dispatch Ready"
          value={dispatchableRepairOrders.length}
        />
      </div>

      <Card qbitId="scheduling-technician-board" qbitScope={QBIT_SCOPE} className="text-black">
        <div className="space-y-5">
          <div>
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="scheduling-technician-board-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-3xl font-bold"
            >
              Technician Schedule Board
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="scheduling-technician-board-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-1 text-sm text-black/60"
            >
              Schedule events grouped by assigned technician.
            </p>
          </div>

          {technicians.length === 0 && (
            <EmptyState
              qbitId="scheduling-technicians-empty"
              qbitScope={QBIT_SCOPE}
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

              const technicianLineCount = technicianEvents.reduce(
                (total, scheduleEvent) =>
                  total + (scheduleEvent.actionItems?.length ?? 0),
                0
              );

              return (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={technician.id}
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id={`scheduling-technician-${technician.id}`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                      {technicianEvents.length === 1 ? "" : "s"} ·{" "}
                      {technicianLineCount} line
                      {technicianLineCount === 1 ? "" : "s"}
                    </div>
                  </div>

                  {technicianEvents.length === 0 ? (
                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="text"
                      data-t1eq-qbit-id={`scheduling-technician-${technician.id}-empty`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-xl border border-dashed border-black/10 bg-white/60 p-5 text-center text-sm text-black/50">
                      No scheduled events.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {technicianEvents.map((scheduleEvent) => (
                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
                          key={scheduleEvent.id}
                          data-t1eq-qbit-type="tile"
                          data-t1eq-qbit-id={`scheduling-event-${scheduleEvent.id}`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
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
                              qbitId={`scheduling-event-${scheduleEvent.id}-status`}
                              qbitScope={QBIT_SCOPE}
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

                          {scheduleEvent.actionItems &&
                            scheduleEvent.actionItems.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                                  {scheduleEvent.actionItems.length} line
                                  {scheduleEvent.actionItems.length === 1
                                    ? ""
                                    : "s"}
                                </div>

                                {scheduleEvent.actionItems.map(
                                  (actionItem) => (
                                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                                      key={actionItem.id}
                                      data-t1eq-qbit-type="tile"
                                      data-t1eq-qbit-id={`scheduling-event-${scheduleEvent.id}-line-${actionItem.id}`}
                                      data-t1eq-qbit-scope={QBIT_SCOPE}
                                      className="rounded-lg border border-black/10 bg-black/[0.03] p-3"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold">
                                          {actionItem.type}
                                        </div>

                                        {actionItem.total !== undefined && (
                                          <div className="text-xs font-semibold text-black/60">
                                            {formatCurrency(actionItem.total)}
                                          </div>
                                        )}
                                      </div>

                                      {actionItem.equipmentSnapshot
                                        ?.equipmentName && (
                                        <div className="mt-1 text-xs text-black/60">
                                          {
                                            actionItem.equipmentSnapshot
                                              .equipmentName
                                          }
                                          {actionItem.equipmentSnapshot
                                            .serialNumber
                                            ? ` · SN ${actionItem.equipmentSnapshot.serialNumber}`
                                            : ""}
                                        </div>
                                      )}

                                      {actionItem.description && (
                                        <div className="mt-1 text-xs leading-5 text-black/50">
                                          {actionItem.description}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                          {scheduleEvent.actionItems &&
                            scheduleEvent.actionItems.length > 0 && (
                              <>
                                {/*
                                  Special orders sit above the invoicing
                                  gate on purpose: they are billed and
                                  tracked before any work happens, so they
                                  are the first thing to look at on an
                                  appointment that has them.
                                */}
                                <SpecialOrderPartsPanel
                                  scheduleEvent={scheduleEvent}
                                  onChanged={loadScheduleEvents}
                                />

                                <ScheduleEventInvoicePanel
                                  scheduleEvent={scheduleEvent}
                                />
                              </>
                            )}

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

      <Card qbitId="scheduling-unassigned" qbitScope={QBIT_SCOPE} className="text-black">
        <div className="space-y-5">
          <div>
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="scheduling-unassigned-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-3xl font-bold"
            >
              Unassigned Schedule Events
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="scheduling-unassigned-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-1 text-sm text-black/60"
            >
              Events created without technician assignment.
            </p>
          </div>

          {unassignedScheduleEvents.length === 0 && (
            <EmptyState
              qbitId="scheduling-unassigned-empty"
              qbitScope={QBIT_SCOPE}
              title="No unassigned schedule events"
              message="Unassigned schedule events will appear here."
            />
          )}

          <div className="space-y-3">
            {unassignedScheduleEvents.map((scheduleEvent) => (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                key={scheduleEvent.id}
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-id={`scheduling-unassigned-event-${scheduleEvent.id}`}
                data-t1eq-qbit-scope={QBIT_SCOPE}
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
                    qbitId={`scheduling-unassigned-event-${scheduleEvent.id}-status`}
                    qbitScope={QBIT_SCOPE}
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
