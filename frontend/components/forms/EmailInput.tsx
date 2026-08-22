"use client";

import type { ChangeEvent } from "react";

type EmailInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;

  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;

  className?: string;

  required?: boolean;
  disabled?: boolean;
};

export default function EmailInput({
  label = "Email",
  value,
  onChange,
  placeholder = "name@example.com",
  qbitId,
  qbitScope = "global",
  className = "",
  required = false,
  disabled = false,
}: EmailInputProps) {
  function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    onChange(event.target.value);
  }

  return (
    <label
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
      className="block"
    >
      {label && (
        <span
          data-t1eq-qbit-type={
            qbitId ? "text" : undefined
          }
          data-t1eq-qbit-id={
            qbitId
              ? `${qbitId}-label`
              : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="mb-1 block text-sm font-medium"
        >
          {label}
        </span>
      )}

      <input
        type="email"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={
          qbitId || undefined
        }
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition placeholder:text-black/40 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
    </label>
  );
}