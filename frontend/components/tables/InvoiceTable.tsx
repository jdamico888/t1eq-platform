"use client";

import Link from "next/link";

import { Invoice } from "@/types/invoice";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type InvoiceTableProps = {
  invoices: Invoice[];

  onEdit?: (
    invoice: Invoice
  ) => void;

  onDelete?: (
    invoice: Invoice
  ) => void;
};

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(value);
}

export default function InvoiceTable({
  invoices,
  onEdit,
  onDelete,
}: InvoiceTableProps) {
  return (
    <DataTable
      data={invoices}
      emptyMessage="No invoices found."
      columns={[
        {
          key: "invoiceNumber",
          header: "Invoice #",
          render: (
            invoice
          ) => (
            <div>
              <Link
                href={`/invoices/${invoice.id}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {
                  invoice.invoiceNumber
                }
              </Link>

              {invoice.repairOrderNumber && (
                <div className="mt-1 text-xs text-slate-400">
                  RO:{" "}
                  {
                    invoice.repairOrderNumber
                  }
                </div>
              )}
            </div>
          ),
        },

        {
          key: "customerName",
          header: "Customer",
          render: (
            invoice
          ) => (
            <div className="text-sm">
              {
                invoice.customerName
              }
            </div>
          ),
        },

        {
          key: "issuedDate",
          header: "Issued",
          render: (
            invoice
          ) => (
            <div className="text-sm">
              {invoice.issuedDate
                ? new Date(
                    invoice.issuedDate
                  ).toLocaleDateString()
                : "-"}
            </div>
          ),
        },

        {
          key: "totalAmount",
          header: "Total",
          render: (
            invoice
          ) => (
            <div className="text-sm font-medium">
              {formatCurrency(
                invoice.totalAmount
              )}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: (
            invoice
          ) => (
            <StatusBadge
              status={
                invoice.status
              }
            />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className:
            "text-right",
          render: (
            invoice
          ) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(
                      invoice
                    )
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete(
                      invoice
                    )
                  }
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}