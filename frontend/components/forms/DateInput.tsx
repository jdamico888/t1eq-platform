"use client";

type DateInputProps = {
  label?: string;

  value?: string;

  onChange: (
    value: string
  ) => void;

  required?: boolean;
};

export default function DateInput({
  label,
  value = "",
  onChange,
  required = false,
}: DateInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input data-t1eq-field="true"
        type="date"
        value={value}
        required={required}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}