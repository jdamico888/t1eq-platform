"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ListCard from "../components/ui/ListCard";
import MetricCard from "../components/ui/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";

import type { Invoice } from "../../types/invoice";

import { getInvoices } from "../../services/invoices";

import { formatCurrency, formatDate } from "../utils/format";

import { getStatusTone } from "../utils/status-tone";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const totals = useMemo(() => {
    const openInvoices = invoices.filter(
      (invoice) =>
        invoice.status === "Open" ||
        invoice.status === "Partial" ||
        invoice.status === "Overdue"
    );

    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "Paid"
    );

    const openTotal = openInvoices.reduce(
      (total, invoice) => total + invoice.totalAmount,
      0
    );

    return {
      invoiceCount: invoices.length,
      openCount: openInvoices.length,
      paidCount: paidInvoices.length,
      openTotal,
    };
  }, [invoices]);

  return (
    <PageContainer>
      <div>
        <h1 className="text-5xl font-bold text-black">
          Invoices
        </h1>

        <p className="mt-2 text-lg text-black/70">
          Customer billing and invoice management.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Invoices"
          value={totals.invoiceCount}
        />

        <MetricCard
          label="Open"
          value={totals.openCount}
        />

        <MetricCard
          label="Paid"
          value={totals.paidCount}
        />

        <MetricCard
          label="Open Balance"
          value={formatCurrency(totals.openTotal)}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Invoice List
          </h2>

          <div className="space-y-4">
            {invoices.length === 0 && (
              <EmptyState
                title="No invoices found"
                message="Generate an invoice from a repair order to begin billing."
              />
            )}

            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
              >
                <ListCard>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {invoice.invoiceNumber}
                      </div>

                      <div className="text-black/70">
                        {invoice.customerName}
                      </div>

                      <div className="text-black/60">
                        RO:{" "}
                        {invoice.repairOrderNumber ||
                          invoice.repairOrderId ||
                          "Not assigned"}
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <div className="text-3xl font-bold">
                        {formatCurrency(invoice.totalAmount)}
                      </div>

                      <StatusBadge
                        label={invoice.status}
                        tone={getStatusTone(invoice.status)}
                      />

                      <div className="text-sm text-black/50">
                        {formatDate(
                          invoice.issuedDate || invoice.createdDate
                        )}
                      </div>
                    </div>
                  </div>
                </ListCard>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}