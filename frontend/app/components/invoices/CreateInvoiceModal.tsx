"use client";

import { useMemo, useState } from "react";

import type {
  Invoice,
  InvoiceLineItem,
  InvoiceLineItemType,
  InvoiceStatus,
} from "@/types/invoice";

const QBIT_SCOPE = "create-invoice-modal";

type CreateInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvoice: (invoice: Invoice) => void;
};

const createId = () => {
  return crypto.randomUUID();
};

const createInvoiceNumber = () => {
  return `INV-${Date.now()}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onCreateInvoice,
}: CreateInvoiceModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [repairOrderId, setRepairOrderId] = useState("");
  const [repairOrderNumber, setRepairOrderNumber] = useState("");
  const [lineItemType, setLineItemType] =
    useState<InvoiceLineItemType>("Labor");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0.04712);
  const [status, setStatus] = useState<InvoiceStatus>("Open");
  const [notes, setNotes] = useState("");

  const lineItems = useMemo<InvoiceLineItem[]>(() => {
    const lineTotal = quantity * unitPrice;

    return [
      {
        id: createId(),

        type: lineItemType,
        description: description || "Service / Labor",

        quantity,

        unitPrice,
        rate: unitPrice,

        total: lineTotal,

        repairOrderId: repairOrderId || undefined,
        repairOrderNumber: repairOrderNumber || undefined,

        sourceType: "Manual",

        notes: undefined,
      },
    ];
  }, [
    description,
    lineItemType,
    quantity,
    repairOrderId,
    repairOrderNumber,
    unitPrice,
  ]);

  const subtotalLabor = useMemo(() => {
    return lineItems
      .filter((lineItem) => lineItem.type === "Labor")
      .reduce((total, lineItem) => total + lineItem.total, 0);
  }, [lineItems]);

  const subtotalParts = useMemo(() => {
    return lineItems
      .filter((lineItem) => lineItem.type === "Parts")
      .reduce((total, lineItem) => total + lineItem.total, 0);
  }, [lineItems]);

  const subtotal = useMemo(() => {
    return lineItems.reduce(
      (total, lineItem) => total + lineItem.total,
      0
    );
  }, [lineItems]);

  const subtotalOther = useMemo(() => {
    return subtotal - subtotalLabor - subtotalParts;
  }, [subtotal, subtotalLabor, subtotalParts]);

  const taxAmount = useMemo(() => {
    return subtotal * taxRate;
  }, [subtotal, taxRate]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  if (!isOpen) {
    return null;
  }

  const handleCreateInvoice = () => {
    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: createId(),

      invoiceNumber: createInvoiceNumber(),

      repairOrderId: repairOrderId || undefined,
      repairOrderNumber: repairOrderNumber || undefined,
      repairOrderRO: repairOrderNumber || undefined,

      customerId: customerId || createId(),
      customerName: customerName || "Unknown Customer",
      customer: customerName || "Unknown Customer",

      subtotalLabor,
      subtotalParts,
      subtotalOther,

      subtotal,

      taxRate,
      tax: taxAmount,
      taxAmount,

      totalAmount,
      total: totalAmount,

      amountPaid: 0,
      balanceDue: totalAmount,

      status,

      invoiceDate: now,
      issuedDate: now,
      dueDate: undefined,
      paidDate: undefined,

      lineItems,

      notes: notes || undefined,

      createdDate: now,
      updatedDate: now,
    };

    onCreateInvoice(invoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="create-invoice-modal"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="w-full max-w-3xl rounded-2xl bg-white p-6 text-black shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-3xl font-bold"
            >
              Create Invoice
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-1 text-sm text-black/60"
            >
              Create a customer invoice using the current invoice data model.
            </p>
          </div>

          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="create-invoice-close"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-customer-id-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Customer ID
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-customer-id"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="CUST-001"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-customer-name-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Customer Name
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-customer-name"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Customer name"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-ro-id-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Repair Order ID
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-ro-id"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={repairOrderId}
              onChange={(event) => setRepairOrderId(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Optional"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-ro-number-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Repair Order Number
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-ro-number"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={repairOrderNumber}
              onChange={(event) =>
                setRepairOrderNumber(event.target.value)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="RO-00001"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-line-item-type-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Line Item Type
            </span>

            <select data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-line-item-type"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={lineItemType}
              onChange={(event) =>
                setLineItemType(event.target.value as InvoiceLineItemType)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            >
              <option value="Labor">Labor</option>
              <option value="Parts">Parts</option>
              <option value="Travel">Travel</option>
              <option value="Misc">Misc</option>
              <option value="Inspection">Inspection</option>
              <option value="Repair">Repair</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-line-item-description-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Line Item Description
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-line-item-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Service / Labor"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-quantity-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Quantity
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-quantity"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              value={quantity}
              onChange={(event) =>
                setQuantity(Number(event.target.value) || 0)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              min={0}
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-unit-price-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Unit Price
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-unit-price"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              value={unitPrice}
              onChange={(event) =>
                setUnitPrice(Number(event.target.value) || 0)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              min={0}
              step="0.01"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-tax-rate-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Tax Rate
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-tax-rate"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              value={taxRate}
              onChange={(event) =>
                setTaxRate(Number(event.target.value) || 0)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              min={0}
              step="0.00001"
            />
          </label>

          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-status-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Status
            </span>

            <select data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-status"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as InvoiceStatus)
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            >
              <option value="Draft">Draft</option>
              <option value="Open">Open</option>
              <option value="Issued">Issued</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Void">Void</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-invoice-notes-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-black/70"
            >
              Notes
            </span>

            <textarea data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="create-invoice-notes"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Optional invoice notes"
            />
          </label>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="create-invoice-summary"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="mt-6 rounded-xl border border-black/10 bg-black/[0.03] p-4">
          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-invoice-summary-labor"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="flex justify-between text-sm"
          >
            <span>Labor</span>
            <span>{formatCurrency(subtotalLabor)}</span>
          </div>

          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-invoice-summary-parts"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 flex justify-between text-sm"
          >
            <span>Parts</span>
            <span>{formatCurrency(subtotalParts)}</span>
          </div>

          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-invoice-summary-other"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 flex justify-between text-sm"
          >
            <span>Other</span>
            <span>{formatCurrency(subtotalOther)}</span>
          </div>

          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-invoice-summary-tax"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 flex justify-between text-sm"
          >
            <span>Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>

          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-invoice-summary-total"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-3 flex justify-between border-t border-black/10 pt-3 text-lg font-bold"
          >
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="create-invoice-cancel"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 px-4 py-2 hover:bg-black/5"
          >
            Cancel
          </button>

          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="create-invoice-submit"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={handleCreateInvoice}
            className="rounded-lg bg-black px-4 py-2 font-semibold text-white hover:bg-black/80"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}