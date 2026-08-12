"use client";

import FormSelect from "@/components/forms/FormSelect";

type StatusSelectorProps = {
  value?: string;

  options: string[];

  onChange: (value: string) => void;

  label?: string;

  placeholder?: string;
};

export default function StatusSelector({
  value = "",
  options,
  onChange,
  label = "Status",
  placeholder = "Select status...",
}: StatusSelectorProps) {
  return (
    <FormSelect
      name="status"
      label={label}
      value={value}
      placeholder={placeholder}
      options={options.map(
        (option) => ({
          label: option,
          value: option,
        })
      )}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
    />
  );
}