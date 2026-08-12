"use client";

import { useMemo } from "react";

import FormAutocomplete from "@/components/forms/FormAutocomplete";

import { getSuppliers } from "@/services/suppliers";

type SupplierSelectorProps = {
  value?: string;

  onChange: (value: string) => void;

  label?: string;
};

export default function SupplierSelector({
  value = "",
  onChange,
  label = "Supplier",
}: SupplierSelectorProps) {
  const suppliers =
    getSuppliers();

  const supplierNames =
    useMemo(() => {
      return suppliers
        .map(
          (supplier) =>
            supplier.name
        )
        .sort();
    }, [suppliers]);

  return (
    <FormAutocomplete
      label={label}
      value={value}
      options={supplierNames}
      placeholder="Select or search supplier..."
      onChange={onChange}
    />
  );
}