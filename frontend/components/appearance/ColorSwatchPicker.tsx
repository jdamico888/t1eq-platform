"use client";

import { useRef } from "react";

export type ColorSwatch = {
  name: string;
  hex: string;
};

export const DEFAULT_COLOR_SWATCHES: ColorSwatch[] = [
  { name: "Black", hex: "#000000" },
  { name: "Charcoal", hex: "#27272a" },
  { name: "Slate", hex: "#334155" },
  { name: "Zinc Gray", hex: "#71717a" },
  { name: "Light Gray", hex: "#d4d4d8" },
  { name: "White", hex: "#ffffff" },
  { name: "Tier One Orange", hex: "#e26209" },
  { name: "Red", hex: "#dc2626" },
  { name: "Amber", hex: "#d97706" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#16a34a" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Pink", hex: "#db2777" },
];

type ColorSwatchPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  swatches?: ColorSwatch[];
};

function normalizeHex(hexValue: string) {
  return hexValue.trim().toLowerCase();
}

export default function ColorSwatchPicker({
  value,
  onChange,
  swatches = DEFAULT_COLOR_SWATCHES,
}: ColorSwatchPickerProps) {
  const customInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedValue = normalizeHex(value || "");
  const matchesPreset = swatches.some(
    (swatch) => normalizeHex(swatch.hex) === normalizedValue
  );

  const nativeColorInputValue = /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : "#000000";

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {swatches.map((swatch) => {
        const isSelected = normalizeHex(swatch.hex) === normalizedValue;

        return (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.name}
            aria-label={swatch.name}
            aria-pressed={isSelected}
            onClick={() => onChange(swatch.hex)}
            className={`h-7 w-7 shrink-0 rounded-md border-2 transition ${
              isSelected
                ? "border-black ring-2 ring-black/30 ring-offset-1"
                : "border-zinc-300 hover:border-zinc-500"
            }`}
            style={{ backgroundColor: swatch.hex }}
          />
        );
      })}

      <button
        type="button"
        title={matchesPreset ? "Custom color" : `Custom color: ${value}`}
        aria-label="Custom color"
        aria-pressed={!matchesPreset}
        onClick={() => customInputRef.current?.click()}
        className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-md border-2 transition ${
          !matchesPreset
            ? "border-black ring-2 ring-black/30 ring-offset-1"
            : "border-zinc-300 hover:border-zinc-500"
        }`}
        style={
          matchesPreset
            ? {
                backgroundImage:
                  "conic-gradient(from 90deg, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)",
              }
            : { backgroundColor: value }
        }
      >
        <input
          ref={customInputRef}
          type="color"
          value={nativeColorInputValue}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-hidden="true"
          tabIndex={-1}
        />
      </button>
    </div>
  );
}
