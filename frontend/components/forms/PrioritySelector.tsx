"use client";

import FormSelect from "@/components/forms/FormSelect";

const PRIORITIES = [
  "Low",
  "Normal",
  "High",
  "Critical",
];

type PrioritySelectorProps =
  {
    value?: string;

    onChange: (
      value: string
    ) => void;

    label?: string;
  };

export default function PrioritySelector({
  value = "",
  onChange,
  label = "Priority",
}: PrioritySelectorProps) {
  return (
    <FormSelect
      name="priority"
      label={label}
      value={value}
      placeholder="Select priority..."
      options={PRIORITIES.map(
        (priority) => ({
          label: priority,
          value: priority,
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