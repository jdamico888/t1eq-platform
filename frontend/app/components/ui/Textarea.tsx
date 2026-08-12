"use client";

import type {
  TextareaHTMLAttributes,
} from "react";

type TextareaProps =
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange"
  > & {
    value: string;
    onChange: (value: string) => void;
  };

export default function Textarea({
  value,
  onChange,
  placeholder = "",
  rows = 4,
  className = "",
  disabled,
  ...props
}: TextareaProps) {
  return (
    <textarea
      value={value}
      rows={rows}
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