type FormSelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = {
  name: string;

  value?: string;

  options: FormSelectOption[];

  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;

  label?: string;

  placeholder?: string;

  required?: boolean;

  disabled?: boolean;
};

export default function FormSelect({
  name,
  value,
  options,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
}: FormSelectProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <select
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500 disabled:opacity-50"
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}