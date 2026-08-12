"use client";

import { useMemo } from "react";

import FormAutocomplete from "@/components/forms/FormAutocomplete";

import { getCustomers } from "@/services/customers";

type CustomerSelectorProps = {
  value?: string;

  onChange: (value: string) => void;

  label?: string;
};

export default function CustomerSelector({
  value = "",
  onChange,
  label = "Customer",
}: CustomerSelectorProps) {
  const customers =
    getCustomers();

  const customerNames =
    useMemo(() => {
      return customers
        .map(
          (customer) =>
            customer.name
        )
        .sort();
    }, [customers]);

  return (
    <FormAutocomplete
      label={label}
      value={value}
      options={customerNames}
      placeholder="Select or search customer..."
      onChange={onChange}
    />
  );
}