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
      <div className="mx-auto max-w-5xl space-y-6">
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
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Issued Date
            </div>

            <div className="mt-2 text-lg font-semibold text-white">
              {formatDate(invoice.issuedDate ?? invoice.createdDate)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Due Date
            </div>

            <div className="mt-2 text-lg font-semibold text-white">
              {formatDate(invoice.dueDate)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Paid Date
            </div>

            <div className="mt-2 text-lg font-semibold text-white">
              {formatDate(invoice.paidDate)}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white">
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
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.lineItems.map((lineItem) => (
                  <tr
                    key={lineItem.id}
                    className="border-t border-white/10"
                  >
                    <td className="p-3 text-white">
                      {lineItem.description}
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