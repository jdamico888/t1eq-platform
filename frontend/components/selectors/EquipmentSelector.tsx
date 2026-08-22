"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getEquipment,
  type Equipment,
} from "@/services/equipment";

type EquipmentSelectorProps = {
  customerId?: string;
  siteId?: string;
  value?: string;
  onSelect: (equipment: Equipment) => void;
  placeholder?: string;
};

export default function EquipmentSelector({
  customerId,
  siteId,
  value,
  onSelect,
  placeholder = "Search equipment...",
}: EquipmentSelectorProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let filteredEquipment = getEquipment();

    if (customerId) {
      filteredEquipment = filteredEquipment.filter(
        (item) => item.customerId === customerId
      );
    }

    if (siteId) {
      filteredEquipment = filteredEquipment.filter(
        (item) => item.siteId === siteId
      );
    }

    setEquipment(filteredEquipment);
  }, [customerId, siteId]);

  const filteredEquipment = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return equipment;

    return equipment.filter((item) => {
      return (
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.manufacturer.toLowerCase().includes(normalizedSearch) ||
        Boolean(item.model?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(
          item.serialNumber
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) ||
        item.customerName
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [equipment, search]);

  function buildEquipmentLabel(item: Equipment) {
    return [
      item.manufacturer,
      item.model,
      item.serialNumber,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  function handleSelect(item: Equipment) {
    setSearch(buildEquipmentLabel(item));
    setIsOpen(false);
    onSelect(item);
  }

  return (
    <div className="relative">
      <input data-t1eq-field="true"
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        placeholder={placeholder}
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {filteredEquipment.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">
              No equipment found.
            </div>
          )}

          {filteredEquipment.map((item) => (
            <button data-t1eq-action-button="true"
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <div className="font-medium">
                {buildEquipmentLabel(item)}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {item.customerName}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.category}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}