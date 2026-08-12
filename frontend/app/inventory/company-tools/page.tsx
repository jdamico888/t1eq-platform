"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CompanyTool,
  CompanyToolLocationType,
  CompanyToolStatus,
} from "../../../types/company-tool";

import {
  createCompanyTool,
  deleteCompanyTool,
  getCompanyTools,
  updateCompanyTool,
} from "../../../services/company-tools";

const statusOptions: CompanyToolStatus[] = [
  "Available",
  "Assigned",
  "In Repair",
  "Lost",
  "Retired",
];

const locationTypeOptions: CompanyToolLocationType[] = ["Warehouse", "Truck"];

const formatCurrency = (value?: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const primaryButtonClass =
  "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.99]";

const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.99]";

const dangerButtonClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.99]";

const getStatusClass = (status: CompanyToolStatus) => {
  if (status === "Available") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Assigned") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "In Repair") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "Lost") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-600";
};

export default function CompanyToolsPage() {
  const [companyTools, setCompanyTools] = useState<CompanyTool[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [draftTools, setDraftTools] = useState<Record<string, CompanyTool>>({});

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setCompanyTools(getCompanyTools());
  }

  const filteredCompanyTools = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return companyTools;
    }

    return companyTools.filter((tool) => {
      return (
        tool.assetNumber.toLowerCase().includes(normalizedSearch) ||
        tool.toolName.toLowerCase().includes(normalizedSearch) ||
        (tool.description ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.manufacturer ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.modelNumber ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.serialNumber ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.assignedToName ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.locationName ?? "").toLowerCase().includes(normalizedSearch) ||
        (tool.binLocation ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [companyTools, searchTerm]);

  const metrics = useMemo(() => {
    const available = companyTools.filter(
      (tool) => tool.status === "Available"
    ).length;

    const assigned = companyTools.filter(
      (tool) => tool.status === "Assigned"
    ).length;

    const inRepair = companyTools.filter(
      (tool) => tool.status === "In Repair"
    ).length;

    const totalValue = companyTools.reduce((total, tool) => {
      return total + (tool.cost ?? 0);
    }, 0);

    return {
      total: companyTools.length,
      available,
      assigned,
      inRepair,
      totalValue,
    };
  }, [companyTools]);

  function handleCreateCompanyTool() {
    const companyTool = createCompanyTool({
      toolName: "New Company Tool",
      description: "",
      status: "Available",
      locationType: "Warehouse",
      locationName: "Warehouse",
      binLocation: "",
      cost: 0,
      toolImageUrls: [],
    });

    setCompanyTools((current) => [companyTool, ...current]);
    beginEditCompanyTool(companyTool);
  }

  function beginEditCompanyTool(companyTool: CompanyTool) {
    setEditingToolId(companyTool.id);

    setDraftTools((current) => ({
      ...current,
      [companyTool.id]: companyTool,
    }));
  }

  function cancelEditCompanyTool(companyToolId: string) {
    setEditingToolId(null);

    setDraftTools((current) => {
      const updated = { ...current };

      delete updated[companyToolId];

      return updated;
    });
  }

  function updateDraftCompanyTool(
    companyToolId: string,
    updates: Partial<CompanyTool>
  ) {
    setDraftTools((current) => {
      const existing = current[companyToolId];

      if (!existing) {
        return current;
      }

      return {
        ...current,
        [companyToolId]: {
          ...existing,
          ...updates,
        },
      };
    });
  }

  function saveCompanyTool(companyToolId: string) {
    const draftTool = draftTools[companyToolId];

    if (!draftTool) {
      return;
    }

    updateCompanyTool(companyToolId, draftTool);
    refreshData();
    cancelEditCompanyTool(companyToolId);
  }

  function handleDeleteCompanyTool(companyToolId: string) {
    deleteCompanyTool(companyToolId);
    refreshData();
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-5xl font-bold text-black">
                Company Tools
              </h1>

              <p className="mt-2 text-lg text-black/70">
                Track company-owned tools, asset numbers, serial numbers,
                storage locations, custody, repair status, and retirement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/inventory" className={secondaryButtonClass}>
                Inventory
              </a>

              <a
                href="/inventory/discrepancies"
                className={secondaryButtonClass}
              >
                Inventory Discrepancies
              </a>

              <button
                type="button"
                onClick={handleCreateCompanyTool}
                className={primaryButtonClass}
              >
                Add Company Tool
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Total Tools
            </div>

            <div className="mt-2 text-3xl font-bold">{metrics.total}</div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Available
            </div>

            <div className="mt-2 text-3xl font-bold text-green-700">
              {metrics.available}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Assigned
            </div>

            <div className="mt-2 text-3xl font-bold text-blue-700">
              {metrics.assigned}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              In Repair
            </div>

            <div className="mt-2 text-3xl font-bold text-orange-700">
              {metrics.inRepair}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Tool Value
            </div>

            <div className="mt-2 text-3xl font-bold">
              {formatCurrency(metrics.totalValue)}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-semibold text-black/70">
                Search Tools
              </span>

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search asset number, tool name, serial, assigned user, location..."
                className={inputClass}
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={refreshData}
                className={secondaryButtonClass}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold">Tool Registry</h2>

          {filteredCompanyTools.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div className="text-xl font-bold">No company tools found</div>

              <p className="mt-2 text-black/60">
                Add company tools to begin tracking assets and custody.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredCompanyTools.map((tool) => {
                const isEditing = editingToolId === tool.id;
                const draftTool = draftTools[tool.id] ?? tool;
                const displayTool = isEditing ? draftTool : tool;

                return (
                  <article
                    key={tool.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="text-2xl font-bold">
                          {displayTool.assetNumber}
                        </div>

                        <div className="text-black/70">
                          {displayTool.toolName}
                        </div>

                        <div className="mt-1 text-sm text-black/50">
                          Created: {formatDateTime(displayTool.createdDate)}
                        </div>
                      </div>

                      <div className="space-y-2 md:text-right">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                            displayTool.status
                          )}`}
                        >
                          {displayTool.status}
                        </span>

                        <div className="text-2xl font-bold">
                          {formatCurrency(displayTool.cost)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Tool Name
                        </span>

                        <input
                          value={displayTool.toolName}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              toolName: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Manufacturer
                        </span>

                        <input
                          value={displayTool.manufacturer ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              manufacturer: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Model Number
                        </span>

                        <input
                          value={displayTool.modelNumber ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              modelNumber: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Serial Number
                        </span>

                        <input
                          value={displayTool.serialNumber ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              serialNumber: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-2">
                        <span className="text-sm font-semibold text-black/70">
                          Description
                        </span>

                        <input
                          value={displayTool.description ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              description: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Cost
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={displayTool.cost ?? 0}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              cost: Number(event.target.value) || 0,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Status
                        </span>

                        <select
                          value={displayTool.status}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              status: event.target.value as CompanyToolStatus,
                            })
                          }
                          className={inputClass}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Location Type
                        </span>

                        <select
                          value={displayTool.locationType}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              locationType: event.target
                                .value as CompanyToolLocationType,
                              locationName:
                                event.target.value === "Truck"
                                  ? "Truck"
                                  : "Warehouse",
                            })
                          }
                          className={inputClass}
                        >
                          {locationTypeOptions.map((locationType) => (
                            <option key={locationType} value={locationType}>
                              {locationType}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Location Name
                        </span>

                        <input
                          value={displayTool.locationName ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              locationName: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-2">
                        <span className="text-sm font-semibold text-black/70">
                          Bin Location
                        </span>

                        <input
                          value={displayTool.binLocation ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              binLocation: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-sm font-semibold text-black/70">
                          Assigned To
                        </span>

                        <input
                          value={displayTool.assignedToName ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              assignedToName: event.target.value,
                              assignedDate: event.target.value
                                ? new Date().toISOString()
                                : undefined,
                              status: event.target.value
                                ? "Assigned"
                                : displayTool.status,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-3">
                        <span className="text-sm font-semibold text-black/70">
                          Notes
                        </span>

                        <input
                          value={displayTool.notes ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              notes: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveCompanyTool(tool.id)}
                            className={primaryButtonClass}
                          >
                            Save Tool
                          </button>

                          <button
                            type="button"
                            onClick={() => cancelEditCompanyTool(tool.id)}
                            className={secondaryButtonClass}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginEditCompanyTool(tool)}
                          className={secondaryButtonClass}
                        >
                          Edit Tool
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteCompanyTool(tool.id)}
                        className={dangerButtonClass}
                      >
                        Delete Tool
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}