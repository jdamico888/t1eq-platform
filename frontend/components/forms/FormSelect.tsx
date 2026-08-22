"use client";

import type {
  ReactNode,
  SelectHTMLAttributes,
} from "react";

type SelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = {
  label?: ReactNode;

  options: SelectOption[];

  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;

  className?: string;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
>;

export default function FormSelect({
  label,
  options,
  placeholder,
  qbitId,
  qbitScope = "global",
  className = "",
  ...selectProps
}: FormSelectProps) {
  return (
    <label
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={
        qbitId ? `${qbitId}-wrapper` : undefined
      }
      data-t1eq-qbit-scope={
        qbitId ? qbitScope : undefined
      }
      className="block"
    >
      {label && (
        <span
          data-t1eq-qbit-type={
            qbitId ? "text" : undefined
          }
          data-t1eq-qbit-id={
            qbitId ? `${qbitId}-label` : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="mb-1 block text-sm font-medium"
        >
          {label}
        </span>
      )}

      <select
        {...selectProps}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}