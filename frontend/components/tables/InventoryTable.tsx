"use client";

import { InventoryItem } from "@/types/inventory-item";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type InventoryTableProps = {
  inventory: InventoryItem[];

  onEdit?: (
    item: InventoryItem
  ) => void;

  onDelete?: (
    item: InventoryItem
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

export default function InventoryTable({
  inventory,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  return (
    <DataTable
      data={inventory}
      emptyMessage="No inventory items found."
      columns={[
        {
          key: "partNumber",
          header: "Part #",
          render: (item) => (
            <div>
              <div className="font-medium">
                {item.partNumber}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {item.name}
              </div>
            </div>
          ),
        },

        {
          key: "manufacturer",
          header: "Manufacturer",
          render: (item) => (
            <div className="text-sm">
              {item.manufacturer ||
                "-"}
            </div>
          ),
        },

        {
          key: "quantityOnHand",
          header: "Qty",
          render: (item) => {
            const isLowStock =
              typeof item.minimumQuantity ===
                "number" &&
              item.quantityOnHand <=
                item.minimumQuantity;

            return (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {
                    item.quantityOnHand
                  }
                </span>

                {isLowStock && (
                  <StatusBadge status="Needs Service" />
                )}
              </div>
            );
          },
        },

        {
          key: "cost",
          header: "Cost",
          render: (item) => (
            <div className="text-sm">
              {formatCurrency(
                item.cost
              )}
            </div>
          ),
        },

        {
          key: "sellPrice",
          header: "Sell",
          render: (item) => (
            <div className="text-sm">
              {formatCurrency(
                item.sellPrice
              )}
            </div>
          ),
        },

        {
          key: "location",
          header: "Location",
          render: (item) => (
            <div className="text-sm">
              {item.location ||
                "-"}
            </div>
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className:
            "text-right",
          render: (item) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() =>
                    onEdit(item)
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
                    onDelete(item)
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