"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { RepairOrder } from "@/types/repair-orders";
import type { Invoice } from "@/types/invoice";

import { formatCurrency } from "@/services/repair-order-financials";
import { getAppSettings } from "@/services/app-settings";
import { createInvoice, getInvoicesByRepairOrderId } from "@/services/invoices";
import { generateInvoiceFromRepairOrder } from "@/services/invoice-generator";

const QBIT_SCOPE = "repair-order-invoice-panel";

type RepairOrderInvoicePanelProps = {
  repairOrder: RepairOrder;
};

export default function RepairOrderInvoicePanel({
  repairOrder,
}: RepairOrderInvoicePanelProps) {
  const router = useRouter();

  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    refreshInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairOrder.id]);

  function refreshInvoice() {
    const invoices = getInvoicesByRepairOrderId(repairOrder.id);

    const mostRecentInvoice =
      invoices.length === 0
        ? null
        : invoices.reduce((latest, invoice) =>
            invoice.createdDate > latest.createdDate ? invoice : latest
          );

    setExistingInvoice(mostRecentInvoice);
  }

  function handleGenerateInvoice() {
    setIsGenerating(true);

    const taxRate = getAppSettings().taxRate;
    const generatedInvoice = generateInvoiceFromRepairOrder(
      repairOrder,
      taxRate
    );

    const savedInvoice = createInvoice(generatedInvoice);

    setIsGenerating(false);
    router.push(`/invoices/${savedInvoice.id}`);
  }

  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true"
      data-t1eq-qbit-id="repair-order-invoice-panel"
      data-t1eq-qbit-type="page-card"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2
            data-t1eq-qbit-id="repair-order-invoice-panel-title"
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-bold text-white"
          >
            Invoice
          </h2>

          <p
            data-t1eq-qbit-id="repair-order-invoice-panel-description"
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-1 text-sm text-white/60"
          >
            {existingInvoice
              ? "This repair order already has an invoice generated from it."
              : "Generate an invoice from this repair order's action items, labor, and parts."}
          </p>
        </div>

        {existingInvoice ? (
          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => router.push(`/invoices/${existingInvoice.id}`)}
            data-t1eq-qbit-id="repair-order-invoice-panel-view"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
          >
            View Invoice {existingInvoice.invoiceNumber}
          </button>
        ) : (
          <button data-t1eq-action-button="true"
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            data-t1eq-qbit-id="repair-order-invoice-panel-generate"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Invoice"}
          </button>
        )}
      </div>

      {existingInvoice && (
        <div className="grid gap-4 md:grid-cols-4">
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Status
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {existingInvoice.status}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Total
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {formatCurrency(existingInvoice.totalAmount)}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Balance Due
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {formatCurrency(existingInvoice.balanceDue)}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Invoice #
            </div>

            <div className="mt-1 text-lg font-semibold text-white">
              {existingInvoice.invoiceNumber}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
