"use client";

import Link from "next/link";

import { Customer } from "@/types/customer";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type CustomerTableProps = {
  customers: Customer[];

  onEdit?: (customer: Customer) => void;

  onDelete?: (customer: Customer) => void;
};

export default function CustomerTable({
  customers,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <DataTable
      data={customers}
      emptyMessage="No customers found."
      columns={[
        {
          key: "name",
          header: "Customer",
          render: (customer) => (
            <div>
              <Link
                href={`/customers/${customer.id}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {customer.name}
              </Link>

              {customer.phone && (
                <div className="mt-1 text-xs text-slate-400">
                  {customer.phone}
                </div>
              )}
            </div>
          ),
        },

        {
          key: "location",
          header: "Location",
          render: (customer) => (
            <div className="text-sm">
              {[customer.city, customer.state]
                .filter(Boolean)
                .join(", ")}
            </div>
          ),
        },

        {
          key: "email",
          header: "Email",
          render: (customer) => (
            <div className="text-sm text-slate-300">
              {customer.email || "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: () => (
            <StatusBadge status="Active" />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          render: (customer) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(customer)
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
                    onDelete(customer)
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