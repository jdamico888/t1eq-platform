"use client";

import { useEffect, useState } from "react";

import type { RepairOrder } from "@/types/repair-orders";
import type { User } from "@/types/user";

import { getUserFullName, getUsersByRole } from "@/services/users";

type RepairOrderTechnicianSelectorProps = {
  repairOrder: RepairOrder;
  onTechnicianChange: (technician: User | null) => void;
};

export default function RepairOrderTechnicianSelector({
  repairOrder,
  onTechnicianChange,
}: RepairOrderTechnicianSelectorProps) {
  const [technicians, setTechnicians] = useState<User[]>([]);

  useEffect(() => {
    setTechnicians(getUsersByRole("Technician"));
  }, []);

  function handleTechnicianChange(technicianId: string) {
    if (!technicianId) {
      onTechnicianChange(null);
      return;
    }

    const selectedTechnician =
      technicians.find((technician) => technician.id === technicianId) ?? null;

    onTechnicianChange(selectedTechnician);
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Assigned Technician
      </label>

      <select
        value={repairOrder.assignedTechnicianId ?? ""}
        onChange={(event) => handleTechnicianChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-blue-400/60"
      >
        <option value="" className="bg-slate-950">
          Unassigned
        </option>

        {technicians.map((technician) => (
          <option
            key={technician.id}
            value={technician.id}
            className="bg-slate-950"
          >
            {getUserFullName(technician)}
          </option>
        ))}
      </select>
    </div>
  );
}