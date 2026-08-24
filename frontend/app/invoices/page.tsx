"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { Invoice, InvoiceStatus } from "@/types/invoice";

import { getInvoices } from "@/services/invoices";

const QBIT_SCOPE = "invoices-list";

const INVOICE_STATUSES: InvoiceStatus[] = [
  "Draft",
  "Open",
  "Issued",
  "Partial",
  "Paid",
  "Overdue",
  "Cancelled",
  "Void",
];

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

function isClosedStatus(status: InvoiceStatus) {
  return status === "Paid" || status === "Void" || status === "Cancelled";
}

function isInvoiceOverdue(invoice: Invoice) {
  if (isClosedStatus(invoice.status)) {
    return false;
  }

  if (invoice.status === "Overdue") {
    return true;
  }

  if (!invoice.dueDate || invoice.balanceDue <= 0) {
    return false;
  }

  const dueDate = new Date(invoice.dueDate);

  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();
}

function getStatusBadgeClass(status: InvoiceStatus) {
  if (status === "Paid") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }

  if (status === "Overdue") {
    return "border-red-400/30 bg-red-500/15 text-red-200";
  }

  if (status === "Partial") {
    return "border-amber-400/30 bg-amber-500/15 text-amber-200";
  }

  if (status === "Void" || status === "Cancelled") {
    return "border-white/10 bg-white/5 text-white/50";
  }

  if (status === "Issued" || status === "Open") {
    return "border-blue-400/30 bg-blue-500/15 text-blue-200";
  }

  return "border-white/10 bg-white/10 text-white/70";
}

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>(
    "All"
  );

  useEffect(() => {
    refreshData();

    function handleInvoicesChanged() {
      refreshData();
    }

    window.addEventListener("t1eq-invoices-changed", handleInvoicesChanged);

    return () => {
      window.removeEventListener(
        "t1eq-invoices-changed",
        handleInvoicesChanged
      );
    };
  }, []);

  function refreshData() {
    setInvoices(getInvoices());
  }

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices
      .filter((invoice) => {
        if (statusFilter === "All") {
          return true;
        }

        return invoice.status === statusFilter;
      })
      .filter((invoice) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
          invoice.customerName.toLowerCase().includes(normalizedSearch) ||
          (invoice.repairOrderNumber ?? "")
            .toLowerCase()
            .includes(normalizedSearch) ||
          invoice.status.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [invoices, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const outstandingBalance = invoices
      .filter((invoice) => !isClosedStatus(invoice.status))
      .reduce((total, invoice) => total + invoice.balanceDue, 0);

    const totalInvoiced = invoices.reduce(
      (total, invoice) => total + invoice.totalAmount,
      0
    );

    const overdueCount = invoices.filter(isInvoiceOverdue).length;

    return {
      count: invoices.length,
      totalInvoiced,
      outstandingBalance,
      overdueCount,
    };
  }, [invoices]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoices-list-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
        >
          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoices-list-overline"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50"
          >
            Billing
          </div>

          <h1
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoices-list-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-4xl font-bold text-white"
          >
            Invoices
          </h1>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoices-list-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 max-w-2xl text-sm leading-6 text-white/60"
          >
            Invoices generated from repair orders. Open a repair order and
            use "Generate Invoice" to create one.
          </p>
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="invoices-list-metrics"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="grid gap-4 md:grid-cols-4"
        >
          <MetricCard
            qbitId="invoices-list-metric-count"
            qbitScope={QBIT_SCOPE}
            label="Total Invoices"
            value={metrics.count.toString()}
          />

          <MetricCard
            qbitId="invoices-list-metric-invoiced"
            qbitScope={QBIT_SCOPE}
            label="Total Invoiced"
            value={formatCurrency(metrics.totalInvoiced)}
          />

          <MetricCard
            qbitId="invoices-list-metric-outstanding"
            qbitScope={QBIT_SCOPE}
            label="Outstanding Balance"
            value={formatCurrency(metrics.outstandingBalance)}
          />

          <MetricCard
            qbitId="invoices-list-metric-overdue"
            qbitScope={QBIT_SCOPE}
            label="Overdue"
            value={metrics.overdueCount.toString()}
            tone={metrics.overdueCount > 0 ? "danger" : undefined}
          />
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="invoices-list-filters"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-semibold text-white/70">
                Search Invoices
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="invoices-list-search"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search invoice #, customer, RO #, status..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-white/70">
                Status
              </span>

              <select data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="invoices-list-status-filter"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | InvoiceStatus)
                }
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
              >
                <option value="All">All</option>

                {INVOICE_STATUSES.map((status) => (
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
          data-t1eq-qbit-id="invoices-list-table-section"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
        >
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="invoices-list-table-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-bold text-white"
          >
            {filteredInvoices.length} Invoice
            {filteredInvoices.length === 1 ? "" : "s"}
          </h2>

          {filteredInvoices.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="invoices-list-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-10 text-center"
            >
              <div className="text-xl font-bold text-white">
                No invoices found
              </div>

              <p className="mt-2 text-white/60">
                {invoices.length === 0
                  ? "No invoices have been generated yet. Open a repair order and use \"Generate Invoice.\""
                  : "Try a different search or status filter."}
              </p>
            </div>
          ) : (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="invoices-list-table"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-5 overflow-hidden rounded-2xl border border-white/10"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/10 text-white/70">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">RO #</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3">Issued</th>
                      <th className="p-3">Due</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        data-t1eq-qbit-type="tile"
                        data-t1eq-qbit-id={`invoices-list-row-${invoice.id}`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="border-t border-white/10 align-top transition hover:bg-white/5"
                      >
                        <td className="p-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`invoices-list-row-${invoice.id}-link`}
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className="font-semibold text-blue-200 hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>

                        <td className="p-3 text-white">
                          {invoice.customerName}
                        </td>

                        <td className="p-3 text-white/70">
                          {invoice.repairOrderNumber ?? "—"}
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                              invoice.status
                            )}`}
                          >
                            {isInvoiceOverdue(invoice) &&
                            invoice.status !== "Overdue"
                              ? "Overdue"
                              : invoice.status}
                          </span>
                        </td>

                        <td className="p-3 text-right font-semibold text-white">
                          {formatCurrency(invoice.totalAmount)}
                        </td>

                        <td className="p-3 text-right text-white">
                          {formatCurrency(invoice.balanceDue)}
                        </td>

                        <td className="p-3 text-white/60">
                          {formatDate(invoice.issuedDate ?? invoice.invoiceDate)}
                        </td>

                        <td className="p-3 text-white/60">
                          {formatDate(invoice.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone,
  qbitId,
  qbitScope = "global",
}: {
  label: string;
  value: string;
  tone?: "danger";
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`rounded-2xl border p-5 ${
        tone === "danger"
          ? "border-red-400/30 bg-red-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wide ${
          tone === "danger" ? "text-red-200/80" : "text-white/50"
        }`}
      >
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-bold ${
          tone === "danger" ? "text-red-100" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
