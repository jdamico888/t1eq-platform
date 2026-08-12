"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Invoice } from "@/types/invoice";

import { getInvoices } from "@/services/invoices";

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

  useEffect(() => {
    const invoices = getInvoices();

    const selectedInvoice =
      invoices.find((item) => item.id === invoiceId) ??
      invoices.find((item) => item.invoiceNumber === invoiceId) ??
      null;

    setInvoice(selectedInvoice);
  }, [invoiceId]);

  if (!invoice) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
            Invoice
          </div>

          <h1 className="mt-3 text-3xl font-bold">Invoice Not Found</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            The requested invoice could not be found in local storage.
          </p>

          <button
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
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/invoices")}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          ← Back to Invoices
        </button>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
                Invoice
              </div>

              <h1 className="mt-2 text-4xl font-bold text-white">
                {invoice.invoiceNumber}
              </h1>

              <p className="mt-2 text-white/60">
                {invoice.customerName}
              </p>

              <p className="mt-1 text-sm text-white/40">
                RO:{" "}
                {invoice.repairOrderNumber ??
                  invoice.repairOrderId ??
                  "Not assigned"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
              <div className="text-xs uppercase tracking-wide text-white/50">
                Total
              </div>

              <div className="mt-1 text-3xl font-bold text-white">
                {formatCurrency(invoice.totalAmount)}
              </div>

              <div className="mt-2 text-sm text-white/60">
                {invoice.status}
              </div>

              <div className="mt-1 text-xs text-white/40">
                Balance Due: {formatCurrency(invoice.balanceDue)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Labor"
            value={formatCurrency(invoice.subtotalLabor)}
          />

          <SummaryCard
            label="Parts"
            value={formatCurrency(invoice.subtotalParts)}
          />

          <SummaryCard
            label="Travel / Misc / Other"
            value={formatCurrency(invoice.subtotalOther)}
          />

          <SummaryCard
            label="Tax"
            value={formatCurrency(invoice.taxAmount)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Issued Date"
            value={formatDate(invoice.issuedDate ?? invoice.invoiceDate)}
          />

          <SummaryCard
            label="Due Date"
            value={formatDate(invoice.dueDate)}
          />

          <SummaryCard
            label="Paid Date"
            value={formatDate(invoice.paidDate)}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white">
            Invoice Details
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DetailBlock label="Customer ID" value={invoice.customerId} />

            <DetailBlock
              label="Repair Order"
              value={
                invoice.repairOrderNumber ??
                invoice.repairOrderId ??
                "Not assigned"
              }
            />

            <DetailBlock
              label="Site"
              value={invoice.siteName ?? "Not assigned"}
            />

            <DetailBlock
              label="Equipment"
              value={invoice.equipmentName ?? "Not assigned"}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white">
            Line Items
          </h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10 text-white/70">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Source</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.lineItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-t border-white/10 p-6 text-center text-white/50"
                    >
                      No invoice line items.
                    </td>
                  </tr>
                )}

                {invoice.lineItems.map((lineItem) => (
                  <tr
                    key={lineItem.id}
                    className="border-t border-white/10 align-top"
                  >
                    <td className="p-3 text-white">
                      {lineItem.type}
                    </td>

                    <td className="p-3 text-white">
                      <div>{lineItem.description}</div>

                      {lineItem.notes && (
                        <div className="mt-1 text-xs leading-5 text-white/50">
                          {lineItem.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-white/70">
                      {lineItem.sourceType ?? "Manual"}
                    </td>

                    <td className="p-3 text-right text-white">
                      {lineItem.quantity}
                    </td>

                    <td className="p-3 text-right text-white">
                      {formatCurrency(lineItem.unitPrice)}
                    </td>

                    <td className="p-3 text-right font-semibold text-white">
                      {formatCurrency(lineItem.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="ml-auto max-w-sm space-y-3">
            <TotalRow label="Labor" value={invoice.subtotalLabor} />
            <TotalRow label="Parts" value={invoice.subtotalParts} />
            <TotalRow label="Other" value={invoice.subtotalOther} />
            <TotalRow label="Subtotal" value={invoice.subtotal} />
            <TotalRow label="Tax" value={invoice.taxAmount} />

            <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold text-white">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Notes</h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              {invoice.notes}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>

      <div className="mt-2 text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>

      <div className="mt-1 text-white">
        {value}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}