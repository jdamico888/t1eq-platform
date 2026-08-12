"use client";

import FormSelect from "@/components/forms/FormSelect";

type YesNoSelectorProps = {
  value?: boolean;

  onChange: (
    value: boolean
  ) => void;

  label?: string;
};

export default function YesNoSelector({
  value,
  onChange,
  label = "Selection",
}: YesNoSelectorProps) {
  return (
    <FormSelect
      name="yes-no"
      label={label}
      value={
        typeof value ===
        "boolean"
          ? value
            ? "yes"
            : "no"
          : ""
      }
      placeholder="Select..."
      options={[
        {
          label: "Yes",
          value: "yes",
        },

        {
          label: "No",
          value: "no",
        },
      ]}
      onChange={(event) =>
        onChange(
          event.target.value ===
            "yes"
        )
      }
    />
  );
}