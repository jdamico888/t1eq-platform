"use client";

import { useMemo } from "react";

import FormAutocomplete from "@/components/forms/FormAutocomplete";

import { getTechnicians } from "@/services/technicians";

type TechnicianSelectorProps = {
  value?: string;

  onChange: (value: string) => void;

  label?: string;
};

export default function TechnicianSelector({
  value = "",
  onChange,
  label = "Technician",
}: TechnicianSelectorProps) {
  const technicians =
    getTechnicians();

  const technicianNames =
    useMemo(() => {
      return technicians
        .map(
          (technician) =>
            `${technician.firstName} ${technician.lastName}`
        )
        .sort();
    }, [technicians]);

  return (
    <FormAutocomplete
      label={label}
      value={value}
      options={technicianNames}
      placeholder="Select or search technician..."
      onChange={onChange}
    />
  );
}