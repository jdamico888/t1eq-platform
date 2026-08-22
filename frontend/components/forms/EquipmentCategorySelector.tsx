"use client";

import FormAutocomplete from "./FormAutocomplete";

const EQUIPMENT_CATEGORIES = [
  "Lift",
  "Tire Changer",
  "Wheel Balancer",
  "A/C Machine",
  "Compressor",
  "Alignment Machine",
  "Brake Lathe",
  "Shop Equipment",
  "Other",
] as const;

type EquipmentCategorySelectorProps = {
  value: string;
  onChange: (value: string) => void;

  label?: string;
  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function EquipmentCategorySelector({
  value,
  onChange,
  label = "Equipment Category",
  placeholder = "Select or enter equipment category",
  qbitId,
  qbitScope = "global",
}: EquipmentCategorySelectorProps) {
  return (
    <FormAutocomplete
      label={label}
      value={value}
      onChange={onChange}
      options={[...EQUIPMENT_CATEGORIES]}
      placeholder={placeholder}
      qbitId={qbitId}
      qbitScope={qbitScope}
    />
  );
}