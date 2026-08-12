"use client";

import { useMemo, useState } from "react";

type FormAutocompleteProps = {
  label?: string;

  value?: string;

  options: string[];

  placeholder?: string;

  onChange: (value: string) => void;
};

export default function FormAutocomplete({
  label,
  value = "",
  options,
  placeholder,
  onChange,
}: FormAutocompleteProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const filteredOptions =
    useMemo(() => {
      const normalizedValue =
        value
          .trim()
          .toLowerCase();

      if (!normalizedValue)
        return options.slice(
          0,
          25
        );

      return options
        .filter((option) =>
          option
            .toLowerCase()
            .includes(
              normalizedValue
            )
        )
        .slice(0, 25);
    }, [options, value]);

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        value={value}
        placeholder={placeholder}
        onFocus={() =>
          setIsOpen(true)
        }
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
          }, 150);
        }}
        onChange={(event) => {
          onChange(
            event.target.value
          );

          setIsOpen(true);
        }}
      />

      {isOpen &&
        filteredOptions.length >
          0 && (
          <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            {filteredOptions.map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(
                      option
                    );

                    setIsOpen(
                      false
                    );
                  }}
                  className="block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  {option}
                </button>
              )
            )}
          </div>
        )}
    </div>
  );
}