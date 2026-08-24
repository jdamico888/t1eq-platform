"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryDiscrepancy } from "@/types/inventory-discrepancy";
import {
  getInventoryDiscrepancies,
  updateInventoryDiscrepancy,
} from "@/services/inventory-discrepancies";

const QBIT_SCOPE = "inventory-transactions";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const metricGridClass = "mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4";
const metricCardClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";
const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const primaryButtonClass =
  "rounded-xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";
const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";
const tableHeaderClass =
  "border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500";
const tableCellClass =
  "border-b border-zinc-100 px-4 py-3 text-sm text-zinc-700";
const badgeClass =
  "inline-flex rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-700";
const openBadgeClass =
  "inline-flex rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-black text-red-700";
const reviewBadgeClass =
  "inline-flex rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700";
const resolvedBadgeClass =
  "inline-flex rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-black text-green-700";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString();
}

function discrepancyIsOpen(discrepancy: InventoryDiscrepancy) {
  return (
    discrepancy.status === "Open" || discrepancy.status === "Under Review"
  );
}

function getStatusClass(status: InventoryDiscrepancy["status"]) {
  if (status === "Open") {
    return openBadgeClass;
  }

  if (status === "Under Review") {
    return reviewBadgeClass;
  }

  if (status === "Resolved") {
    return resolvedBadgeClass;
  }

  return badgeClass;
}

function discrepancyMatchesSearch(
  discrepancy: InventoryDiscrepancy,
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    discrepancy.partNumber,
    discrepancy.description,
    discrepancy.purchaseOrderNumber,
    discrepancy.locationName,
    discrepancy.binLocation,
    discrepancy.source,
    discrepancy.status,
    discrepancy.notes,
    discrepancy.resolutionNotes,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedSearch)
  );
}

export default function InventoryTransactionsPage() {
  const [inventoryDiscrepancies, setInventoryDiscrepancies] = useState<
    InventoryDiscrepancy[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function refreshDiscrepancies() {
    setInventoryDiscrepancies(getInventoryDiscrepancies());
  }

  useEffect(() => {
    refreshDiscrepancies();
  }, []);

  const openDiscrepancies = useMemo(
    () => inventoryDiscrepancies.filter(discrepancyIsOpen),
    [inventoryDiscrepancies]
  );

  const resolvedDiscrepancies = useMemo(
    () =>
      inventoryDiscrepancies.filter(
        (discrepancy) => discrepancy.status === "Resolved"
      ),
    [inventoryDiscrepancies]
  );

  const dismissedDiscrepancies = useMemo(
    () =>
      inventoryDiscrepancies.filter(
        (discrepancy) => discrepancy.status === "Dismissed"
      ),
    [inventoryDiscrepancies]
  );

  const filteredDiscrepancies = useMemo(
    () =>
      inventoryDiscrepancies.filter((discrepancy) =>
        discrepancyMatchesSearch(discrepancy, searchTerm)
      ),
    [inventoryDiscrepancies, searchTerm]
  );

  function handleMarkUnderReview(discrepancy: InventoryDiscrepancy) {
    updateInventoryDiscrepancy(discrepancy.id, {
      status: "Under Review",
      updatedDate: new Date().toISOString(),
    });

    refreshDiscrepancies();
    setStatusMessage("Inventory discrepancy moved under review.");
  }

  function handleResolveDiscrepancy(discrepancy: InventoryDiscrepancy) {
    updateInventoryDiscrepancy(discrepancy.id, {
      status: "Resolved",
      resolvedDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      resolutionNotes:
        discrepancy.resolutionNotes ||
        "Resolved from Inventory Transactions.",
    });

    refreshDiscrepancies();
    setStatusMessage("Inventory discrepancy resolved.");
  }

  function handleDismissDiscrepancy(discrepancy: InventoryDiscrepancy) {
    updateInventoryDiscrepancy(discrepancy.id, {
      status: "Dismissed",
      updatedDate: new Date().toISOString(),
      resolutionNotes:
        discrepancy.resolutionNotes ||
        "Dismissed from Inventory Transactions.",
    });

    refreshDiscrepancies();
    setStatusMessage("Inventory discrepancy dismissed.");
  }

  return (
    <div className={pageClass}>
      <header data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="inventory-transactions-header"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={headerClass}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-overline"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Inventory
            </p>

            <h1
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              Inventory Transactions
            </h1>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-3xl text-base font-semibold text-zinc-600"
            >
              Review inventory movements, correction history, receiving issues,
              and inventory discrepancies from one transaction-control page.
            </p>
          </div>

          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="inventory-transactions-refresh"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={refreshDiscrepancies}
            className={secondaryButtonClass}
          >
            Refresh
          </button>
        </div>

        {statusMessage && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-transactions-status-message"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700">
            {statusMessage}
          </div>
        )}
      </header>

      <section data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="inventory-transactions-body"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={sectionClass}>
        <div
          data-t1eq-tile-grid="true"
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="inventory-transactions-metrics"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={metricGridClass}
        >
          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-transactions-metric-total"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className={metricCardClass}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-total-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Total Discrepancies
            </div>
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-total-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              {inventoryDiscrepancies.length}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-transactions-metric-open"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className={metricCardClass}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-open-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Open / Review
            </div>
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-open-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              {openDiscrepancies.length}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-transactions-metric-resolved"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className={metricCardClass}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-resolved-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Resolved
            </div>
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-resolved-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              {resolvedDiscrepancies.length}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-transactions-metric-dismissed"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className={metricCardClass}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-dismissed-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Dismissed
            </div>
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-metric-dismissed-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              {dismissedDiscrepancies.length}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="space-y-2">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-transactions-search-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Search Transactions / Discrepancies
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="inventory-transactions-search"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={inputClass}
              placeholder="Search part number, PO number, source, location, bin, status, or notes."
            />
          </label>
        </div>

        {filteredDiscrepancies.length === 0 ? (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-transactions-empty"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">
            No inventory discrepancies found.
          </div>
        ) : (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="inventory-transactions-table"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Part Number</th>
                  <th className={tableHeaderClass}>Source</th>
                  <th className={tableHeaderClass}>Expected</th>
                  <th className={tableHeaderClass}>Live Count</th>
                  <th className={tableHeaderClass}>Difference</th>
                  <th className={tableHeaderClass}>Location</th>
                  <th className={tableHeaderClass}>PO</th>
                  <th className={tableHeaderClass}>Status</th>
                  <th className={tableHeaderClass}>Created</th>
                  <th className={tableHeaderClass}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDiscrepancies.map((discrepancy) => (
                  <tr
                    key={discrepancy.id}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="transition hover:bg-zinc-50"
                  >
                    <td className={tableCellClass}>
                      <div className="font-black text-black">
                        {discrepancy.partNumber}
                      </div>

                      {discrepancy.description && (
                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          {discrepancy.description}
                        </div>
                      )}
                    </td>

                    <td className={tableCellClass}>{discrepancy.source}</td>

                    <td className={tableCellClass}>
                      {discrepancy.expectedQuantityOnHand}
                    </td>

                    <td className={tableCellClass}>
                      {discrepancy.liveInventoryCount}
                    </td>

                    <td className={tableCellClass}>
                      {discrepancy.discrepancyQuantity}
                    </td>

                    <td className={tableCellClass}>
                      <div>{discrepancy.locationName || "—"}</div>

                      {discrepancy.binLocation && (
                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          Bin: {discrepancy.binLocation}
                        </div>
                      )}
                    </td>

                    <td className={tableCellClass}>
                      {discrepancy.purchaseOrderNumber || "—"}
                    </td>

                    <td className={tableCellClass}>
                      <span className={getStatusClass(discrepancy.status)}>
                        {discrepancy.status}
                      </span>
                    </td>

                    <td className={tableCellClass}>
                      {formatDate(discrepancy.createdDate)}
                    </td>

                    <td className={tableCellClass}>
                      <div className="flex flex-wrap gap-2">
                        {discrepancy.status === "Open" && (
                          <button data-t1eq-action-button="true"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-review`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            type="button"
                            onClick={() =>
                              handleMarkUnderReview(discrepancy)
                            }
                            className={secondaryButtonClass}
                          >
                            Review
                          </button>
                        )}

                        {discrepancy.status !== "Resolved" && (
                          <button data-t1eq-action-button="true"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-resolve`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            type="button"
                            onClick={() =>
                              handleResolveDiscrepancy(discrepancy)
                            }
                            className={primaryButtonClass}
                          >
                            Resolve
                          </button>
                        )}

                        {discrepancy.status !== "Dismissed" && (
                          <button data-t1eq-action-button="true"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`inventory-discrepancy-${discrepancy.id}-dismiss`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            type="button"
                            onClick={() =>
                              handleDismissDiscrepancy(discrepancy)
                            }
                            className={secondaryButtonClass}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}