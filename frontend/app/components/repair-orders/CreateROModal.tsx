"use client";

import { useState } from "react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";

import CustomerLookup, {
  emptyCustomerLookupValues,
  resolveCustomerLookupRecord,
  type CustomerLookupValues,
} from "@/components/forms/CustomerLookup";

import ActionItemQuickAdd from "@/components/forms/ActionItemQuickAdd";

import type { RepairOrder, RepairOrderActionItem } from "../../../types/repair-orders";
import type { Truck } from "../../../types/truck-stock";
import type { TechnicianProfile } from "../../../types/technician-profile";

import { createRepairOrder } from "../../../services/repair-orders";
import { getTrucks } from "../../../services/truck-stock";
import { getActiveTechnicianProfiles } from "../../../services/technician-profiles";

const QBIT_SCOPE = "create-ro-modal";

type Props = {
  onClose: () => void;
  onCreated: (repairOrder: RepairOrder) => void;
};

export default function CreateROModal({ onClose, onCreated }: Props) {
  const trucks = getTrucks();

  const technicians = getActiveTechnicianProfiles().filter(
    (technician) =>
      technician.role === "Technician" || technician.role === "Inspector"
  );

  const [customerValue, setCustomerValue] = useState<CustomerLookupValues>(
    emptyCustomerLookupValues
  );
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(
    null
  );

  const [actionItems, setActionItems] = useState<RepairOrderActionItem[]>([]);
  const [isAddingLine, setIsAddingLine] = useState(false);

  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState("");

  function ensureCustomerId(): string {
    if (matchedCustomerId) {
      return matchedCustomerId;
    }

    const newCustomer = resolveCustomerLookupRecord(customerValue, null);

    setMatchedCustomerId(newCustomer.id);

    return newCustomer.id;
  }

  function handleStartAddingLine() {
    if (!customerValue.name.trim()) {
      alert("Enter a customer before adding a line.");
      return;
    }

    ensureCustomerId();
    setIsAddingLine(true);
  }

  function handleAddActionItem(actionItem: RepairOrderActionItem) {
    setActionItems((current) => [...current, actionItem]);
    setIsAddingLine(false);
  }

  function handleRemoveActionItem(actionItemId: string) {
    setActionItems((current) =>
      current.filter((actionItem) => actionItem.id !== actionItemId)
    );
  }

  function handleCreate() {
    if (!customerValue.name.trim()) {
      alert("Customer is required.");
      return;
    }

    if (actionItems.length === 0) {
      alert("Add at least one action item (line) before creating the RO.");
      return;
    }

    const customerId = ensureCustomerId();

    const selectedTechnician =
      technicians.find(
        (technician: TechnicianProfile) => technician.id === selectedTechnicianId
      ) ?? null;

    const selectedTruck =
      trucks.find((truck: Truck) => truck.id === selectedTruckId) ?? null;

    const firstLine = actionItems[0];

    const repairOrder = createRepairOrder({
      customerId,
      customerName: customerValue.name.trim(),

      equipmentId: firstLine.equipmentId,
      equipmentName: firstLine.equipmentSnapshot?.equipmentName,
      equipmentDescription: firstLine.equipmentSnapshot?.equipmentDescription,
      equipmentSnapshot: firstLine.equipmentSnapshot,

      assignedUserId: selectedTechnician?.userId ?? "",
      assignedUserName: selectedTechnician?.displayName ?? "",

      assignedTechnicianId: selectedTechnician?.id ?? "",
      assignedTechnicianName: selectedTechnician?.displayName ?? "",

      assignedEmployeeProfileId: selectedTechnician?.id ?? "",
      assignedEmployeeDisplayName: selectedTechnician?.displayName ?? "",
      assignedEmployeeRole: selectedTechnician?.role ?? "",

      assignedTruckId: selectedTruck?.id ?? "",
      assignedTruckName: selectedTruck?.name ?? "",

      complaint: actionItems
        .map((actionItem) => actionItem.title)
        .join("; "),
      customerConcern: firstLine.description ?? "",

      diagnosis: "",
      initialFindings: "",

      resolution: "",
      workPerformed: "",

      recommendations: "",
      notes: "",

      actionItems,

      status: "Open",
      priority: "Normal",

      scheduledDate: "",
      dispatchedDate: "",
      completedDate: "",
      invoicedDate: "",
      closedDate: "",
      cancelledDate: "",
    });

    onCreated(repairOrder);
    onClose();
  }

  return (
    <Modal
      qbitId="create-ro-modal"
      qbitScope={QBIT_SCOPE}
      title="Create Repair Order"
      onClose={onClose}
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        <div>
          <div
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-ro-customer-heading"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mb-2 text-lg font-bold"
          >
            Customer
          </div>

          <CustomerLookup
            qbitId="create-ro-customer"
            qbitScope={QBIT_SCOPE}
            theme="light"
            value={customerValue}
            onChange={setCustomerValue}
            matchedCustomerId={matchedCustomerId}
            onMatchedCustomerIdChange={setMatchedCustomerId}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-ro-lines-heading"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-lg font-bold"
            >
              Action Items (Lines)
            </div>

            {!isAddingLine && (
              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="create-ro-add-line"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={handleStartAddingLine}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                + Add Line
              </button>
            )}
          </div>

          {actionItems.length === 0 && !isAddingLine && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="tile"
              data-t1eq-qbit-id="create-ro-lines-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-xl border border-dashed border-black/10 bg-zinc-50 p-6 text-center text-sm text-black/50"
            >
              No lines added yet.
            </div>
          )}

          {actionItems.length > 0 && (
            <div className="space-y-2">
              {actionItems.map((actionItem) => (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id={`create-ro-line-${actionItem.id}`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  key={actionItem.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {actionItem.title}
                    </div>

                    {actionItem.description && (
                      <div className="text-xs text-black/50">
                        {actionItem.description}
                      </div>
                    )}
                  </div>

                  <button data-t1eq-action-button="true"
                    data-t1eq-qbit-type="action-button"
                    data-t1eq-qbit-id={`create-ro-line-${actionItem.id}-remove`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="button"
                    onClick={() => handleRemoveActionItem(actionItem.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {isAddingLine && (
            <div className="mt-3">
              <ActionItemQuickAdd
                qbitId="create-ro-line-form"
                qbitScope={QBIT_SCOPE}
                theme="light"
                customer={{
                  id: matchedCustomerId ?? undefined,
                  name: customerValue.name,
                }}
                onAdd={handleAddActionItem}
                onCancel={() => setIsAddingLine(false)}
              />
            </div>
          )}
        </div>

        <div>
          <label
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-ro-technician-label"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mb-1 block font-medium"
          >
            Assigned Technician / Inspector
          </label>

          <select data-t1eq-field="true"
            data-t1eq-qbit-type="field"
            data-t1eq-qbit-id="create-ro-technician"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            value={selectedTechnicianId}
            onChange={(event) => setSelectedTechnicianId(event.target.value)}
            className="w-full rounded-xl border p-3"
          >
            <option value="">Unassigned</option>

            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.displayName}
                {technician.employeeNumber
                  ? ` — ${technician.employeeNumber}`
                  : ""}
                {technician.role ? ` — ${technician.role}` : ""}
              </option>
            ))}
          </select>

          {technicians.length === 0 && (
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="create-ro-technician-empty-note"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-sm text-black/60"
            >
              No active technicians or inspectors found. Add employees in
              Employee Setup first, or assign the technician later from the
              repair order workspace.
            </p>
          )}
        </div>

        <div>
          <label
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="create-ro-truck-label"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mb-1 block font-medium"
          >
            Assigned Truck
          </label>

          <select data-t1eq-field="true"
            data-t1eq-qbit-type="field"
            data-t1eq-qbit-id="create-ro-truck"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            value={selectedTruckId}
            onChange={(event) => setSelectedTruckId(event.target.value)}
            className="w-full rounded-xl border p-3"
          >
            <option value="">Unassigned</option>

            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.truckNumber} — {truck.name}
                {truck.assignedTechnicianName
                  ? ` — ${truck.assignedTechnicianName}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id="create-ro-info-note"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">
          Each line captures its own equipment, customer request category, and
          parts/labor/travel/misc estimate. Parts added later during work will
          use truck stock first, then fall back to warehouse inventory.
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            qbitId="create-ro-cancel"
            qbitScope={QBIT_SCOPE}
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            qbitId="create-ro-submit"
            qbitScope={QBIT_SCOPE}
            onClick={handleCreate}
          >
            Create RO
          </Button>
        </div>
      </div>
    </Modal>
  );
}
