"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Invoice } from "@/types/invoice";

import { getInvoices, updateInvoice } from "@/services/invoices";
import InvoiceLineItemsPanel from "@/components/invoices/InvoiceLineItemsPanel";

const QBIT_SCOPE = "invoice-detail";

const formatCurrency = (value: number) => {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const invoiceId = useMemo(() => {
    const id = params?.id;

    if (Array.isArray(id)) {
      return id[0] ?? "";
    }

    return id ?? "";
  }, [params]);

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState("");

  function loadInvoice() {
    const invoices = getInvoices();

    const selectedInvoice =
      invoices.find((item) => item.id === invoiceId) ??
      invoices.find((item) => item.invoiceNumber === invoiceId) ??
      null;

    setInvoice(selectedInvoice);
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  function handleIssueInvoice() {
    if (!invoice) {
      return;
    }

    const now = new Date().toISOString();

    updateInvoice(invoice.id, {
      status: "Issued",
      issuedDate: invoice.issuedDate ?? now,
    });

    loadInvoice();
  }

  function handleVoidInvoice() {
    if (!invoice) {
      return;
    }

    if (
      !window.confirm(
        "Void this invoice? It will stay on record but be marked no longer collectible."
      )
    ) {
      return;
    }

    updateInvoice(invoice.id, { status: "Void" });

    loadInvoice();
  }

  function handleStartRecordingPayment() {
    setPaymentAmountInput("");
    setIsRecordingPayment(true);
  }

  function handleCancelRecordingPayment() {
    setPaymentAmountInput("");
    setIsRecordingPayment(false);
  }

  function handleSubmitPayment() {
    if (!invoice) {
      return;
    }

    const paymentAmount = Number(paymentAmountInput);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      alert("Enter a valid payment amount greater than 0.");
      return;
    }

    const nextAmountPaid = invoice.amountPaid + paymentAmount;
    const nextBalanceDue = Math.max(invoice.totalAmount - nextAmountPaid, 0);
    const now = new Date().toISOString();

    updateInvoice(invoice.id, {
      amountPaid: nextAmountPaid,
      balanceDue: nextBalanceDue,
      status: nextBalanceDue <= 0 ? "Paid" : "Partial",
      paidDate: nextBalanceDue <= 0 ? now : invoice.paidDate,
    });

    setPaymentAmountInput("");
    setIsRecordingPayment(false);
    loadInvoice();
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoice-detail-not-found"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoice-detail-not-found-overline"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50"
          >
            Invoice
          </div>

          <h1
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoice-detail-not-found-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-3 text-3xl font-bold"
          >
            Invoice Not Found
          </h1>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoice-detail-not-found-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-3 max-w-2xl text-sm leading-6 text-white/60"
          >
            The requested invoice could not be found in local storage.
          </p>

          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="invoice-detail-not-found-back"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={() => router.push("/invoices")}
            className="mt-6 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Back to Invoices
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <button data-t1eq-action-button="true"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-id="invoice-detail-back"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          type="button"
          onClick={() => router.push("/invoices")}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          ← Back to Invoices
        </button>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoice-detail-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-overline"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50"
              >
                Invoice
              </div>

              <h1
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-4xl font-bold text-white"
              >
                {invoice.invoiceNumber}
              </h1>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-customer-name"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-white/60"
              >
                {invoice.customerName}
              </p>
            </div>

            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="invoice-detail-total"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-total-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs uppercase tracking-wide text-white/50"
              >
                Total
              </div>

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-total-value"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-1 text-3xl font-bold text-white"
              >
                {formatCurrency(invoice.totalAmount)}
              </div>

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-status"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-sm text-white/60"
              >
                {invoice.status}
              </div>

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="invoice-detail-balance-due"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-1 text-xs text-white/40"
              >
                Balance Due: {formatCurrency(invoice.balanceDue)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {invoice.status === "Draft" && (
              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleIssueInvoice}
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="invoice-detail-issue"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
              >
                Issue Invoice
              </button>
            )}

            {invoice.status !== "Paid" &&
              invoice.status !== "Void" &&
              invoice.status !== "Cancelled" &&
              !isRecordingPayment && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleStartRecordingPayment}
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="invoice-detail-record-payment"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                >
                  Record Payment
                </button>
              )}

            {invoice.status !== "Paid" &&
              invoice.status !== "Void" &&
              invoice.status !== "Cancelled" && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleVoidInvoice}
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="invoice-detail-void"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Void Invoice
                </button>
              )}
          </div>

          {isRecordingPayment && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="invoice-detail-payment-form"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <label className="block max-w-xs space-y-1">
                <span className="text-xs uppercase tracking-wide text-white/50">
                  Payment Amount
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="invoice-detail-payment-amount"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={paymentAmountInput}
                  onChange={(event) =>
                    setPaymentAmountInput(event.target.value)
                  }
                  placeholder={invoice.balanceDue.toFixed(2)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/30"
                />
              </label>

              <div className="mt-3 flex gap-3">
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleSubmitPayment}
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="invoice-detail-payment-submit"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Save Payment
                </button>

                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleCancelRecordingPayment}
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="invoice-detail-payment-cancel"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="invoice-detail-dates"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="grid gap-4 md:grid-cols-3"
        >
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="invoice-detail-issued-date"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-issued-date-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Issued Date
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-issued-date-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-lg font-semibold text-white"
            >
              {formatDate(invoice.issuedDate ?? invoice.createdDate)}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="invoice-detail-due-date"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-due-date-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Due Date
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-due-date-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-lg font-semibold text-white"
            >
              {formatDate(invoice.dueDate)}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="invoice-detail-paid-date"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-paid-date-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Paid Date
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-paid-date-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-lg font-semibold text-white"
            >
              {formatDate(invoice.paidDate)}
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoice-detail-details"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoice-detail-details-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-bold text-white"
          >
            Invoice Details
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/50">
                Customer ID
              </div>

              <div className="mt-1 text-white">
                {invoice.customerId}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-white/50">
                Repair Order
              </div>

              <div className="mt-1 text-white">
                {invoice.repairOrderNumber ??
                  invoice.repairOrderId ??
                  "Not assigned"}
              </div>
            </div>

            {invoice.scheduleEventId && (
              <div>
                <div className="text-xs uppercase tracking-wide text-white/50">
                  Appointment
                </div>

                <div className="mt-1 text-white">
                  {invoice.scheduleEventTitle ?? invoice.scheduleEventId}
                </div>
              </div>
            )}
          </div>
        </section>

        <InvoiceLineItemsPanel
          invoice={invoice}
          onInvoiceChanged={loadInvoice}
        />

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoice-detail-totals"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="ml-auto max-w-sm space-y-3">
            <div className="flex justify-between text-white/70">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between text-white/70">
              <span>Tax</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>

            <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold text-white">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="invoice-detail-notes"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-notes-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-2xl font-bold text-white"
            >
              Notes
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="invoice-detail-notes-body"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-3 text-sm leading-6 text-white/70"
            >
              {invoice.notes}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}