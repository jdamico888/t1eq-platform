"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryItem } from "../../../types/inventory-item";
import type {
  PurchaseOrder,
  PurchaseOrderLine,
} from "../../../types/purchase-order";

import { getInventoryItems } from "../../../services/inventory";
import { getPurchaseOrders } from "../../../services/purchase-orders";
import { getCompanyTools } from "../../../services/company-tools";
import { getOpenInventoryDiscrepancies } from "../../../services/inventory-discrepancies";

import AddItemButton from "@/components/inventory/AddItemButton";

type ReceivingLineRecord = {
  purchaseOrder: PurchaseOrder;
  line: PurchaseOrderLine;
  inventoryItem?: InventoryItem;
};

const QBIT_SCOPE = "inventory-receiving";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const primaryButtonClass =
  "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.99]";

const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.99]";

const warningButtonClass =
  "rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 active:scale-[0.99]";

const formatCurrency = (value?: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

function getPurchaseOrderNumber(purchaseOrder: PurchaseOrder) {
  return (
    purchaseOrder.purchaseOrderNumber ??
    purchaseOrder.poNumber ??
    purchaseOrder.id
  );
}

function getSupplierName(purchaseOrder: PurchaseOrder) {
  return (
    purchaseOrder.supplierName ??
    purchaseOrder.supplier ??
    "Unassigned Supplier"
  );
}

function isReceivingLine(line: PurchaseOrderLine) {
  return (
    line.lineClass === "Inventory Stock" ||
    line.lineClass === "Company Tools"
  );
}

export default function InventoryReceivingPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [receiptPhotoByLineId, setReceiptPhotoByLineId] = useState<
    Record<string, string>
  >({});

  const [notesByLineId, setNotesByLineId] = useState<Record<string, string>>(
    {}
  );

  const [reviewedLineIds, setReviewedLineIds] = useState<Record<string, true>>(
    {}
  );

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setPurchaseOrders(getPurchaseOrders());
    setInventoryItems(getInventoryItems());
  }

  function findInventoryItemByPartNumber(partNumber: string) {
    const normalizedPartNumber = partNumber.trim().toLowerCase();

    if (!normalizedPartNumber) {
      return undefined;
    }

    return inventoryItems.find((item) => {
      return item.partNumber.trim().toLowerCase() === normalizedPartNumber;
    });
  }

  const receivingLines = useMemo<ReceivingLineRecord[]>(() => {
    return purchaseOrders
      .filter((purchaseOrder) => purchaseOrder.status === "Received")
      .flatMap((purchaseOrder) => {
        return (purchaseOrder.lines ?? [])
          .filter(isReceivingLine)
          .map((line) => ({
            purchaseOrder,
            line,
            inventoryItem:
              line.lineClass === "Inventory Stock"
                ? findInventoryItemByPartNumber(line.partNumber)
                : undefined,
          }));
      });
  }, [inventoryItems, purchaseOrders]);

  const filteredReceivingLines = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return receivingLines;
    }

    return receivingLines.filter(({ purchaseOrder, line }) => {
      return (
        getPurchaseOrderNumber(purchaseOrder)
          .toLowerCase()
          .includes(normalizedSearch) ||
        getSupplierName(purchaseOrder).toLowerCase().includes(normalizedSearch) ||
        line.lineClass.toLowerCase().includes(normalizedSearch) ||
        line.partNumber.toLowerCase().includes(normalizedSearch) ||
        line.description.toLowerCase().includes(normalizedSearch) ||
        (line.receiveLocationName ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (line.binLocation ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [receivingLines, searchTerm]);

  const metrics = useMemo(() => {
    const companyTools = getCompanyTools();
    const openDiscrepancies = getOpenInventoryDiscrepancies();

    const inventoryStockLines = receivingLines.filter(({ line }) => {
      return line.lineClass === "Inventory Stock";
    });

    const companyToolLines = receivingLines.filter(({ line }) => {
      return line.lineClass === "Company Tools";
    });

    const unmatchedInventoryLines = inventoryStockLines.filter(
      ({ inventoryItem }) => {
        return !inventoryItem;
      }
    );

    return {
      receivingLines: receivingLines.length,
      inventoryStockLines: inventoryStockLines.length,
      companyToolLines: companyToolLines.length,
      unmatchedInventoryLines: unmatchedInventoryLines.length,
      companyTools: companyTools.length,
      openDiscrepancies: openDiscrepancies.length,
      reviewedLines: Object.keys(reviewedLineIds).length,
    };
  }, [receivingLines, reviewedLineIds]);

  function updateReceiptPhoto(lineId: string, value: string) {
    setReceiptPhotoByLineId((current) => ({
      ...current,
      [lineId]: value,
    }));
  }

  function updateNotes(lineId: string, value: string) {
    setNotesByLineId((current) => ({
      ...current,
      [lineId]: value,
    }));
  }

  function markLineReviewed(lineId: string) {
    setReviewedLineIds((current) => ({
      ...current,
      [lineId]: true,
    }));
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-receiving-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-receiving-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-5xl font-bold text-black"
              >
                Inventory Receiving
              </h1>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-receiving-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-lg text-black/70"
              >
                Review received purchase order lines before final inventory
                stock mutation, asset record cleanup, receipt photos, and
                discrepancy resolution.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AddItemButton
                qbitId="inventory-receiving-add-item"
                variant="light"
                label="+ Add Item"
              />

              <a href="/inventory"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-receiving-link-inventory"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Inventory
              </a>

              <a href="/inventory/discrepancies"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-receiving-link-discrepancies"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={warningButtonClass}
              >
                Inventory Discrepancies
              </a>

              <a href="/inventory/company-tools"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-receiving-link-company-tools"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Company Tools
              </a>

              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-receiving-refresh"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={refreshData}
                className={primaryButtonClass}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="inventory-receiving-metrics"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-lines"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-lines-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Receiving Lines
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-lines-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.receivingLines}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-stock"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-stock-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Inventory Stock
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-stock-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.inventoryStockLines}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-tools"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-tools-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Company Tools
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-tools-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.companyToolLines}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-open-discrepancies"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-open-discrepancies-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-orange-700"
            >
              Open Discrepancies
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-open-discrepancies-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-orange-700"
            >
              {metrics.openDiscrepancies}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-unmatched"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-unmatched-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-orange-700"
            >
              Unmatched Stock
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-unmatched-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-orange-700"
            >
              {metrics.unmatchedInventoryLines}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-reviewed"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-reviewed-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-green-700"
            >
              Reviewed
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-reviewed-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-green-700"
            >
              {metrics.reviewedLines}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-tool-assets"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-tool-assets-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Tool Assets
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-tool-assets-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              {metrics.companyTools}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="inventory-receiving-metric-status"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-status-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold uppercase tracking-wide text-black/50"
            >
              Receiving Status
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-receiving-metric-status-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold"
            >
              Live
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-receiving-search-section"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-receiving-search-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Search Receiving
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-receiving-search"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search PO, supplier, part, description, location..."
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-receiving-list"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-receiving-list-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-3xl font-bold"
          >
            Received PO Lines
          </h2>

          {filteredReceivingLines.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="inventory-receiving-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-receiving-empty-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xl font-bold"
              >
                No received PO lines found
              </div>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-receiving-empty-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-black/60"
              >
                Receive purchase orders first. Inventory Stock and Company Tools
                lines will appear here for final receiving review.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredReceivingLines.map(
                ({ purchaseOrder, line, inventoryItem }) => {
                  const lineReviewed = reviewedLineIds[line.id];
                  const receiptPhoto = receiptPhotoByLineId[line.id] ?? "";
                  const receivingNotes = notesByLineId[line.id] ?? "";

                  const receivingLineQbitId = `inventory-receiving-line-${purchaseOrder.id}-${line.id}`;

                  return (
                    <article data-t1eq-tile="true" data-t1eq-page-card="true"
                      key={`${purchaseOrder.id}-${line.id}`}
                      data-t1eq-qbit-type="tile"
                      data-t1eq-qbit-id={receivingLineQbitId}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                          <div className="text-2xl font-bold">
                            {line.partNumber || "No part number"}
                          </div>

                          <div className="text-black/70">
                            {line.description || "No description"}
                          </div>

                          <div className="mt-2 text-sm font-semibold text-black/50">
                            {line.lineClass}
                          </div>

                          <div className="mt-2 text-sm text-black/50">
                            PO: {getPurchaseOrderNumber(purchaseOrder)}
                          </div>

                          <div className="text-sm text-black/50">
                            Supplier: {getSupplierName(purchaseOrder)}
                          </div>

                          <div className="text-sm text-black/50">
                            Received: {formatDate(purchaseOrder.receivedDate)}
                          </div>
                        </div>

                        <div className="space-y-2 md:text-right">
                          <div className="text-3xl font-bold">
                            {line.quantity}
                          </div>

                          <div className="text-sm text-black/60">
                            {formatCurrency(line.cost)} each
                          </div>

                          <div className="text-sm font-semibold text-black">
                            {formatCurrency(line.total)}
                          </div>

                          {lineReviewed && (
                            <div data-t1eq-tile="true" data-t1eq-page-card="true"
                              data-t1eq-qbit-type="text"
                              data-t1eq-qbit-id={`${receivingLineQbitId}-reviewed-badge`}
                              data-t1eq-qbit-scope={QBIT_SCOPE}
                              className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                              Reviewed
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
                          data-t1eq-qbit-type="page-card"
                          data-t1eq-qbit-id={`${receivingLineQbitId}-location`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className="rounded-xl border border-zinc-200 bg-white p-3">
                          <div className="text-sm font-semibold text-black/50">
                            Receiving Location
                          </div>

                          <div className="mt-1 font-bold">
                            {line.receiveLocationName ?? "Warehouse"}
                          </div>

                          <div className="text-sm text-black/60">
                            {line.binLocation || "No structured bin location"}
                          </div>
                        </div>

                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
                          data-t1eq-qbit-type="page-card"
                          data-t1eq-qbit-id={`${receivingLineQbitId}-match`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className="rounded-xl border border-zinc-200 bg-white p-3">
                          <div className="text-sm font-semibold text-black/50">
                            Inventory Match
                          </div>

                          {line.lineClass === "Inventory Stock" ? (
                            <>
                              <div className="mt-1 font-bold">
                                {inventoryItem
                                  ? inventoryItem.partNumber
                                  : "New / unmatched"}
                              </div>

                              <div className="text-sm text-black/60">
                                {inventoryItem
                                  ? `Current on hand: ${inventoryItem.quantityOnHand}`
                                  : "Create or match stock record in Inventory."}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="mt-1 font-bold">
                                Company Tool Asset
                              </div>

                              <div className="text-sm text-black/60">
                                Confirm serial, receipt, photos, and custody in
                                Company Tools.
                              </div>
                            </>
                          )}
                        </div>

                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
                          data-t1eq-qbit-type="page-card"
                          data-t1eq-qbit-id={`${receivingLineQbitId}-action`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className="rounded-xl border border-zinc-200 bg-white p-3">
                          <div className="text-sm font-semibold text-black/50">
                            Receiving Action
                          </div>

                          <div className="mt-1 font-bold">
                            {line.lineClass === "Inventory Stock"
                              ? "Stock review required"
                              : "Asset review required"}
                          </div>

                          <div className="text-sm text-black/60">
                            {line.lineClass === "Inventory Stock"
                              ? "Finalize quantity and resolve discrepancies before adjustment."
                              : "Complete tool metadata and custody assignment."}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <label className="space-y-1">
                          <span
                            data-t1eq-qbit-type="text"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-photo-label`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className="text-sm font-semibold text-black/70"
                          >
                            Receipt Photo Reference
                          </span>

                          <input data-t1eq-field="true"
                            data-t1eq-qbit-type="field"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-photo`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            value={receiptPhoto}
                            onChange={(event) =>
                              updateReceiptPhoto(line.id, event.target.value)
                            }
                            placeholder="Receipt photo URL or local reference"
                            className={inputClass}
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span
                            data-t1eq-qbit-type="text"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-notes-label`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className="text-sm font-semibold text-black/70"
                          >
                            Receiving Notes
                          </span>

                          <input data-t1eq-field="true"
                            data-t1eq-qbit-type="field"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-notes`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            value={receivingNotes}
                            onChange={(event) =>
                              updateNotes(line.id, event.target.value)
                            }
                            placeholder="Photos needed, serial missing, count confirmed, stock matched..."
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button data-t1eq-action-button="true"
                          data-t1eq-qbit-type="action-button"
                          data-t1eq-qbit-id={`${receivingLineQbitId}-mark-reviewed`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          type="button"
                          onClick={() => markLineReviewed(line.id)}
                          className={primaryButtonClass}
                        >
                          Mark Reviewed
                        </button>

                        {line.lineClass === "Inventory Stock" && (
                          <a
                            href="/inventory/discrepancies"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-review-discrepancies`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className={warningButtonClass}
                          >
                            Review Discrepancies
                          </a>
                        )}

                        {line.lineClass === "Company Tools" && (
                          <a
                            href="/inventory/company-tools"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`${receivingLineQbitId}-open-company-tools`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className={secondaryButtonClass}
                          >
                            Open Company Tools
                          </a>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}