"use client";

type EmailInputProps = {
  label?: string;

  value?: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;

  required?: boolean;
};

export default function EmailInput({
  label,
  value = "",
  onChange,
  placeholder = "email@example.com",
  required = false,
}: EmailInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input
        type="email"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}