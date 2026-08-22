"use client";

import type { ChangeEvent } from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;

  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;

  className?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  qbitId,
  qbitScope = "global",
  className = "",
}: SearchInputProps) {
  function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    onChange(event.target.value);
  }

  return (
    <div
      data-t1eq-qbit-type={
        qbitId ? "section" : undefined
      }
      data-t1eq-qbit-id={
        qbitId
          ? `${qbitId}-wrapper`
          : undefined
      }
      data-t1eq-qbit-scope={
        qbitId ? qbitScope : undefined
      }
      className="relative"
    >
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={
          qbitId || undefined
        }
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/40 focus:border-cyan-500 ${className}`}
      />
    </div>
  );
}