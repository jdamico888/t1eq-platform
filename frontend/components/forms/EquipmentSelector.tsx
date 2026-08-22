"use client";

import { useEffect, useMemo, useState } from "react";

import { getEquipment } from "@/services/equipment";

type EquipmentOption = {
  id: string;
  customerName: string;
  siteName?: string;
  manufacturer: string;
  model?: string;
  serialNumber?: string;
};

type EquipmentSelectorProps = {
  value: string;
  onChange: (value: string) => void;

  customerName?: string;
  siteName?: string;

  label?: string;
  placeholder?: string;

  qbitId?: string;

  disabled?: boolean;
  required?: boolean;

  className?: string;
};

export default function EquipmentSelector({
  value,
  onChange,
  customerName = "",
  siteName = "",
  label = "Equipment",
  placeholder = "Select Equipment",
  qbitId,
  disabled = false,
  required = false,
  className = "",
}: EquipmentSelectorProps) {
  const [equipment, setEquipment] = useState<EquipmentOption[]>([]);

  useEffect(() => {
    const equipmentRecords = getEquipment();

    setEquipment(
      equipmentRecords.map((item) => ({
        id: item.id,
        customerName: item.customerName,
        siteName: item.siteName || "",
        manufacturer: item.manufacturer,
        model: item.model || "",
        serialNumber: item.serialNumber || "",
      }))
    );
  }, []);

  const availableEquipment = useMemo(() => {
    const normalizedCustomerName = customerName.trim().toLowerCase();
    const normalizedSiteName = siteName.trim().toLowerCase();

    return equipment
      .filter((item) => {
        if (
          normalizedCustomerName &&
          item.customerName.trim().toLowerCase() !== normalizedCustomerName
        ) {
          return false;
        }

        if (
          normalizedSiteName &&
          (item.siteName || "").trim().toLowerCase() !== normalizedSiteName
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aLabel = `${a.manufacturer} ${a.model || ""}`.trim();
        const bLabel = `${b.manufacturer} ${b.model || ""}`.trim();

        return aLabel.localeCompare(bLabel);
      });
  }, [equipment, customerName, siteName]);

  return (
    <label
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      className="block"
    >
      {label && (
        <span
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined}
          className="mb-1 block text-sm font-medium"
        >
          {label}
        </span>
      )}

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <option value="">{placeholder}</option>

        {availableEquipment.map((item) => {
          const equipmentName = `${item.manufacturer} ${item.model || ""}`.trim();

          const detailParts = [
            item.serialNumber ? `SN ${item.serialNumber}` : "",
            item.siteName || "",
          ].filter(Boolean);

          const labelText =
            detailParts.length > 0
              ? `${equipmentName} — ${detailParts.join(" — ")}`
              : equipmentName;

          return (
            <option key={item.id} value={equipmentName}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}