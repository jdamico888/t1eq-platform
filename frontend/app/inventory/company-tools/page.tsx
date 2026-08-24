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

const QBIT_SCOPE = "company-tools";

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
        <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-header" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 data-t1eq-qbit-id="company-tools-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-5xl font-bold text-black">
                Company Tools
              </h1>

              <p data-t1eq-qbit-id="company-tools-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-lg text-black/70">
                Track company-owned tools, asset numbers, serial numbers,
                storage locations, custody, repair status, and retirement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/inventory"
                data-t1eq-qbit-id="company-tools-inventory-link"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Inventory
              </a>

              <a
                href="/inventory/discrepancies"
                data-t1eq-qbit-id="company-tools-discrepancies-link"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Inventory Discrepancies
              </a>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleCreateCompanyTool}
                data-t1eq-qbit-id="company-tools-add"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={primaryButtonClass}
              >
                Add Company Tool
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-metric-total" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div data-t1eq-qbit-id="company-tools-metric-total-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Total Tools
            </div>

            <div data-t1eq-qbit-id="company-tools-metric-total-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-3xl font-bold">{metrics.total}</div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-metric-available" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div data-t1eq-qbit-id="company-tools-metric-available-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Available
            </div>

            <div data-t1eq-qbit-id="company-tools-metric-available-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-3xl font-bold text-green-700">
              {metrics.available}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-metric-assigned" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div data-t1eq-qbit-id="company-tools-metric-assigned-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Assigned
            </div>

            <div data-t1eq-qbit-id="company-tools-metric-assigned-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-3xl font-bold text-blue-700">
              {metrics.assigned}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-metric-in-repair" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div data-t1eq-qbit-id="company-tools-metric-in-repair-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              In Repair
            </div>

            <div data-t1eq-qbit-id="company-tools-metric-in-repair-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-3xl font-bold text-orange-700">
              {metrics.inRepair}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-metric-value" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div data-t1eq-qbit-id="company-tools-metric-value-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-wide text-black/50">
              Tool Value
            </div>

            <div data-t1eq-qbit-id="company-tools-metric-value-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-3xl font-bold">
              {formatCurrency(metrics.totalValue)}
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-search" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span data-t1eq-qbit-id="company-tools-search-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                Search Tools
              </span>

              <input data-t1eq-field="true"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search asset number, tool name, serial, assigned user, location..."
                data-t1eq-qbit-id="company-tools-search-input"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={inputClass}
              />
            </label>

            <div className="flex items-end">
              <button data-t1eq-action-button="true"
                type="button"
                onClick={refreshData}
                data-t1eq-qbit-id="company-tools-refresh"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-registry" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 data-t1eq-qbit-id="company-tools-registry-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-3xl font-bold">Tool Registry</h2>

          {filteredCompanyTools.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="company-tools-empty-state" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div data-t1eq-qbit-id="company-tools-empty-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xl font-bold">No company tools found</div>

              <p data-t1eq-qbit-id="company-tools-empty-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-black/60">
                Add company tools to begin tracking assets and custody.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredCompanyTools.map((tool) => {
                const isEditing = editingToolId === tool.id;
                const draftTool = draftTools[tool.id] ?? tool;
                const displayTool = isEditing ? draftTool : tool;
                const toolQbitId = `company-tool-${tool.id}`;

                return (
                  <article data-t1eq-tile="true" data-t1eq-page-card="true"
                    key={tool.id}
                    data-t1eq-qbit-id={toolQbitId}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div data-t1eq-qbit-id={`${toolQbitId}-asset-number`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold">
                          {displayTool.assetNumber}
                        </div>

                        <div data-t1eq-qbit-id={`${toolQbitId}-name`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-black/70">
                          {displayTool.toolName}
                        </div>

                        <div data-t1eq-qbit-id={`${toolQbitId}-created`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-black/50">
                          Created: {formatDateTime(displayTool.createdDate)}
                        </div>
                      </div>

                      <div className="space-y-2 md:text-right">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                            displayTool.status
                          )}`}
                          data-t1eq-qbit-id={`${toolQbitId}-status`}
                          data-t1eq-qbit-type="text"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                        >
                          {displayTool.status}
                        </span>

                        <div data-t1eq-qbit-id={`${toolQbitId}-cost`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold">
                          {formatCurrency(displayTool.cost)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-tool-name-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Tool Name
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.toolName}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              toolName: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-tool-name`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-manufacturer-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Manufacturer
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.manufacturer ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              manufacturer: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-manufacturer`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-model-number-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Model Number
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.modelNumber ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              modelNumber: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-model-number`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-serial-number-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Serial Number
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.serialNumber ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              serialNumber: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-serial-number`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-2">
                        <span data-t1eq-qbit-id={`${toolQbitId}-description-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Description
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.description ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              description: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-description`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-cost-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Cost
                        </span>

                        <input data-t1eq-field="true"
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
                          data-t1eq-qbit-id={`${toolQbitId}-cost-field`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-status-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Status
                        </span>

                        <select data-t1eq-field="true"
                          value={displayTool.status}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              status: event.target.value as CompanyToolStatus,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-status-field`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
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
                        <span data-t1eq-qbit-id={`${toolQbitId}-location-type-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Location Type
                        </span>

                        <select data-t1eq-field="true"
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
                          data-t1eq-qbit-id={`${toolQbitId}-location-type`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
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
                        <span data-t1eq-qbit-id={`${toolQbitId}-location-name-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Location Name
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.locationName ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              locationName: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-location-name`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-2">
                        <span data-t1eq-qbit-id={`${toolQbitId}-bin-location-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Bin Location
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.binLocation ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              binLocation: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-bin-location`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1">
                        <span data-t1eq-qbit-id={`${toolQbitId}-assigned-to-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Assigned To
                        </span>

                        <input data-t1eq-field="true"
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
                          data-t1eq-qbit-id={`${toolQbitId}-assigned-to`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>

                      <label className="space-y-1 md:col-span-3">
                        <span data-t1eq-qbit-id={`${toolQbitId}-notes-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-black/70">
                          Notes
                        </span>

                        <input data-t1eq-field="true"
                          value={displayTool.notes ?? ""}
                          disabled={!isEditing}
                          onChange={(event) =>
                            updateDraftCompanyTool(tool.id, {
                              notes: event.target.value,
                            })
                          }
                          data-t1eq-qbit-id={`${toolQbitId}-notes`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {isEditing ? (
                        <>
                          <button data-t1eq-action-button="true"
                            type="button"
                            onClick={() => saveCompanyTool(tool.id)}
                            data-t1eq-qbit-id={`${toolQbitId}-save`}
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className={primaryButtonClass}
                          >
                            Save Tool
                          </button>

                          <button data-t1eq-action-button="true"
                            type="button"
                            onClick={() => cancelEditCompanyTool(tool.id)}
                            data-t1eq-qbit-id={`${toolQbitId}-cancel`}
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className={secondaryButtonClass}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => beginEditCompanyTool(tool)}
                          data-t1eq-qbit-id={`${toolQbitId}-edit`}
                          data-t1eq-qbit-type="action-button"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className={secondaryButtonClass}
                        >
                          Edit Tool
                        </button>
                      )}

                      <button data-t1eq-action-button="true"
                        type="button"
                        onClick={() => handleDeleteCompanyTool(tool.id)}
                        data-t1eq-qbit-id={`${toolQbitId}-delete`}
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
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