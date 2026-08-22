"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

type FormInputProps = {
  label?: ReactNode;

  qbitId?: string;
  qbitScope?: string;

  className?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
>;

export default function FormInput({
  label,
  qbitId,
  qbitScope = "global",
  className = "",
  ...inputProps
}: FormInputProps) {
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

      <input
        {...inputProps}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={
          qbitId || undefined
        }
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 ${className}`}
      />
    </label>
  );
}