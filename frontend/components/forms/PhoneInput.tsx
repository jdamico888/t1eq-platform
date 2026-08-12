"use client";

type PhoneInputProps = {
  label?: string;

  value?: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
};

function formatPhone(
  value: string
): string {
  const digits =
    value.replace(/\D/g, "");

  if (digits.length <= 3)
    return digits;

  if (digits.length <= 6) {
    return `(${digits.slice(
      0,
      3
    )}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(
    0,
    3
  )}) ${digits.slice(
    3,
    6
  )}-${digits.slice(
    6,
    10
  )}`;
}

export default function PhoneInput({
  label,
  value = "",
  onChange,
  placeholder = "(555) 555-5555",
}: PhoneInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input
        type="tel"
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            formatPhone(
              event.target.value
            )
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}