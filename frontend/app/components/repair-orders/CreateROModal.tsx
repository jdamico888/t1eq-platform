"use client";

import { useState } from "react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";

import type { Equipment } from "../../../types/equipment";
import type { RepairOrder } from "../../../types/repair-orders";
import type { Truck } from "../../../types/truck-stock";
import type { TechnicianProfile } from "../../../types/technician-profile";

import { getEquipment } from "../../../services/equipment";
import { createRepairOrder } from "../../../services/repair-orders";
import { getTrucks } from "../../../services/truck-stock";
import { getActiveTechnicianProfiles } from "../../../services/technician-profiles";

type Props = {
  onClose: () => void;
  onCreated: (repairOrder: RepairOrder) => void;
};

export default function CreateROModal({ onClose, onCreated }: Props) {
  const equipment = getEquipment();
  const trucks = getTrucks();

  const technicians = getActiveTechnicianProfiles().filter(
    (technician) =>
      technician.role === "Technician" || technician.role === "Inspector"
  );

  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState("");

  function handleCreate() {
    const selectedEquipment = equipment.find(
      (item: Equipment) => item.id === selectedEquipmentId
    );

    if (!selectedEquipment) {
      return;
    }

    const selectedTechnician =
      technicians.find(
        (technician: TechnicianProfile) => technician.id === selectedTechnicianId
      ) ?? null;

    const selectedTruck =
      trucks.find((truck: Truck) => truck.id === selectedTruckId) ?? null;

    const repairOrder = createRepairOrder({
      customerId: selectedEquipment.customerId,
      customerName: selectedEquipment.customerName,

      siteId: selectedEquipment.siteId ?? "",
      siteName: selectedEquipment.siteName ?? "",

      equipmentId: selectedEquipment.id,
      equipmentName: `${selectedEquipment.manufacturer} ${selectedEquipment.model}`,
      equipmentDescription: selectedEquipment.serialNumber,

      assignedUserId: selectedTechnician?.userId ?? "",
      assignedUserName: selectedTechnician?.displayName ?? "",

      assignedTechnicianId: selectedTechnician?.id ?? "",
      assignedTechnicianName: selectedTechnician?.displayName ?? "",

      assignedEmployeeProfileId: selectedTechnician?.id ?? "",
      assignedEmployeeDisplayName: selectedTechnician?.displayName ?? "",
      assignedEmployeeRole: selectedTechnician?.role ?? "",

      assignedTruckId: selectedTruck?.id ?? "",
      assignedTruckName: selectedTruck?.name ?? "",

      complaint: "",
      customerConcern: "Created from equipment record",

      diagnosis: "",
      initialFindings: "",

      resolution: "",
      workPerformed: "",

      recommendations: "",
      notes: "",

      actionItems: [],

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
    <Modal title="Create Repair Order" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block font-medium">
            Equipment
          </label>

          <select data-t1eq-field="true"
            value={selectedEquipmentId}
            onChange={(event) => setSelectedEquipmentId(event.target.value)}
            className="w-full rounded-xl border p-3"
          >
            <option value="">Select Equipment</option>

            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.customerName} — {item.manufacturer} {item.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium">
            Assigned Technician / Inspector
          </label>

          <select data-t1eq-field="true"
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
            <p className="mt-2 text-sm text-black/60">
              No active technicians or inspectors found. Add employees in
              Employee Setup first, or assign the technician later from the
              repair order workspace.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block font-medium">
            Assigned Truck
          </label>

          <select data-t1eq-field="true"
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

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/70">
          Repair orders can now be created with assigned equipment, technician,
          and truck. Parts added later will use truck stock first, then fall
          back to warehouse inventory.
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleCreate}>
            Create RO
          </Button>
        </div>
      </div>
    </Modal>
  );
}