"use client";

import FormAutocomplete from "./FormAutocomplete";

const MANUFACTURERS = [
  "Challenger",
  "Rotary",
  "BendPak",
  "Forward Lift",
  "Snap-on",
  "Hofmann",
  "John Bean",
  "Robinair",
  "Mahle",
  "Ranger",
  "Coats",
  "Hunter",
  "Atlas",
  "Other",
] as const;

type ManufacturerSelectorProps = {
  value: string;
  onChange: (value: string) => void;

  label?: string;
  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;
};

export default function ManufacturerSelector({
  value,
  onChange,
  label = "Manufacturer",
  placeholder = "Select or enter manufacturer",
  qbitId,
  qbitScope = "global",
}: ManufacturerSelectorProps) {
  return (
    <FormAutocomplete
      label={label}
      value={value}
      onChange={onChange}
      options={[...MANUFACTURERS]}
      placeholder={placeholder}
      qbitId={qbitId}
      qbitScope={qbitScope}
    />
  );
}