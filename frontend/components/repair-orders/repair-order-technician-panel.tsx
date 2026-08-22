"use client";

import { useEffect, useState } from "react";

import type { RepairOrder } from "@/types/repair-orders";
import type { Truck } from "@/types/truck-stock";

import { getTrucks } from "@/services/truck-stock";

type RepairOrderTechnicianPanelProps = {
  repairOrder: RepairOrder;
  onTruckChange?: (truck: Truck | null) => void;
};

export default function RepairOrderTechnicianPanel({
  repairOrder,
  onTruckChange,
}: RepairOrderTechnicianPanelProps) {
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    setTrucks(getTrucks());
  }, []);

  function handleTruckChange(truckId: string) {
    if (!onTruckChange) return;

    const selectedTruck =
      trucks.find((truck) => truck.id === truckId) ?? null;

    onTruckChange(selectedTruck);
  }

  return (
    <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Truck Assignment</h2>

        <p className="mt-1 text-sm text-white/60">
          Truck stock assignment, dispatch readiness, and field-service status
          for this repair order. Technician assignment now lives in the
          Employee Setup panel below.
        </p>
      </div>

      {onTruckChange && (
        <div className="mb-4 max-w-md">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">
            Assigned Truck
          </label>

          <select data-t1eq-field="true"
            value={repairOrder.assignedTruckId ?? ""}
            onChange={(event) => handleTruckChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
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
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Assigned Technician
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {repairOrder.assignedTechnicianName || "Unassigned"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Assigned Truck
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {repairOrder.assignedTruckName || "Unassigned"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Scheduled Date
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {repairOrder.scheduledDate || "Not Scheduled"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Dispatch Date
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {repairOrder.dispatchedDate || "Not Dispatched"}
          </div>
        </div>
      </div>

      <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-wide text-white/50">
          Field Status
        </div>

        <div className="mt-2 text-sm leading-6 text-white/70">
          {repairOrder.assignedTechnicianName && repairOrder.assignedTruckName
            ? `${repairOrder.assignedTechnicianName} is assigned with ${repairOrder.assignedTruckName}.`
            : repairOrder.assignedTechnicianName
              ? `${repairOrder.assignedTechnicianName} is assigned, but no truck has been assigned yet.`
              : repairOrder.assignedTruckName
                ? `${repairOrder.assignedTruckName} is assigned, but no technician has been assigned yet.`
                : "No technician or truck has been assigned yet."}
        </div>
      </div>
    </section>
  );
}