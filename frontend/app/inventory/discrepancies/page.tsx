"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  InventoryDiscrepancy,
  InventoryDiscrepancyStatus,
} from "../../../types/inventory-discrepancy";

import {
  getInventoryDiscrepancies,
  resolveInventoryDiscrepancy,
  updateInventoryDiscrepancy,
} from "../../../services/inventory-discrepancies";

const QBIT_SCOPE = "inventory-discrepancies";

const statusOptions: InventoryDiscrepancyStatus[] = [
  "Open",
  "Under Review",
  "Resolved",
  "Dismissed",
];

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getStatusClass = (status: InventoryDiscrepancyStatus) => {
  if (status === "Resolved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Dismissed") {
    return "border-zinc-300 bg-zinc-100 text-zinc-600";
  }

  if (status === "Under Review") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const buttonClass =
  "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.99]";

const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.99]";

export default function InventoryDiscrepanciesPage() {
  const [discrepancies, setDiscrepancies] = useState<InventoryDiscrepancy[]>(
    []
  );

  const [statusFilter, setStatusFilter] = useState<
    InventoryDiscrepancyStatus | "All"
  >("Open");

  const [searchTerm, setSearchTerm] = useState("");

  const [resolutionNotesById, setResolutionNotesById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setDiscrepancies(getInventoryDiscrepancies());
  }

  const filteredDiscrepancies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return discrepancies.filter((discrepancy) => {
      const matchesStatus =
        statusFilter === "All" || discrepancy.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        discrepancy.partNumber.toLowerCase().includes(normalizedSearch) ||
        (discrepancy.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (discrepancy.purchaseOrderNumber ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (discrepancy.locationName ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (discrepancy.binLocation ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [discrepancies, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const open = discrepancies.filter(
      (discrepancy) => discrepancy.status === "Open"
    ).length;

    const underReview = discrepancies.filter(
      (discrepancy) => discrepancy.status === "Under Review"
    ).length;

    const resolved = discrepancies.filter(
      (discrepancy) => discrepancy.status === "Resolved"
    ).length;

    const netDiscrepancyQuantity = discrepancies
      .filter(
        (discrepancy) =>
          discrepancy.status === "Open" ||
          discrepancy.status === "Under Review"
      )
      .reduce((total, discrepancy) => {
        return total + discrepancy.discrepancyQuantity;
      }, 0);

    return {
      total: discrepancies.length,
      open,
      underReview,
      resolved,
      netDiscrepancyQuantity,
    };
  }, [discrepancies]);

  function handleStatusChange(
    discrepancyId: string,
    status: InventoryDiscrepancyStatus
  ) {
    updateInventoryDiscrepancy(discrepancyId, {
      status,
    });

    refreshData();
  }

  function handleResolutionNoteChange(discrepancyId: string, value: string) {
    setResolutionNotesById((current) => ({
      ...current,
      [discrepancyId]: value,
    }));
  }

  function handleResolve(discrepancy: InventoryDiscrepancy) {
    resolveInventoryDiscrepancy(discrepancy.id, {
      resolvedBy: "Manager",
      resolutionNotes:
        resolutionNotesById[discrepancy.id] ||
        "Resolved from Inventory Discrepancies review.",
      status: "Resolved",
    });

    refreshData();
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-discrepancies-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-5xl font-bold text-black"
              >
                Inventory Discrepancies
              </h1>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-lg text-black/70"
              >
                Review mismatches between expected quantity on hand and verified
                live inventory count.
              </p>
            </div>

            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="inventory-discrepancies-refresh"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={refreshData}
              className={secondaryButtonClass}
            >
              Refresh
            </button>
          </div>
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="inventory-discrepancies-metrics"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="grid grid-cols-2 gap-4 md:grid-cols-5"
        >
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-discrepancies-metric-total"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-total-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Total
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-total-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.total}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-discrepancies-metric-open"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-open-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-orange-700"
            >
              Open
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-open-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-orange-700"
            >
              {metrics.open}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-discrepancies-metric-under-review"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-under-review-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-blue-700"
            >
              Under Review
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-under-review-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-blue-700"
            >
              {metrics.underReview}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-discrepancies-metric-resolved"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-resolved-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-green-700"
            >
              Resolved
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-resolved-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-green-700"
            >
              {metrics.resolved}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-discrepancies-metric-net-delta"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-net-delta-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Net Qty Delta
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-discrepancies-metric-net-delta-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.netDiscrepancyQuantity}
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-discrepancies-filters"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-search-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Search
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-discrepancies-search"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Part, PO, location, bin..."
                className={inputClass}
              />
            </label>

            <label className="space-y-1">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-status-filter-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Status
              </span>

              <select data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-discrepancies-status-filter"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as InventoryDiscrepancyStatus | "All"
                  )
                }
                className={inputClass}
              >
                <option value="All">All</option>

                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-discrepancies-list"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-discrepancies-list-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-3xl font-bold"
          >
            Discrepancy List
          </h2>

          {filteredDiscrepancies.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="inventory-discrepancies-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-empty-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xl font-bold"
              >
                No inventory discrepancies found
              </div>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-discrepancies-empty-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-black/60"
              >
                Discrepancies will appear here when receiving or inventory count
                verification finds a mismatch.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredDiscrepancies.map((discrepancy) => (
                <article data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={discrepancy.id}
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="text-2xl font-bold">
                        {discrepancy.partNumber}
                      </div>

                      <div className="text-black/70">
                        {discrepancy.description || "No description"}
                      </div>

                      <div className="mt-2 text-sm text-black/50">
                        Source: {discrepancy.source}
                      </div>

                      {discrepancy.purchaseOrderNumber && (
                        <div className="text-sm text-black/50">
                          PO: {discrepancy.purchaseOrderNumber}
                        </div>
                      )}

                      <div className="text-sm text-black/50">
                        Created: {formatDateTime(discrepancy.createdDate)}
                      </div>
                    </div>

                    <div className="space-y-2 md:text-right">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                          discrepancy.status
                        )}`}
                      >
                        {discrepancy.status}
                      </span>

                      <div className="text-3xl font-bold">
                        {discrepancy.discrepancyQuantity > 0 ? "+" : ""}
                        {discrepancy.discrepancyQuantity}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="page-card"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-expected`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-sm font-semibold text-black/50">
                        Expected On Hand
                      </div>

                      <div className="mt-1 text-2xl font-bold">
                        {discrepancy.expectedQuantityOnHand}
                      </div>
                    </div>

                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="page-card"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-live-count`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-sm font-semibold text-black/50">
                        Live Count
                      </div>

                      <div className="mt-1 text-2xl font-bold">
                        {discrepancy.liveInventoryCount}
                      </div>
                    </div>

                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="page-card"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-difference`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-sm font-semibold text-black/50">
                        Difference
                      </div>

                      <div className="mt-1 text-2xl font-bold">
                        {discrepancy.discrepancyQuantity > 0 ? "+" : ""}
                        {discrepancy.discrepancyQuantity}
                      </div>
                    </div>

                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="page-card"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-location`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-sm font-semibold text-black/50">
                        Location
                      </div>

                      <div className="mt-1 font-bold">
                        {discrepancy.locationName || "Not set"}
                      </div>

                      <div className="text-sm text-black/60">
                        {discrepancy.binLocation || "No bin location"}
                      </div>
                    </div>
                  </div>

                  {discrepancy.notes && (
                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="text"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-notes`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-black/70">
                      {discrepancy.notes}
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-sm font-semibold text-black/70">
                        Status
                      </span>

                      <select data-t1eq-field="true"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-status`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        value={discrepancy.status}
                        onChange={(event) =>
                          handleStatusChange(
                            discrepancy.id,
                            event.target.value as InventoryDiscrepancyStatus
                          )
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

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold text-black/70">
                        Resolution Notes
                      </span>

                      <input data-t1eq-field="true"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-resolution-notes`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        value={resolutionNotesById[discrepancy.id] ?? ""}
                        onChange={(event) =>
                          handleResolutionNoteChange(
                            discrepancy.id,
                            event.target.value
                          )
                        }
                        placeholder="Example: Recount confirmed, adjustment entered, transfer corrected..."
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button data-t1eq-action-button="true"
                      data-t1eq-qbit-type="action-button"
                      data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-resolve`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      type="button"
                      onClick={() => handleResolve(discrepancy)}
                      className={buttonClass}
                    >
                      Resolve
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}