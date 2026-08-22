"use client";

import { useMemo, useState } from "react";

type FormAutocompleteProps = {
  label?: string;

  value?: string;

  options: string[];

  placeholder?: string;

  onChange: (value: string) => void;

  qbitId?: string;
  qbitScope?: string;
};

function slugifyOption(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FormAutocomplete({
  label,
  value = "",
  options,
  placeholder,
  onChange,
  qbitId,
  qbitScope = "global",
}: FormAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return options.slice(0, 25);
    }

    return options
      .filter((option) =>
        option.toLowerCase().includes(normalizedValue)
      )
      .slice(0, 25);
  }, [options, value]);

  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={
        qbitId ? `${qbitId}-wrapper` : undefined
      }
      data-t1eq-qbit-scope={
        qbitId ? qbitScope : undefined
      }
      className="relative"
    >
      {label && (
        <label
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={
            qbitId ? `${qbitId}-label` : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="mb-2 block text-sm text-slate-300"
        >
          {label}
        </label>
      )}

      <input
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
          }, 150);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && filteredOptions.length > 0 && (
        <div
          data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id={
            qbitId ? `${qbitId}-dropdown` : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        >
          {filteredOptions.map((option, index) => {
            const optionSlug =
              slugifyOption(option) || `option-${index + 1}`;

            return (
              <button
                key={option}
                type="button"
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id={
                  qbitId
                    ? `${qbitId}-option-${optionSlug}`
                    : undefined
                }
                data-t1eq-qbit-scope={
                  qbitId ? qbitScope : undefined
                }
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="block w-full border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/10"
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}