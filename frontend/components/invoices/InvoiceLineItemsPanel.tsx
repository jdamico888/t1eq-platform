"use client";

import { useEffect, useState } from "react";

import type { Invoice, InvoiceLineItem } from "@/types/invoice";

import { calculateInvoiceTotals, updateInvoice } from "@/services/invoices";
import {
  appendAmendments,
  buildLineItemAmendments,
  recalculateLineItem,
  resolveInvoiceEditAccess,
  type InvoiceEditAccess,
} from "@/services/invoice-editing";
import {
  applyManagerSellPriceOverride,
  describePartPriceOverride,
} from "@/services/part-price-override";
import {
  currentUserHasPermission,
  getCurrentSessionTechnician,
} from "@/services/auth";

const QBIT_SCOPE = "invoice-detail";

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTime = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const inputClass =
  "w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-sm font-semibold text-white outline-none focus:border-orange-300";

/**
 * Who to name on the record. A profile carries a display name and a first
 * and last name but no single `name` field, so the fallbacks matter — an
 * amendment that cannot say who made it is not much of a record.
 */
function resolveAmendmentActor(): { technicianId?: string; name: string } {
  const technician = getCurrentSessionTechnician();

  if (!technician) {
    return { name: "Unrecorded user" };
  }

  const fullName = [technician.firstName, technician.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    technicianId: technician.id,
    name: technician.displayName?.trim() || fullName || "Unrecorded user",
  };
}

type InvoiceLineItemsPanelProps = {
  invoice: Invoice;
  onInvoiceChanged: () => void;
};

export default function InvoiceLineItemsPanel({
  invoice,
  onInvoiceChanged,
}: InvoiceLineItemsPanelProps) {
  /*
   * Permission is resolved in an effect, never during render — on the
   * server there are no employees, so a render-time read answers "yes"
   * there and "no" here, which is a hydration mismatch.
   */
  const [canEditCharges, setCanEditCharges] = useState(false);

  useEffect(() => {
    setCanEditCharges(currentUserHasPermission("editCharges"));
  }, []);

  const access: InvoiceEditAccess = resolveInvoiceEditAccess({
    status: invoice.status,
    canEditCharges,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draftLineItems, setDraftLineItems] = useState<InvoiceLineItem[]>([]);
  const [reason, setReason] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  function startEditing() {
    setDraftLineItems(invoice.lineItems.map((lineItem) => ({ ...lineItem })));
    setReason("");
    setSaveError("");
    setSaveMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraftLineItems([]);
    setReason("");
    setSaveError("");
  }

  function updateDraftLine(
    lineItemId: string,
    changes: Partial<InvoiceLineItem>
  ) {
    setDraftLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === lineItemId
          ? recalculateLineItem({ ...lineItem, ...changes })
          : lineItem
      )
    );

    setSaveError("");
  }

  function removeDraftLine(lineItemId: string) {
    setDraftLineItems((current) =>
      current.filter((lineItem) => lineItem.id !== lineItemId)
    );

    setSaveError("");
  }

  function handleSave() {
    const nextLineItems = draftLineItems.map(recalculateLineItem);

    const amendments = buildLineItemAmendments(
      invoice.lineItems,
      nextLineItems,
      invoice.status,
      resolveAmendmentActor(),
      reason
    );

    if (amendments.length === 0) {
      setSaveError("Nothing changed.");
      return;
    }

    /*
     * A change to a document the customer is already holding has to say
     * why. Draft edits are still the shop finishing its own work, so they
     * do not.
     */
    if (access.requiresRecord && !reason.trim()) {
      setSaveError(
        "Give a reason for this change. It becomes part of the invoice record."
      );
      return;
    }

    const totals = calculateInvoiceTotals(nextLineItems, invoice.taxRate);

    const balanceDue = Math.max(totals.totalAmount - invoice.amountPaid, 0);

    updateInvoice(invoice.id, {
      lineItems: nextLineItems,
      ...totals,
      balanceDue,

      /* Draft edits are the shop's own work and leave no amendment. */
      amendments: access.requiresRecord
        ? appendAmendments(invoice, amendments)
        : invoice.amendments,
    });

    /*
     * A corrected parts price is still a manager's price decision, so it
     * reaches inventory from here exactly as it does from a repair order
     * line — one rule, not two.
     */
    const priceMessages: string[] = [];

    for (const nextLineItem of nextLineItems) {
      if (nextLineItem.type !== "Parts" || !nextLineItem.inventoryItemId) {
        continue;
      }

      const previousLineItem = invoice.lineItems.find(
        (lineItem) => lineItem.id === nextLineItem.id
      );

      if (
        !previousLineItem ||
        Math.round(previousLineItem.unitPrice * 100) ===
          Math.round(nextLineItem.unitPrice * 100)
      ) {
        continue;
      }

      const overrideResult = applyManagerSellPriceOverride({
        inventoryItemId: nextLineItem.inventoryItemId,
        sellPrice: nextLineItem.unitPrice,
        canEditCharges,
      });

      const message = describePartPriceOverride(overrideResult);

      if (message) {
        priceMessages.push(message);
      }
    }

    setSaveMessage(
      [
        access.requiresRecord
          ? `${amendments.length} change${
              amendments.length === 1 ? "" : "s"
            } saved to the invoice record.`
          : "Draft updated.",
        ...priceMessages,
      ].join(" ")
    );

    setIsEditing(false);
    setDraftLineItems([]);
    setReason("");

    onInvoiceChanged();
  }

  const lineItemsToShow = isEditing ? draftLineItems : invoice.lineItems;

  const draftTotal = lineItemsToShow.reduce(
    (total, lineItem) => total + lineItem.total,
    0
  );

  const amendments = invoice.amendments ?? [];

  return (
    <>
      <section
        data-t1eq-tile="true"
        data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="invoice-detail-line-items"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-line-items-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-2xl font-bold text-white"
            >
              Line Items
            </h2>

            {access.stageNote && (
              <p className="mt-2 max-w-2xl text-xs font-semibold text-white/60">
                {access.stageNote}
              </p>
            )}

            {!access.canEdit && access.blockedReason && (
              <p className="mt-2 max-w-2xl text-xs font-semibold text-white/50">
                {access.blockedReason}
              </p>
            )}
          </div>

          {access.canEdit && !isEditing && (
            <button
              data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="invoice-detail-edit-lines"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={startEditing}
              className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
            >
              Edit Line Items
            </button>
          )}
        </div>

        <div
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="invoice-detail-line-items-table"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="mt-5 overflow-x-auto rounded-2xl border border-white/10"
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/70">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
                {isEditing && <th className="p-3" />}
              </tr>
            </thead>

            <tbody>
              {lineItemsToShow.length === 0 ? (
                <tr className="border-t border-white/10">
                  <td
                    colSpan={isEditing ? 5 : 4}
                    className="p-4 text-center text-sm font-semibold text-white/50"
                  >
                    No line items.
                  </td>
                </tr>
              ) : (
                lineItemsToShow.map((lineItem) => (
                  <tr
                    key={lineItem.id}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-id={`invoice-detail-line-item-${lineItem.id}`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="border-t border-white/10"
                  >
                    <td className="p-3 text-white">
                      {isEditing ? (
                        <input
                          data-t1eq-field="true"
                          value={lineItem.description}
                          onChange={(event) =>
                            updateDraftLine(lineItem.id, {
                              description: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      ) : (
                        lineItem.description
                      )}
                    </td>

                    <td className="p-3 text-right text-white">
                      {isEditing ? (
                        <input
                          data-t1eq-field="true"
                          type="number"
                          min="0"
                          step="0.01"
                          value={lineItem.quantity}
                          onChange={(event) =>
                            updateDraftLine(lineItem.id, {
                              quantity: Number(event.target.value) || 0,
                            })
                          }
                          className={`${inputClass} w-24 text-right`}
                        />
                      ) : (
                        lineItem.quantity
                      )}
                    </td>

                    <td className="p-3 text-right text-white">
                      {isEditing ? (
                        <input
                          data-t1eq-field="true"
                          type="number"
                          min="0"
                          step="0.01"
                          value={lineItem.unitPrice}
                          onChange={(event) =>
                            updateDraftLine(lineItem.id, {
                              unitPrice: Number(event.target.value) || 0,
                            })
                          }
                          className={`${inputClass} w-28 text-right`}
                        />
                      ) : (
                        formatCurrency(lineItem.unitPrice)
                      )}
                    </td>

                    <td className="p-3 text-right font-semibold text-white">
                      {formatCurrency(lineItem.total)}
                    </td>

                    {isEditing && (
                      <td className="p-3 text-right">
                        <button
                          data-t1eq-action-button="true"
                          type="button"
                          onClick={() => removeDraftLine(lineItem.id)}
                          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="mt-5 space-y-4">
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Line Items Subtotal</span>
              <span>{formatCurrency(draftTotal)}</span>
            </div>

            {access.requiresRecord && (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-white/60">
                  Reason For This Change
                </span>

                <input
                  data-t1eq-field="true"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. Corrected quantity — two seals fitted, one billed"
                  className={`${inputClass} mt-1`}
                />

                <span className="mt-1 block text-xs font-semibold text-white/40">
                  This is kept on the invoice record with your name and the
                  time of the change.
                </span>
              </label>
            )}

            {saveError && (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">
                {saveError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="invoice-detail-save-lines"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-400"
              >
                Save Changes
              </button>

              <button
                data-t1eq-action-button="true"
                type="button"
                onClick={cancelEditing}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isEditing && saveMessage && (
          <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
            {saveMessage}
          </p>
        )}
      </section>

      {/*
        The record of account. Once an invoice has gone to the customer,
        what changed afterwards is part of the document's history.
      */}
      {amendments.length > 0 && (
        <section
          data-t1eq-tile="true"
          data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoice-detail-amendments"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
        >
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoice-detail-amendments-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-bold text-white"
          >
            Record Of Changes
          </h2>

          <p className="mt-2 text-xs font-semibold text-white/60">
            Every change made after this invoice was issued, oldest first.
          </p>

          <div className="mt-5 space-y-3">
            {amendments.map((amendment) => (
              <div
                key={amendment.id}
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-id={`invoice-detail-amendment-${amendment.id}`}
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-black text-white">
                    {amendment.field}
                    {amendment.lineDescription
                      ? ` — ${amendment.lineDescription}`
                      : ""}
                  </span>

                  <span className="text-xs font-semibold text-white/50">
                    {formatDateTime(amendment.changedDate)} ·{" "}
                    {amendment.changedByName} · invoice was{" "}
                    {amendment.statusAtChange}
                  </span>
                </div>

                <div className="mt-2 text-sm font-semibold text-white/80">
                  <span className="text-white/50 line-through">
                    {amendment.previousValue}
                  </span>

                  <span className="mx-2 text-white/40">→</span>

                  <span className="text-white">{amendment.newValue}</span>
                </div>

                {amendment.reason && (
                  <p className="mt-2 text-xs font-semibold italic text-white/60">
                    “{amendment.reason}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
