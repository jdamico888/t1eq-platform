"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createRepairOrder,
  deleteRepairOrder,
  getRepairOrders,
} from "@/services/repair-orders";

import type {
  RepairOrder,
  RepairOrderPriority,
  RepairOrderStatus,
} from "@/types/repair-order";

type RepairOrderFormState = {
  customerName: string;
  siteName: string;
  equipmentName: string;
  equipmentDescription: string;
  complaint: string;
  priority: RepairOrderPriority;
  status: RepairOrderStatus;
};

const emptyForm: RepairOrderFormState = {
  customerName: "",
  siteName: "",
  equipmentName: "",
  equipmentDescription: "",
  complaint: "",
  priority: "Normal",
  status: "Open",
};

const statusFilters: Array<"All" | RepairOrderStatus> = [
  "All",
  "Draft",
  "Open",
  "Scheduled",
  "Dispatched",
  "In Progress",
  "Waiting Parts",
  "Waiting Approval",
  "Completed",
  "Invoiced",
  "Cancelled",
];

const priorityOptions: RepairOrderPriority[] = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

function formatDate(value?: string) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function RepairOrdersPage() {
  const router = useRouter();

  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | RepairOrderStatus>("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<RepairOrderFormState>(emptyForm);

  const filteredRepairOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return repairOrders.filter((repairOrder) => {
      const matchesStatus =
        statusFilter === "All" || repairOrder.status === statusFilter;

      const searchableValues = [
        repairOrder.repairOrderNumber,
        repairOrder.ro,
        repairOrder.customerName,
        repairOrder.siteName,
        repairOrder.equipmentName,
        repairOrder.equipmentDescription,
        repairOrder.complaint,
        repairOrder.customerConcern,
        repairOrder.assignedTechnicianName,
        repairOrder.assignedEmployeeDisplayName,
        repairOrder.assignedTruckName,
        repairOrder.status,
        repairOrder.priority,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          value?.toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });
  }, [repairOrders, searchTerm, statusFilter]);

  const queueCounts = useMemo(() => {
    return {
      total: repairOrders.length,
      open: repairOrders.filter((repairOrder) => repairOrder.status === "Open")
        .length,
      inProgress: repairOrders.filter(
        (repairOrder) => repairOrder.status === "In Progress"
      ).length,
      waiting: repairOrders.filter(
        (repairOrder) =>
          repairOrder.status === "Waiting Parts" ||
          repairOrder.status === "Waiting on Parts" ||
          repairOrder.status === "Waiting Approval"
      ).length,
      completed: repairOrders.filter(
        (repairOrder) =>
          repairOrder.status === "Completed" ||
          repairOrder.status === "Invoiced" ||
          repairOrder.status === "Closed"
      ).length,
    };
  }, [repairOrders]);

  function loadRepairOrders() {
    setRepairOrders(getRepairOrders());
  }

  useEffect(() => {
    loadRepairOrders();

    function handleRepairOrdersChanged() {
      loadRepairOrders();
    }

    window.addEventListener(
      "t1eq-repair-orders-changed",
      handleRepairOrdersChanged
    );

    return () => {
      window.removeEventListener(
        "t1eq-repair-orders-changed",
        handleRepairOrdersChanged
      );
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const prefillCustomerName = searchParams.get("customerName");
    const shouldOpenCreate = searchParams.get("openCreate") === "1";

    if (prefillCustomerName) {
      setForm((currentForm) => ({
        ...currentForm,
        customerName: prefillCustomerName,
      }));
    }

    if (shouldOpenCreate) {
      setIsCreateOpen(true);
    }
  }, []);

  function updateForm<K extends keyof RepairOrderFormState>(
    key: K,
    value: RepairOrderFormState[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function handleCreateRepairOrder() {
    const customerName = form.customerName.trim();
    const complaint = form.complaint.trim();

    if (!customerName) {
      alert("Customer name is required.");
      return;
    }

    if (!complaint) {
      alert("Complaint / customer concern is required.");
      return;
    }

    const createdRepairOrder = createRepairOrder({
      customerName,
      customerSnapshot: {
        customerName,
        serviceAddress: form.siteName.trim(),
      },

      siteName: form.siteName.trim(),

      equipmentName: form.equipmentName.trim(),
      equipmentDescription: form.equipmentDescription.trim(),

      complaint,
      customerConcern: complaint,

      priority: form.priority,
      status: form.status,

      modelSerialPhotoRequired: true,
      modelSerialPhotoCaptured: false,

      photos: [],
      actionItems: [],
      laborEntries: [],
      partEntries: [],

      subtotalLabor: 0,
      subtotalParts: 0,
      subtotalOther: 0,
      totalAmount: 0,
    });

    resetForm();
    setIsCreateOpen(false);
    loadRepairOrders();

    router.push(`/repair-orders/${createdRepairOrder.id}`);
  }

  function handleDeleteRepairOrder(repairOrder: RepairOrder) {
    const confirmed = window.confirm(
      `Delete repair order ${repairOrder.repairOrderNumber}?`
    );

    if (!confirmed) return;

    deleteRepairOrder(repairOrder.id);
    loadRepairOrders();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">
                Repair Orders
              </p>

              <h1 className="mt-3 text-4xl font-black text-white">
                Repair Order Command Center
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                Create, open, dispatch, clock labor, capture model/serial
                evidence, and move repair work through the full service cycle.
              </p>
            </div>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={() => setIsCreateOpen((current) => !current)}
              className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-5 py-3 text-sm font-black text-blue-100 transition hover:bg-blue-500/30"
            >
              {isCreateOpen ? "Close Create Form" : "Create Repair Order"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <MetricCard label="Total" value={queueCounts.total} />
            <MetricCard label="Open" value={queueCounts.open} />
            <MetricCard label="In Progress" value={queueCounts.inProgress} />
            <MetricCard label="Waiting" value={queueCounts.waiting} />
            <MetricCard label="Completed" value={queueCounts.completed} />
          </div>
        </section>

        {isCreateOpen && (
          <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
                New Repair Order
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                Create Service Ticket
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Customer Name"
                value={form.customerName}
                onChange={(value) => updateForm("customerName", value)}
                required
              />

              <TextField
                label="Site / Location"
                value={form.siteName}
                onChange={(value) => updateForm("siteName", value)}
              />

              <TextField
                label="Equipment Name"
                value={form.equipmentName}
                onChange={(value) => updateForm("equipmentName", value)}
              />

              <TextField
                label="Equipment Description"
                value={form.equipmentDescription}
                onChange={(value) =>
                  updateForm("equipmentDescription", value)
                }
              />

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                  Priority
                </span>

                <select data-t1eq-field="true"
                  value={form.priority}
                  onChange={(event) =>
                    updateForm(
                      "priority",
                      event.target.value as RepairOrderPriority
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-400"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                  Starting Status
                </span>

                <select data-t1eq-field="true"
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value as RepairOrderStatus
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-400"
                >
                  <option value="Draft">Draft</option>
                  <option value="Open">Open</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                  Complaint / Customer Concern
                </span>

                <textarea data-t1eq-field="true"
                  value={form.complaint}
                  onChange={(event) =>
                    updateForm("complaint", event.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none focus:border-blue-400"
                  placeholder="Describe the customer concern or service request."
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleCreateRepairOrder}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/30"
              >
                Create and Open RO
              </button>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                Reset
              </button>
            </div>
          </section>
        )}

        <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_260px]">
            <input data-t1eq-field="true"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-blue-400"
              placeholder="Search repair orders..."
            />

            <select data-t1eq-field="true"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "All" | RepairOrderStatus)
              }
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-400"
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                <tr>
                  <th className="px-4 py-3">RO</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filteredRepairOrders.map((repairOrder) => (
                  <tr key={repairOrder.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 font-black text-blue-100">
                      {repairOrder.repairOrderNumber}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-white">
                        {repairOrder.customerName || "Unnamed Customer"}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {repairOrder.siteName || "No site"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-white">
                        {repairOrder.equipmentName || "No equipment"}
                      </div>
                      <div className="mt-1 max-w-xs truncate text-xs text-white/50">
                        {repairOrder.complaint || "No concern"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
                        {repairOrder.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-white/80">
                      {repairOrder.priority}
                    </td>

                    <td className="px-4 py-4 font-black text-emerald-100">
                      {formatMoney(repairOrder.totalAmount)}
                    </td>

                    <td className="px-4 py-4 text-xs text-white/50">
                      {formatDate(repairOrder.updatedDate)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() =>
                            router.push(`/repair-orders/${repairOrder.id}`)
                          }
                          className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-2 text-xs font-black text-blue-100 transition hover:bg-blue-500/30"
                        >
                          Open
                        </button>

                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => handleDeleteRepairOrder(repairOrder)}
                          className="rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRepairOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm font-bold text-white/50"
                    >
                      No repair orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
        {label}
        {required ? " *" : ""}
      </span>

      <input data-t1eq-field="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-blue-400"
      />
    </label>
  );
}