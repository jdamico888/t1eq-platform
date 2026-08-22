"use client";

import type {
  SelectHTMLAttributes,
} from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps =
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "onChange"
  > & {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
  };

export default function Select({
  value,
  options,
  onChange,
  className = "",
  disabled,
  ...props
}: SelectProps) {
  return (
    <select data-t1eq-field="true"
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className={`
        w-full
        rounded-xl
        border
        border-black/10
        bg-white/25
        p-3
        text-black
        outline-none
        transition-all
        duration-200
        focus:bg-white/35
        focus:border-black/30
        focus:ring-2
        focus:ring-black/10
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-black"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}