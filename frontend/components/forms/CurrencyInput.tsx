"use client";

type CurrencyInputProps = {
  label?: string;

  value?: number;

  onChange: (
    value: number
  ) => void;

  placeholder?: string;
};

export default function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0.00",
}: CurrencyInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          $
        </div>

        <input data-t1eq-field="true"
          type="number"
          step="0.01"
          min="0"
          value={
            typeof value ===
            "number"
              ? value
              : ""
          }
          placeholder={
            placeholder
          }
          onChange={(
            event
          ) =>
            onChange(
              Number(
                event.target
                  .value
              ) || 0
            )
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-8 pr-4 outline-none transition focus:border-cyan-500"
        />
      </div>
    </div>
  );
}