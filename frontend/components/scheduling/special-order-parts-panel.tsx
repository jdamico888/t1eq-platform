"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ScheduleEvent } from "@/types/schedule-event";
import type { SpecialOrderStatus } from "@/types/special-order";

import {
  specialOrderStatusDescriptions,
  specialOrderStatuses,
} from "@/types/special-order";

import { getAppSettings } from "@/services/app-settings";
import { currentUserHasPermission } from "@/services/auth";
import {
  evaluateSpecialOrderPrepaymentGate,
  generateSpecialOrderPrepaymentInvoice,
  getNextSpecialOrderStatus,
  setSpecialOrderPartFlag,
  setSpecialOrderPartStatus,
  specialOrderPrepaymentRequired,
  summarizeScheduleEventSpecialOrders,
} from "@/services/special-order-parts";

const QBIT_SCOPE = "special-order-parts-panel";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

/**
 * Colour carries the same meaning everywhere: amber is waiting on someone,
 * emerald is money in, sky is in motion, white is done.
 */
const STATUS_CLASSES: Record<SpecialOrderStatus, string> = {
  Quoted: "border-white/20 bg-white/10 text-white/70",
  "Awaiting Prepayment": "border-amber-400/40 bg-amber-500/15 text-amber-200",
  Paid: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  Ordered: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  Received: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  Ready: "border-white/30 bg-white/20 text-white",
};

type SpecialOrderPartsPanelProps = {
  scheduleEvent: ScheduleEvent;
  onChanged?: () => void;
};

export default function SpecialOrderPartsPanel({
  scheduleEvent,
  onChanged,
}: SpecialOrderPartsPanelProps) {
  const router = useRouter();

  /*
   * Permission is resolved in an effect, never during render — on the
   * server there are no employees, so a render-time read answers
   * differently there and trips a hydration mismatch.
   */
  const [canEditCharges, setCanEditCharges] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCanEditCharges(currentUserHasPermission("editCharges"));
    setTaxRate(getAppSettings().taxRate ?? 0);
  }, []);

  const summary = summarizeScheduleEventSpecialOrders(scheduleEvent);

  /* Nothing to say about an appointment with no special orders on it. */
  if (summary.parts.length === 0) {
    return null;
  }

  const gate = evaluateSpecialOrderPrepaymentGate(scheduleEvent);

  function handleAdvance(partEntryId: string, status: SpecialOrderStatus) {
    const nextStatus = getNextSpecialOrderStatus(status);

    if (!nextStatus) {
      return;
    }

    setSpecialOrderPartStatus(scheduleEvent.id, partEntryId, nextStatus);
    setMessage("");
    onChanged?.();
  }

  /**
   * Undo for a part flagged by mistake. Refused once a prepayment invoice
   * exists — that invoice would be left billing a part nothing points at.
   */
  function handleClearSpecialOrder(partEntryId: string) {
    setSpecialOrderPartFlag(scheduleEvent.id, partEntryId, false);
    setMessage("");
    onChanged?.();
  }

  function handleBillPrepayment() {
    const result = generateSpecialOrderPrepaymentInvoice(
      scheduleEvent,
      taxRate
    );

    if (!result) {
      setMessage("Nothing to bill right now.");
      return;
    }

    setMessage(
      `Prepayment invoice ${result.invoice.invoiceNumber} created for ${
        result.billedPartEntryIds.length
      } part${result.billedPartEntryIds.length === 1 ? "" : "s"}.`
    );

    onChanged?.();
    router.push(`/invoices/${result.invoice.id}`);
  }

  return (
    <section
      data-t1eq-tile="true"
      data-t1eq-page-card="true"
      data-t1eq-qbit-type="page-card"
      data-t1eq-qbit-id="special-order-parts-panel"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="special-order-parts-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-lg font-black text-white"
          >
            Special Order Parts
          </h3>

          <p className="mt-1 max-w-2xl text-xs font-semibold text-white/60">
            {specialOrderPrepaymentRequired()
              ? "These parts are not carried in stock. The customer pays for them before they are ordered."
              : "Prepayment is switched off in Settings → Parts, so these are tracked but not billed in advance."}
          </p>
        </div>

        {canEditCharges && gate.canBill && (
          <button
            data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="special-order-bill-prepayment"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={handleBillPrepayment}
            className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-400"
          >
            Bill Prepayment · {formatCurrency(summary.awaitingBillingTotal)}
          </button>
        )}
      </div>

      {!gate.canBill && gate.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {gate.reasons.map((reason) => (
            <li
              key={reason}
              className="text-xs font-semibold text-white/50"
            >
              {reason}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
          {message}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {summary.parts.map((part) => {
          const nextStatus = getNextSpecialOrderStatus(part.status);

          return (
            <div
              key={part.partEntry.id}
              data-t1eq-qbit-type="tile"
              data-t1eq-qbit-id={`special-order-part-${part.partEntry.id}`}
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white">
                    {part.partEntry.partNumber}
                  </div>

                  <div className="mt-0.5 text-xs font-semibold text-white/50">
                    {part.partEntry.description}
                    {" · "}
                    {part.partEntry.quantity} ×{" "}
                    {formatCurrency(
                      part.partEntry.sellPrice ?? part.partEntry.unitPrice ?? 0
                    )}
                    {" · "}
                    {part.actionItemTitle}
                  </div>

                  {part.partEntry.prepaymentInvoiceNumber && (
                    <div className="mt-1 text-xs font-bold text-white/60">
                      Prepayment invoice{" "}
                      {part.partEntry.prepaymentInvoiceNumber}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-sm font-black text-white">
                    {formatCurrency(part.lineTotal)}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                      STATUS_CLASSES[part.status]
                    }`}
                  >
                    {part.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-white/50">
                  {specialOrderStatusDescriptions[part.status]}
                </span>

                <div className="flex flex-wrap gap-2">
                  {canEditCharges &&
                    !part.partEntry.prepaymentInvoiceId && (
                      <button
                        data-t1eq-action-button="true"
                        type="button"
                        onClick={() =>
                          handleClearSpecialOrder(part.partEntry.id)
                        }
                        className="rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-bold text-white/50 transition hover:text-white/80"
                      >
                        Not a special order
                      </button>
                    )}

                  {canEditCharges && nextStatus && (
                    <button
                      data-t1eq-action-button="true"
                      type="button"
                      onClick={() =>
                        handleAdvance(part.partEntry.id, part.status)
                      }
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/20"
                    >
                      Mark {nextStatus}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/*
        What the customer has already paid, so nobody has to work it out
        from the invoice list. It comes off the final invoice as a credit.
      */}
      {summary.prepaidTotal > 0 && (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/70">
          {formatCurrency(summary.prepaidTotal)} already paid in advance.
          This is credited back on the final invoice, so these parts are
          not billed twice.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {specialOrderStatuses.map((status) => (
          <span
            key={status}
            className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40"
          >
            {status} · {summary.countByStatus[status] ?? 0}
          </span>
        ))}
      </div>
    </section>
  );
}
