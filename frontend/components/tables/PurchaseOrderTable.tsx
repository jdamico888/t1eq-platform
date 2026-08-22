import type { PurchaseOrder } from "../../types/purchase-order";

import { formatCurrency } from "../../app/utils/format";

type PurchaseOrderTableProps = {
  purchaseOrders: PurchaseOrder[];
};

const getPurchaseOrderNumber = (purchaseOrder: PurchaseOrder) => {
  return (
    purchaseOrder.purchaseOrderNumber ||
    purchaseOrder.poNumber ||
    "Unnumbered"
  );
};

const getSupplierName = (purchaseOrder: PurchaseOrder) => {
  return (
    purchaseOrder.supplierName ||
    purchaseOrder.supplier ||
    "No Supplier"
  );
};

const getPurchaseOrderTotal = (purchaseOrder: PurchaseOrder) => {
  return purchaseOrder.totalAmount ?? purchaseOrder.total ?? 0;
};

export default function PurchaseOrderTable({
  purchaseOrders,
}: PurchaseOrderTableProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-xl border border-black/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/[0.03]">
          <tr>
            <th className="p-3">PO Number</th>
            <th className="p-3">Supplier</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>

        <tbody>
          {purchaseOrders.map((purchaseOrder) => (
            <tr
              key={purchaseOrder.id}
              className="border-t border-black/10"
            >
              <td className="p-3 font-medium">
                {getPurchaseOrderNumber(purchaseOrder)}
              </td>

              <td className="p-3">
                {getSupplierName(purchaseOrder)}
              </td>

              <td className="p-3">
                {purchaseOrder.status}
              </td>

              <td className="p-3 text-right font-semibold">
                {formatCurrency(getPurchaseOrderTotal(purchaseOrder))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}