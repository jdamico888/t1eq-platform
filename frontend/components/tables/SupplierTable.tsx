"use client";

import { Supplier } from "@/types/supplier";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type SupplierTableProps = {
  suppliers: Supplier[];

  onEdit?: (
    supplier: Supplier
  ) => void;

  onDelete?: (
    supplier: Supplier
  ) => void;
};

export default function SupplierTable({
  suppliers,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  return (
    <DataTable
      data={suppliers}
      emptyMessage="No suppliers found."
      columns={[
        {
          key: "name",
          header: "Supplier",
          render: (supplier) => (
            <div>
              <div className="font-medium">
                {supplier.name}
              </div>

              {supplier.contactName && (
                <div className="mt-1 text-xs text-slate-400">
                  {
                    supplier.contactName
                  }
                </div>
              )}
            </div>
          ),
        },

        {
          key: "phone",
          header: "Phone",
          render: (supplier) => (
            <div className="text-sm">
              {supplier.phone ||
                "-"}
            </div>
          ),
        },

        {
          key: "email",
          header: "Email",
          render: (supplier) => (
            <div className="text-sm">
              {supplier.email ||
                "-"}
            </div>
          ),
        },

        {
          key: "accountNumber",
          header: "Account #",
          render: (supplier) => (
            <div className="text-sm">
              {supplier.accountNumber ||
                "-"}
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
          className:
            "text-right",
          render: (supplier) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() =>
                    onEdit(
                      supplier
                    )
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() =>
                    onDelete(
                      supplier
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