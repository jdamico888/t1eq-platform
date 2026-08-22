"use client";

type NumberInputProps = {
  label?: string;

  value?: number;

  onChange: (
    value: number
  ) => void;

  placeholder?: string;

  min?: number;

  max?: number;

  step?: number;
};

export default function NumberInput({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
}: NumberInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input data-t1eq-field="true"
        type="number"
        value={
          typeof value ===
          "number"
            ? value
            : ""
        }
        placeholder={
          placeholder
        }
        min={min}
        max={max}
        step={step}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            ) || 0
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}