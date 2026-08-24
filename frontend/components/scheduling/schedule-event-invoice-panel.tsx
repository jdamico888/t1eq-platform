"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ScheduleEvent } from "@/types/schedule-event";
import type { Invoice } from "@/types/invoice";

import { getAppSettings } from "@/services/app-settings";
import { createInvoice, getInvoicesByScheduleEventId } from "@/services/invoices";
import {
  evaluateScheduleEventInvoiceGate,
  generateInvoiceFromScheduleEvent,
} from "@/services/schedule-event-invoicing";

const QBIT_SCOPE = "schedule-event-invoice-panel";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

type ScheduleEventInvoicePanelProps = {
  scheduleEvent: ScheduleEvent;
};

export default function ScheduleEventInvoicePanel({
  scheduleEvent,
}: ScheduleEventInvoicePanelProps) {
  const router = useRouter();

  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    refreshInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleEvent.id]);

  function refreshInvoice() {
    const invoices = getInvoicesByScheduleEventId(scheduleEvent.id);

    const mostRecentInvoice =
      invoices.length === 0
        ? null
        : invoices.reduce((latest, invoice) =>
            invoice.createdDate > latest.createdDate ? invoice : latest
          );

    setExistingInvoice(mostRecentInvoice);
  }

  const gate = evaluateScheduleEventInvoiceGate(scheduleEvent);

  function handleGenerateInvoice() {
    if (!gate.canInvoice) {
      return;
    }

    setIsGenerating(true);

    const taxRate = getAppSettings().taxRate;
    const generatedInvoice = generateInvoiceFromScheduleEvent(
      scheduleEvent,
      taxRate
    );

    const savedInvoice = createInvoice(generatedInvoice);

    setIsGenerating(false);
    router.push(`/invoices/${savedInvoice.id}`);
  }

  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true"
      data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}`}
      data-t1eq-qbit-type="tile"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="mt-3 rounded-lg border border-black/10 bg-white/70 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}-title`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="text-xs font-semibold uppercase tracking-wide text-black/50"
        >
          Invoicing
        </div>

        {existingInvoice ? (
          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => router.push(`/invoices/${existingInvoice.id}`)}
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}-view`}
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            View Invoice {existingInvoice.invoiceNumber}
          </button>
        ) : (
          <button data-t1eq-action-button="true"
            type="button"
            onClick={handleGenerateInvoice}
            disabled={!gate.canInvoice || isGenerating}
            title={
              gate.canInvoice
                ? undefined
                : gate.reasons.join(" ")
            }
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}-generate`}
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isGenerating ? "Generating..." : "Generate Invoice"}
          </button>
        )}
      </div>

      {existingInvoice ? (
        <div
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}-summary`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="mt-2 text-xs text-black/60"
        >
          {existingInvoice.status} · {formatCurrency(existingInvoice.totalAmount)}{" "}
          · Balance {formatCurrency(existingInvoice.balanceDue)}
        </div>
      ) : (
        <ul
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`schedule-event-invoice-panel-${scheduleEvent.id}-gate`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="mt-2 space-y-1 text-xs"
        >
          <li className={gate.hasPart ? "text-emerald-700" : "text-black/50"}>
            {gate.hasPart ? "✓" : "○"} At least one part added
          </li>

          <li
            className={gate.hasLaborStory ? "text-emerald-700" : "text-black/50"}
          >
            {gate.hasLaborStory ? "✓" : "○"} Labor story completed
            (Completion Notes)
          </li>
        </ul>
      )}
    </div>
  );
}
