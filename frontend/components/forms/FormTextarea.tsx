"use client";

import type {
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type FormTextareaProps = {
  label?: ReactNode;

  qbitId?: string;
  qbitScope?: string;

  className?: string;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
>;

export default function FormTextarea({
  label,
  qbitId,
  qbitScope = "global",
  className = "",
  ...textareaProps
}: FormTextareaProps) {
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

      <textarea
        {...textareaProps}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={
          qbitId || undefined
        }
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`min-h-[120px] w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 ${className}`}
      />
    </label>
  );
}