"use client";

import { useMemo } from "react";

import FormAutocomplete from "@/components/forms/FormAutocomplete";

import { getEquipment } from "@/services/equipment";

type EquipmentSelectorProps = {
  value?: string;

  customerName?: string;

  siteName?: string;

  onChange: (value: string) => void;

  label?: string;
};

export default function EquipmentSelector({
  value = "",
  customerName,
  siteName,
  onChange,
  label = "Equipment",
}: EquipmentSelectorProps) {
  const equipment =
    getEquipment();

  const equipmentNames =
    useMemo(() => {
      return equipment
        .filter((item) => {
          if (
            customerName &&
            item.customerName !==
              customerName
          ) {
            return false;
          }

          if (
            siteName &&
            item.siteName !==
              siteName
          ) {
            return false;
          }

          return true;
        })
        .map((item) => {
          return `${item.manufacturer} ${
            item.model || ""
          }`.trim();
        })
        .sort();
    }, [
      equipment,
      customerName,
      siteName,
    ]);

  return (
    <FormAutocomplete
      label={label}
      value={value}
      options={equipmentNames}
      placeholder="Select or search equipment..."
      onChange={onChange}
    />
  );
}