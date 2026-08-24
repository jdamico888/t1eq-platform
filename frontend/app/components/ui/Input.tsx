"use client";

import type {
  InputHTMLAttributes,
} from "react";

type InputProps =
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange"
  > & {
    value: string | number;
    onChange: (value: string) => void;

    qbitId?: string;
    qbitScope?: string;
  };

export default function Input({
  value,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
  disabled,
  qbitId,
  qbitScope = "global",
  ...props
}: InputProps) {
  return (
    <input data-t1eq-field="true"
      data-t1eq-qbit-type={qbitId ? "field" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
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
        placeholder:text-black/40
        focus:bg-white/35
        focus:border-black/30
        focus:ring-2
        focus:ring-black/10
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}